
async function testAccount() {
    try {
        console.log('Logging in...');
        // Login with provided credentials
        const loginRes = await fetch('http://localhost:3001/api/v1/auth/staff/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: "priya@kibizsystems.com",
                password: "123456"
            })
        });
        
        const loginData = await loginRes.json();
        
        if (!loginData.token) {
            console.error('Login failed:', loginData);
            return;
        }

        const token = loginData.token;
        const staff = loginData.staff;
        let locationId = staff ? staff.location_id : null;
        
        console.log('Logged in successfully.');
        console.log('Token:', token);

        if (!locationId) {
             console.log('Location ID not in login response, using known test location ID...');
             // Force use of the location known to contain the data from previous steps
             locationId = "490f7013-a95d-4664-b750-1ecbb98bd463";
        }
        
        console.log('Using Location ID:', locationId);

        const accountId = "84865d3a-075d-4412-9ef8-0606c2a1ef60";

        // Fetch Account
        console.log(`Fetching account ${accountId}...`);
        const accountRes = await fetch(`http://localhost:3001/api/v1/accounts/${accountId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'x-location-id': locationId
            }
        });

        const accountData = await accountRes.json();
        console.log('Account Detail:', JSON.stringify(accountData, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

testAccount();
