
import dotenv from 'dotenv';
import SignedWaiverService from '../services/SignedWaiverService';

dotenv.config();

const linkProfile = async () => {
    const signedWaiverId = '8b425a4f-47e7-471f-ace6-331b147c6947';
    const profileId = '40d205ed-5897-48e5-8416-0f749e233d46';
    const locationId = '490f7013-a95d-4664-b750-1ecbb98bd463';

    try {
        console.log(`Trying to link profile ${profileId} to waiver ${signedWaiverId} at location ${locationId}...`);
        
        const result = await SignedWaiverService.linkProfileToWaiver(signedWaiverId, profileId, locationId);
        
        console.log('Result:', result);
    } catch (error: any) {
        console.error('Error linking profile to waiver:', error.message);
    }
};

linkProfile();
