import dotenv from 'dotenv';
import path from 'path';

// Load environment variables immediately
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { supabase } from '../config/supabase';
import { initializeIndices, indexLead } from '../config/elasticsearch';

async function syncLeadsToElasticsearch() {
    console.log('🔄 Starting Lead Sync: Supabase -> Elasticsearch...');

    try {
        // 1. Initialize indices
        await initializeIndices();
        console.log('✅ Elasticsearch indices initialized.');

        // 2. Fetch all leads from Supabase
        const { data: leads, error } = await supabase
            .from('leads')
            .select('*');

        if (error) {
            throw new Error(`Failed to fetch leads from Supabase: ${error.message}`);
        }

        if (!leads || leads.length === 0) {
            console.log('ℹ️ No leads found in Supabase to sync.');
            process.exit(0);
        }

        console.log(`📦 Found ${leads.length} leads in Supabase. Syncing...`);

        // 3. Index each lead
        let successCount = 0;
        let failCount = 0;

        for (const lead of leads) {
            try {
                await indexLead(lead);
                successCount++;
                // Log progress every 10 leads or so
                if (successCount % 10 === 0) {
                    process.stdout.write('.');
                }
            } catch (err) {
                console.error(`\n❌ Failed to index lead ${lead.lead_id}:`, err);
                failCount++;
            }
        }

        console.log(`\n\n✨ Sync Completed!`);
        console.log(`✅ Successfully indexed: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);

        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ SYNC FAILED!', error);
        process.exit(1);
    }
}

syncLeadsToElasticsearch();
