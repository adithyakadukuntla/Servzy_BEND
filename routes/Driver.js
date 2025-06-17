const express = require('express');
const Driver = require('../models/Driver');
const verifyDriver = require('../utils/verifyDriver'); // Background check function

const router = express.Router();

// Update Driver Details & Trigger Verification
router.post('/details/:id', async (req, res) => {
    try {
        const updatedDriver = await Driver.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // Call verification method after filling details
        const verificationResult = await verifyDriver(updatedDriver);

        if (verificationResult.verified) {
            updatedDriver.verified = true;
            updatedDriver.lastVerificationDate = new Date();
            await updatedDriver.save();
        }

        res.json({ message: "Driver details updated", verified: updatedDriver.verified });
    } catch (error) {
        res.status(500).json({ message: "Error updating details", error });
    }
});

module.exports = router;