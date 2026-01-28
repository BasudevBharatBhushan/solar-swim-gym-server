import dotenv from 'dotenv';
import path from 'path';

// Load environment variables immediately
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { searchLeads, indexLead, initializeIndices } from '../config/elasticsearch';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function searchAarav() {
    console.log('🚀 Preparing to search for "aarav"...');

    try {
        // Initialize indices (idempotent-ish)
        try {
            await initializeIndices();
            console.log('✅ Indices initialized/verified.');
        } catch (e: any) {
            console.warn(`⚠️  Elasticsearch init warning: ${e.message}`);
        }

        // Ensure "Aarav" exists in the index
        console.log('📝 Ensuring "Aarav" exists in the index...');
        await indexLead({
            lead_id: 'lead_aarav_001',
            first_name: 'Aarav',
            last_name: 'Patel',
            email: 'aarav.patel@example.com',
            company: 'Solar Tech',
            status: 'new',
            created_at: new Date().toISOString()
        });

        // Give ES time to refresh
        await sleep(2000);

        console.log('🔎 Searching for "aarav" in existing leads...');
        const results = await searchLeads('aarav', 0, 10);

        console.log(`\nFound ${results.total} matches.`);

        if (results.hits && results.hits.length > 0) {
            console.log('\n📄 Results:');
            results.hits.forEach((lead: any) => {
                console.log(` - [${lead.lead_id}] ${lead.first_name} ${lead.last_name} (${lead.email})`);
            });
            console.log('\n✅ "aarav" found!');
        } else {
            console.log('\n❌ No lead named "aarav" found in Elasticsearch index.');
        }

        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ SEARCH FAILED!', error);
        process.exit(1);
    }
}

searchAarav();
