import axios from 'axios';

async function testPartialSearch() {
    const BASE_URL = 'http://localhost:3000/api/v1';
    const terms = ['A', 'Aa', 'Aar', 'Sharma'];

    console.log('🧪 Testing partial search terms via API...');

    for (const term of terms) {
        try {
            const response = await axios.get(`${BASE_URL}/leads`, {
                params: {
                    page: 1,
                    limit: 5,
                    search: term,
                    useElasticsearch: 'true'
                }
            });
            console.log(`🔍 Term: "${term}" -> Found: ${response.data.pagination.total} leads`);
            if (response.data.data.length > 0) {
                const names = response.data.data.map((l: any) => `${l.first_name} ${l.last_name}`).join(', ');
                console.log(`   Matches: ${names}`);
            }
        } catch (error: any) {
            console.error(`❌ Failed for term "${term}": ${error.message}`);
        }
    }
}

testPartialSearch();
