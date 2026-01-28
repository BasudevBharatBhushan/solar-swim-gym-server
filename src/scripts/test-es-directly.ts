import { Client } from "@elastic/elasticsearch";
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

const LEADS_INDEX = "leads";

async function testQueryDirectly() {
    const client = new Client({
        node: process.env.ELASTICSEARCH_URL as string,
        auth: process.env.ELASTIC_API_KEY ? { apiKey: process.env.ELASTIC_API_KEY } : undefined
    });

    const terms = ['a', 'aa', 'aar', 'aarav'];

    for (const term of terms) {
        console.log(`\n🧪 Testing term: "${term}"`);

        // Simple query structure to avoid TS issues in this environment
        const body: any = {
            query: {
                bool: {
                    should: [
                        { match_phrase_prefix: { first_name: { query: term, slop: 2 } } },
                        { match_phrase_prefix: { last_name: { query: term, slop: 2 } } },
                        { multi_match: { query: term, fields: ["first_name", "last_name"], fuzziness: "AUTO" } }
                    ]
                }
            }
        };

        try {
            const result = await client.search({
                index: LEADS_INDEX,
                ...body
            });

            const total: any = result.hits.total;
            console.log(`📡 Matches: ${total.value}`);
            if (result.hits.hits.length > 0) {
                result.hits.hits.forEach((h: any) => console.log(`   - ${h._source.first_name} ${h._source.last_name}`));
            }
        } catch (e: any) {
            console.error('❌ Query failed:', e.message);
        }
    }
    process.exit(0);
}

testQueryDirectly();
