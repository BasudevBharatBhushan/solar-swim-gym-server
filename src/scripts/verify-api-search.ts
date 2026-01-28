import axios from 'axios';

async function verifyApiSearch() {
    const BASE_URL = 'http://localhost:3000/api/v1';

    try {
        console.log('🧪 Verifying API search for "Aarav" using Elasticsearch...');
        const res1 = await axios.get(`${BASE_URL}/leads`, {
            params: { page: 1, limit: 10, search: 'Aarav', useElasticsearch: 'true' }
        });

        console.log(`📡 Status: ${res1.status}, Found: ${res1.data.pagination.total}`);
        if (res1.data.data.length > 0) {
            res1.data.data.forEach((l: any) => console.log(`   - ${l.first_name} ${l.last_name}`));
        }

        console.log('\n🧪 Verifying API search for "aa" using Elasticsearch...');
        const res2 = await axios.get(`${BASE_URL}/leads`, {
            params: { page: 1, limit: 10, search: 'aa', useElasticsearch: 'true' }
        });

        console.log(`📡 Status: ${res2.status}, Found: ${res2.data.pagination.total}`);
        if (res2.data.data.length > 0) {
            res2.data.data.slice(0, 5).forEach((l: any) => console.log(`   - ${l.first_name} ${l.last_name}`));
        }

        console.log('\n✅ Verification Script Completed.');
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Verification Failed!');
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
        else console.error(error.message);
        process.exit(1);
    }
}

verifyApiSearch();
