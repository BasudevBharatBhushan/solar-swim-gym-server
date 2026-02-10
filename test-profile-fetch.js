
async function testProfile() {
    try {
        // Hardcoded token from test_api.py (decoded: exp: 1770697469, which is far in future)
        const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdGFmZl9pZCI6IjZjNjE3YzM4LWNiZDUtNDAxMy1hYTVjLTgzOGVhOGMyZmZjNCIsInJvbGUiOiJTVVBFUkFETUlOIiwibG9jYXRpb25faWQiOm51bGwsInR5cGUiOiJzdGFmZiIsImlhdCI6MTc3MDYxMTA2OSwiZXhwIjoxNzcwNjk3NDY5fQ.MuhtlbAXeXAvyozDgcgoXYOU2-YLVabBV0Sx2-owdg4";
        const locationId = "490f7013-a95d-4664-b750-1ecbb98bd463";
        
        console.log('Using Hardcoded Token');
        console.log('Using Location ID:', locationId);

        // Fetch Profile
        const profileId = '29fd0fa4-a162-4968-adee-23f14a1cc800';
        const profileRes = await fetch(`http://localhost:3001/api/v1/profiles/${profileId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-location-id': locationId
            }
        });

        const profileData = await profileRes.json();
        console.log('Profile Detail:', JSON.stringify(profileData, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

testProfile();
