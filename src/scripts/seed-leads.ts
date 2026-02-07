
import dotenv from 'dotenv';
import supabase from '../config/db';
import crmService from '../services/crm.service';

dotenv.config();

const firstNames = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'
];

const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'example.com'];

const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

const generateRandomMobile = () => {
  return `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
};

async function seedLeads() {
  try {
    console.log('🌱 Starting Lead Seeding...');

    // 1. Get a location to attach leads to
    const { data: locations, error: locError } = await supabase
      .from('location')
      .select('location_id')
      .limit(1);

    if (locError || !locations || locations.length === 0) {
      throw new Error('❌ No locations found. Please create a location first.');
    }

    // const locationId = locations[0].location_id;
    const locationId = '490f7013-a95d-4664-b750-1ecbb98bd463';
    console.log(`📍 Using Location ID: ${locationId}`);

    // 2. Generate and Insert 20 Leads
    for (let i = 0; i < 20; i++) {
        const firstName = getRandomElement(firstNames);
        const lastName = getRandomElement(lastNames);
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@${getRandomElement(domains)}`;

        const leadData = {
            location_id: locationId,
            first_name: firstName,
            last_name: lastName,
            email: email,
            mobile: generateRandomMobile(),
            status: 'NEW',
            notes: `Auto-generated test lead #${i + 1}`
        };

        try {
            const createdLead = await crmService.upsertLead(leadData);
            console.log(`✅ [${i + 1}/20] Created Lead: ${createdLead.first_name} ${createdLead.last_name} (${createdLead.lead_id})`);
        } catch (err) {
            console.error(`❌ Failed to create lead ${i + 1}:`, err);
        }
    }

    console.log('✨ Seeding Completed Successfully');
    process.exit(0);

  } catch (error) {
    console.error('❌ Critical Seeding Error:', error);
    process.exit(1);
  }
}

seedLeads();
