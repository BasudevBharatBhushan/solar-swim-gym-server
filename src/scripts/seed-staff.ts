import supabase from '../config/db';
import bcrypt from 'bcryptjs';

async function seedStaff() {
  console.log('🌱 Seeding staff data...');

  // 1. Create Locations if they don't exist
  console.log('Creating locations...');
  const { data: loc1, error: lErr1 } = await supabase
    .from('location')
    .insert({ name: 'North Center' })
    .select()
    .single();

  const { data: loc2, error: lErr2 } = await supabase
    .from('location')
    .insert({ name: 'South Center' })
    .select()
    .single();

  if (lErr1 || lErr2) {
    console.error('Error creating locations:', lErr1?.message || lErr2?.message);
    // Continue anyway, maybe they exist
  }

  const location1Id = loc1?.location_id;
  const location2Id = loc2?.location_id;

  console.log(`Locations: ${location1Id} (North), ${location2Id} (South)`);

  const passwordHash = await bcrypt.hash('password123', 10);

  const staff = [
    {
      first_name: 'Super',
      last_name: 'Admin',
      email: 'superadmin@solar.com',
      password_hash: passwordHash,
      role: 'SUPERADMIN',
      location_id: null
    },
    {
      first_name: 'North',
      last_name: 'Admin',
      email: 'admin1@solar.com',
      password_hash: passwordHash,
      role: 'ADMIN',
      location_id: location1Id
    },
    {
      first_name: 'South',
      last_name: 'Admin',
      email: 'admin2@solar.com',
      password_hash: passwordHash,
      role: 'ADMIN',
      location_id: location2Id
    }
  ];

  for (const person of staff) {
    console.log(`Inserting staff: ${person.email} (${person.role})...`);
    
    // Check if exists
    const { data: existing } = await supabase
      .from('staff')
      .select('staff_id')
      .eq('email', person.email)
      .single();

    if (existing) {
      console.log(`Staff ${person.email} already exists, updating...`);
      const { error: uErr } = await supabase
        .from('staff')
        .update(person)
        .eq('email', person.email);
      if (uErr) console.error(`Error updating ${person.email}:`, uErr.message);
    } else {
      const { error: iErr } = await supabase
        .from('staff')
        .insert(person);
      if (iErr) console.error(`Error inserting ${person.email}:`, iErr.message);
    }
  }

  console.log('✅ Staff seeding complete!');
}

seedStaff().catch(err => {
  console.error('❌ Error seeding staff:', err);
  process.exit(1);
});
