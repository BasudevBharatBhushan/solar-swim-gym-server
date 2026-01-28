import { Client } from "@elastic/elasticsearch";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkVersion() {
    try {
        const client = new Client({
            node: process.env.ELASTICSEARCH_URL,
            auth: process.env.ELASTIC_API_KEY ? { apiKey: process.env.ELASTIC_API_KEY } : undefined
        });
        const info = await client.info();
        console.log('ES Info:', JSON.stringify(info, null, 2));
    } catch (e: any) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

checkVersion();
