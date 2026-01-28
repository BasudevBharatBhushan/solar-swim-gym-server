import { supabase } from '../config/supabase';
import { indexLead } from '../config/elasticsearch';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function seedLeads() {
    console.log('🌱 Seeding leads...');
    const leads = [
        { first_name: 'Aarav', last_name: 'Sharma', email: 'aarav.sharma@example.com', status: 'new' },
        { first_name: 'Aarav', last_name: 'Patel', email: 'aarav.patel@example.com', status: 'contacted' },
        { first_name: 'Aarya', last_name: 'Singhania', email: 'aarya@example.com', status: 'qualified' },
        { first_name: 'Amit', last_name: 'Kumar', email: 'amit@example.com', status: 'new' },
        { first_name: 'Bharat', last_name: 'Bhushan', email: 'bharat@example.com', status: 'new' }
    ];

    for (const lead of leads) {
        const { data, error } = await supabase.from('leads').insert(lead).select().single();
        if (error) {
            console.error(`❌ Failed to seed ${lead.first_name}: ${error.message}`);
        } else {
            console.log(`✅ Seeded ${lead.first_name} to Supabase`);
            await indexLead(data);
        }
    }
    process.exit(0);
}

seedLeads();
