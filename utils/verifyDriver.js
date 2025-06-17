const axios = require('axios');

const verifyDriver = async (driver) => {
    try {
        const response = await axios.post('https://api.backgroundcheckprovider.com/verify', {
            aadharNumber: driver.aadharNumber,
            panNumber: driver.panNumber,
            licenseNumber: driver.licenseNumber
        });

        return { verified: response.data.verified, details: response.data };
    } catch (error) {
        console.error('Verification failed:', error);
        return { verified: false, error: error.message };
    }
};

module.exports = verifyDriver;