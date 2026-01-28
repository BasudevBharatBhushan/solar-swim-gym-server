import { Client } from "@elastic/elasticsearch";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const elasticsearchClient = new Client({
    node: process.env.ELASTICSEARCH_URL,
});

async function debugSearch() {
    const query = "Aa";
    console.log(`🧪 Debugging search for: "${query}"`);

    const bodies = [
        {
            name: "Phrase Prefix",
            query: {
                multi_match: {
                    query,
                    fields: ["first_name", "last_name"],
                    type: "phrase_prefix"
                }
            }
        },
        {
            name: "Wildcard",
            query: {
                wildcard: {
                    first_name: { value: `${query.toLowerCase()}*` }
                }
            }
        },
        {
            name: "Match with Fuzziness",
            query: {
                multi_match: {
                    query,
                    fields: ["first_name", "last_name"],
                    fuzziness: "AUTO"
                }
            }
        },
        {
            name: "Prefix",
            query: {
                prefix: {
                    first_name: { value: query.toLowerCase() }
                }
            }
        }
    ];

    for (const b of bodies) {
        try {
            const result = await elasticsearchClient.search({
                index: "leads",
                query: b.query
            });
            console.log(`❓ ${b.name}: Found ${result.hits.total ? (result.hits.total as any).value : 0}`);
        } catch (e: any) {
            console.log(`❌ ${b.name} failed: ${e.message}`);
        }
    }
}

debugSearch();
