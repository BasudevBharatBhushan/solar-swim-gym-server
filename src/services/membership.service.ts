import supabase from '../config/db';
import { 
  MembershipProgram, 
  MembershipProgramCategory, 
  MembershipFee, 
  MembershipEligibilityRule, 
  MembershipService 
} from '../types';

interface MembershipProgramFull extends MembershipProgram {
  categories: (MembershipProgramCategory & {
    fees: MembershipFee[];
    rules: MembershipEligibilityRule[];
  })[];
  services: MembershipService[]; // Program-level services
}

export const getAllPrograms = async (locationId: string): Promise<MembershipProgramFull[]> => {
  if (!locationId) throw new Error('Location ID required');

  // 1. Fetch Programs
  const { data: programs, error: progErr } = await supabase
    .from('membership_program')
    .select('*')
    .eq('location_id', locationId);
  
  if (progErr) throw new Error(progErr.message);
  if (!programs || programs.length === 0) return [];

  const programIds = programs.map(p => p.membership_program_id);

  // 2. Fetch Categories
  const { data: categories, error: catErr } = await supabase
    .from('membership_program_category')
    .select('*')
    .in('membership_program_id', programIds);

  if (catErr) throw new Error(catErr.message);

  const categoryIds = categories?.map(c => c.category_id) || [];

  // 3. Fetch Fees
  const { data: fees, error: feeErr } = await supabase
    .from('membership_fee')
    .select('*')
    .in('category_id', categoryIds);

  if (feeErr) throw new Error(feeErr.message);

  // 4. Fetch Rules
  const { data: rules, error: ruleErr } = await supabase
    .from('membership_eligibility_rule')
    .select('*')
    .in('category_id', categoryIds);
  
  if (ruleErr) throw new Error(ruleErr.message);

  // 5. Fetch Services (Can be linked to Program or Category)
  const { data: services, error: svcErr } = await supabase
    .from('membership_service')
    .select('*')
    .in('membership_program_id', programIds);

  if (svcErr) throw new Error(svcErr.message);

  // Assembly
  return programs.map(prog => {
    const progCats = categories?.filter(c => c.membership_program_id === prog.membership_program_id) || [];
    const progServices = services?.filter(s => s.membership_program_id === prog.membership_program_id) || [];

    const categoriesWithDetails = progCats.map(cat => {
      return {
        ...cat,
        fees: fees?.filter(f => f.category_id === cat.category_id) || [],
        rules: rules?.filter(r => r.category_id === cat.category_id) || []
      };
    });

    return {
      ...prog,
      categories: categoriesWithDetails,
      services: progServices
    };
  });
};

export const getProgramById = async (programId: string): Promise<MembershipProgramFull | null> => {
  if (!programId) throw new Error('Program ID required');

  // 1. Fetch Program
  const { data: program, error: progErr } = await supabase
    .from('membership_program')
    .select('*')
    .eq('membership_program_id', programId)
    .single();

  if (progErr) throw new Error(progErr.message);
  if (!program) return null;

  // 2. Fetch Categories
  const { data: categories, error: catErr } = await supabase
    .from('membership_program_category')
    .select('*')
    .eq('membership_program_id', programId);

  if (catErr) throw new Error(catErr.message);

  const categoryIds = categories?.map(c => c.category_id) || [];

  // 3. Fetch Fees
  let fees: MembershipFee[] = [];
  if (categoryIds.length > 0) {
      const { data, error } = await supabase
        .from('membership_fee')
        .select('*')
        .in('category_id', categoryIds);
      if (error) throw new Error(error.message);
      fees = data || [];
  }

  // 4. Fetch Rules
  let rules: MembershipEligibilityRule[] = [];
  if (categoryIds.length > 0) {
      const { data, error } = await supabase
        .from('membership_eligibility_rule')
        .select('*')
        .in('category_id', categoryIds);
      if (error) throw new Error(error.message);
      rules = data || [];
  }

  // 5. Fetch Services
  const { data: services, error: svcErr } = await supabase
    .from('membership_service')
    .select('*')
    .eq('membership_program_id', programId);

  if (svcErr) throw new Error(svcErr.message);

  // Assembly
  const progCategories = categories?.map(cat => ({
      ...cat,
      fees: fees.filter(f => f.category_id === cat.category_id),
      rules: rules.filter(r => r.category_id === cat.category_id)
  })) || [];

  const progServices = services || [];

  return {
      ...program,
      categories: progCategories,
      services: progServices
  };
};

interface UpsertProgramPayload extends MembershipProgram {
  categories?: (MembershipProgramCategory & {
    fees?: MembershipFee[];
    rules?: MembershipEligibilityRule[];
  })[];
  services?: MembershipService[];
}

export const upsertProgram = async (data: UpsertProgramPayload): Promise<MembershipProgramFull | null> => {
    const { categories, services, location_id, ...programData } = data;
    
    if (!location_id) throw new Error('Location ID required');

    // 1. Upsert Program
    const { data: progResult, error: progErr } = await supabase
      .from('membership_program')
      .upsert({ ...programData, location_id })
      .select('membership_program_id')
      .single();
    
    if (progErr) throw new Error(progErr.message);
    const programId = progResult.membership_program_id;

    // 2. Upsert Categories
    if (categories) {
      for (const cat of categories) {
        const { fees, rules, services: _services, ...catData } = cat as any;
        
        const { data: catResult, error: catErr } = await supabase
          .from('membership_program_category')
          .upsert({ ...catData, membership_program_id: programId })
          .select('category_id')
          .single();
        
        if (catErr) throw new Error(catErr.message);
        const categoryId = catResult.category_id;

        // Fees
        if (fees) {
          for (const fee of fees) {
             await supabase.from('membership_fee').upsert({ ...fee, category_id: categoryId });
          }
        }

        // Rules
        if (rules) {
          for (const rule of rules) {
             await supabase.from('membership_eligibility_rule').upsert({ ...rule, category_id: categoryId });
          }
        }
      }
    }

    // 3. Upsert Program Level Services
    if (services) {
      for (const s of services) {
        await supabase.from('membership_service').upsert({
           ...s,
           membership_program_id: programId
        });
      }
    }

    // Return the specific program using our new getter
    return getProgramById(programId);
};

export default {
  getAllPrograms,
  upsertProgram,
  getProgramById
};
