import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error';

/**
 * Get all contracts for an account
 */
export const getContracts = async (accountId: string) => {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError('Failed to fetch contracts', 500);
  }

  return data;
};

/**
 * Get a specific contract by ID
 */
export const getContractById = async (contractId: string, accountId: string) => {
  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('contract_id', contractId)
    .eq('account_id', accountId)
    .single();

  if (error || !data) {
    throw new AppError('Contract not found', 404);
  }

  return data;
};

/**
 * Sign a contract
 */
export const signContract = async (contractId: string, accountId: string) => {
  // First verify the contract belongs to this account
  const contract = await getContractById(contractId, accountId);

  if (contract.is_signed) {
    throw new AppError('Contract is already signed', 400);
  }

  const { data, error } = await supabase
    .from('contracts')
    .update({
      is_signed: true,
      signed_at: new Date().toISOString()
    })
    .eq('contract_id', contractId)
    .eq('account_id', accountId)
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to sign contract', 500);
  }

  return data;
};

/**
 * Create a new contract (typically used by admin/system)
 */
export const createContract = async (
  accountId: string,
  contractPdf: string,
  startDate?: Date,
  expiryDate?: Date
) => {
  const { data, error } = await supabase
    .from('contracts')
    .insert({
      account_id: accountId,
      contract_pdf: contractPdf,
      is_signed: false,
      start_date: startDate?.toISOString().split('T')[0],
      expiry_date: expiryDate?.toISOString().split('T')[0]
    })
    .select()
    .single();

  if (error) {
    throw new AppError('Failed to create contract', 500);
  }

  return data;
};
