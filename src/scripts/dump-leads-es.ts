import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { elasticsearchClient } from '../config/elasticsearch';

async function dumpLeads() {
    console.log('📦 Dumping all leads from Elasticsearch...');
    try {
        const result = await elasticsearchClient.search({
            index: "leads",
            query: { match_all: {} }
        });

        const total = result.hits.total ? (typeof result.hits.total === 'number' ? result.hits.total : (result.hits.total as any).value) : 0;
        console.log(`Total hits: ${total}`);
        result.hits.hits.forEach((hit: any) => {
            console.log(` - ID: ${hit._id}, Name: ${hit._source.first_name} ${hit._source.last_name}`);
        });
    } catch (e: any) {
        console.error('❌ Failed to dump leads:', e.message);
    }
}

dumpLeads();
