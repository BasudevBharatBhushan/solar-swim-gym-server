import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { elasticsearchClient, LEADS_INDEX } from '../config/elasticsearch';

async function deleteIndex() {
    console.log(`🗑️ Deleting index: ${LEADS_INDEX}...`);
    try {
        await elasticsearchClient.indices.delete({ index: LEADS_INDEX });
        console.log('✅ Index deleted successfully.');
    } catch (e: any) {
        console.error('❌ Failed to delete index:', e.message);
    }
    process.exit(0);
}

deleteIndex();
