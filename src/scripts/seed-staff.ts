import supabase from '../config/db';
import bcrypt from 'bcryptjs';

async function seedStaff() {
  console.log('🌱 Seeding locations & staff data...');

  // 1. Seed Locations (upsert by location_id)
  const locations = [
    {
      location_id: '648ee19b-f7a4-4891-b2ab-db2e950104ba',
      name: 'Concord Swim Club',
      address: '21 Riverwalk Rd, Concord, CA',
      city: 'Concord',
      state: 'CA',
      zip_code: '94520',
      phone: '+1-925-555-1001',
      email: 'concord@swimclub.com',
      timezone: 'America/Los_Angeles'
    },
    {
      location_id: 'c1de8155-ba8c-4dfd-9f49-ff07f51c0ac6',
      name: 'Glass Court Swim and Fitness',
      address: '88 Court Street, San Jose, CA',
      city: 'San Jose',
      state: 'CA',
      zip_code: '95112',
      phone: '+1-408-555-2002',
      email: 'glasscourt@fitness.com',
      timezone: 'America/Los_Angeles'
    },
    {
      location_id: '490f7013-a95d-4664-b750-1ecbb98bd463',
      name: 'Solar Swim and Gym',
      address: '450 Solar Ave, Fremont, CA',
      city: 'Fremont',
      state: 'CA',
      zip_code: '94538',
      phone: '+1-510-555-3003',
      email: 'admin@solarswimgym.com',
      timezone: 'America/Los_Angeles'
    }
  ];

  console.log('📍 Seeding locations...');
  const { error: locErr } = await supabase
    .from('location')
    .upsert(locations, { onConflict: 'location_id' });

  if (locErr) {
    console.error('❌ Error seeding locations:', locErr.message);
    return;
  }

  console.log('✅ Locations seeded');

  // 2. Seed Staff
  const passwordHash = await bcrypt.hash('123456', 10);

  const staff = [
    {
      first_name: 'Wint',
      last_name: 'Lwin',
      email: 'wlwininvest@gmail.com',
      password_hash: passwordHash,
      role: 'SUPERADMIN',
      location_id: null
    },
    {
      first_name: 'Priyabrata',
      last_name: 'Sahoo',
      email: 'priya@kibizsystems.com',
      password_hash: passwordHash,
      role: 'SUPERADMIN',
      location_id: null
    },
    {
      first_name: 'Karla',
      last_name: 'Bravo',
      email: 'karlabr1605@gmail.com',
      password_hash: passwordHash,
      role: 'ADMIN',
      location_id: '490f7013-a95d-4664-b750-1ecbb98bd463' // Solar Swim and Gym
    }
  ];

  console.log('👤 Seeding staff...');
  for (const person of staff) {
    const { data: existing } = await supabase
      .from('staff')
      .select('staff_id')
      .eq('email', person.email)
      .single();

    if (existing) {
      const { error: uErr } = await supabase
        .from('staff')
        .update(person)
        .eq('email', person.email);

      if (uErr) console.error(`❌ Error updating ${person.email}:`, uErr.message);
      else console.log(`🔁 Updated ${person.email}`);
    } else {
      const { error: iErr } = await supabase
        .from('staff')
        .insert(person);

      if (iErr) console.error(`❌ Error inserting ${person.email}:`, iErr.message);
      else console.log(`➕ Inserted ${person.email}`);
    }
  }

  console.log('✅ Staff seeding complete!');
}

seedStaff().catch(err => {
  console.error('❌ Fatal seeding error:', err);
  process.exit(1);
});
