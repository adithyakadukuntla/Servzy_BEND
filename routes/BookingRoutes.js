const express = require('express');
const Booking = require('../models/PhotoSBookings');
const Photographer = require('../models/Photographer')
const bookRouter = express.Router();
const User = require('../models/User')
const axios = require('axios');

bookRouter.post('/new-booking', async (req, res) => {
    try {
        // console.log("Request body:", req.body);
        
        const { 
            clientDetails, 
            serviceType, 
            serviceProvider, 
            serviceSelected, 
            money,
            bookDate,
            bookTime,
            bookDateTime
        } = req.body;

        // Validate combined date and time
        const selectedDateTime = new Date(bookDateTime);
        const currentDateTime = new Date();
        
        if (selectedDateTime <= currentDateTime) {
            return res.status(400).json({
                success: false,
                message: "Booking date and time cannot be in the past"
            });
        }
    
        // Create new booking
        const newBooking = new Booking({
            client: [{
                clientId: clientDetails._id, 
                name: clientDetails.name,
                email: clientDetails.email,
                phone: clientDetails.phone,
                gender: clientDetails.gender,
                address: clientDetails.location
            }],
            serviceType: serviceType,
            serviceProvider: [{
                serviceProviderId: serviceProvider._id,
                businessName:serviceProvider.businessName,
                name: serviceProvider.name,
                email: serviceProvider.email,
                phone: serviceProvider.phone,
                serviceSelected: serviceSelected,
                rating: serviceProvider.rating,
                totalShoots: serviceProvider.totalShoots
            }],
            money: money,
            bookDate: new Date(bookDate),
            bookTime: new Date(bookTime),
            bookDateTime: selectedDateTime,
        });
        // console.log("new ",newBooking)
        // Save to db
        const savedBooking = await newBooking.save();
        
        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking: savedBooking
        });
        
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: "Error creating booking",
            error: error.message
        });
    }
});



bookRouter.get('/bookings/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Find bookings where the client array contains the userId
        const bookings = await Booking.find({
            'client.clientId': userId
        }).sort({ createdAt: -1 }); // Sort by newest first

        // console.log("Bookings found:", bookings);

        if (bookings.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No bookings found for this user",
                bookings: []
            });
        }

        res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            count: bookings.length,
            bookings: bookings
        });

    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error: error.message
        });
    }
});

bookRouter.get('/serv-bookings/:servicePID', async (req, res) => {
    const servicePID = req.params.servicePID;

    try {
        const bookings = await Booking.find({
            'serviceProvider.serviceProviderId': servicePID
        }).sort({ createdAt: -1 });

        if (bookings.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No bookings found for this user",
                bookings: []
            });
        }

        res.status(200).json({
            success: true,
            message: "Bookings retrieved successfully",
            count: bookings.length,
            bookings: bookings
        });

    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error: error.message
        });
    }
});


// Update booking accepted status
bookRouter.put('/update-booking/:bookingId', async (req, res) => {
    const bookingId = req.params.bookingId;
    const { accepted, status } = req.body;
    console.log("Request body:", req.body);

    try {
        // Validate accepted value
        if (typeof accepted !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'accepted must be true or false'
            });
        }

        let updatedBooking;
        
        if (status === 'accepted' && accepted === true) {
            // When accepting a booking, increment totalShoots
            updatedBooking = await Booking.findByIdAndUpdate(
                bookingId,
                { 
                    accepted: accepted,
                    status: status,
                    updatedAt: new Date()
                },
                { 
                    new: true, 
                    runValidators: true 
                }
            );

            if (updatedBooking) {
                // Increment totalShoots for the service provider
                const serviceProviderId = updatedBooking.serviceProvider[0].serviceProviderId;
                
                // Update photographer's totalShoots count
                await Photographer.findByIdAndUpdate(
                    serviceProviderId,
                    { $inc: { totalShoots: 1 } },
                    { new: true }
                );

                console.log(`Total shoots incremented for service provider: ${serviceProviderId}`);
            }
        } else {
            // When rejecting a booking
            updatedBooking = await Booking.findByIdAndUpdate(
                bookingId,
                { 
                    accepted: accepted,
                    status: status || (accepted ? 'accepted' : 'rejected'),
                    completed: false,
                    updatedAt: new Date()
                },
                { 
                    new: true, 
                    runValidators: true 
                }
            );
        }

        if (!updatedBooking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        console.log(`Booking ${bookingId} ${accepted ? 'accepted' : 'rejected'}`);

        res.status(200).json({
            success: true,
            message: `Booking ${accepted ? 'accepted' : 'rejected'} successfully`,
            booking: updatedBooking
        });
        

           const clientId = updatedBooking.client[0].clientId;

            // Fetch client (or user) to get the expoPushToken
            const user = await User.findById(clientId);

            if (user?.expoPushToken) {
            await axios.post('https://exp.host/--/api/v2/push/send', {
                to: user.expoPushToken,
                title: accepted ? 'Booking Accepted!' : 'Booking Rejected',
                body: accepted 
                ? 'Your booking has been accepted by the provider.' 
                : 'Your booking has been rejected by the provider.'
            });
            } else {
            console.log(`No Expo push token found for user ${clientId}`);
            }


    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating booking',
            error: error.message
        });
    }
});

// Update booking completed status
bookRouter.put('/update-bookingcomplete/:bookingId', async (req, res) => {
    const bookingId = req.params.bookingId;
    const { completed, status } = req.body;
    console.log("Request body:", req.body);

    try {
        // Validate completed value
        if (typeof completed !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'completed must be true or false'
            });
        }

        // Find and update the booking
        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { 
                completed: completed,
                $inc: { "serviceProvider.0.totalShoots": 1 },
                status: status,
                
                updatedAt: new Date()
            },
            { 
                new: true, 
                runValidators: true 
            }
        );

        if (!updatedBooking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }


        res.status(200).json({
            success: true,
            message: `Booking ${completed ? 'completed' : 'updated'} successfully`,
            booking: updatedBooking
        });

    } catch (error) {
        console.error('Error updating booking:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating booking',
            error: error.message
        });
    }
});


// Get booking statistics for service provider
bookRouter.get('/stats/:servicePID', async (req, res) => {
    const servicePID = req.params.servicePID;

    try {
        const stats = await Booking.aggregate([
            {
                $match: {
                    'serviceProvider.0.serviceProviderId': servicePID  // Fixed: Access array element
                }
            },
            {
                $group: {
                    _id: null,
                    totalBookings: { $sum: 1 },
                    acceptedBookings: {
                        $sum: { $cond: [{ $eq: ['$accepted', true] }, 1, 0] }
                    },
                    rejectedBookings: {
                        $sum: { $cond: [{ $eq: ['$accepted', false] }, 1, 0] }
                    },
                    pendingBookings: {
                        $sum: { $cond: [{ $eq: ['$accepted', null] }, 1, 0] }
                    },
                    completedBookings: {  // Added: Track completed bookings
                        $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
                    },
                    totalRevenue: {
                        $sum: { $cond: [{ $eq: ['$accepted', true] }, '$money', 0] }
                    },
                    averageBookingValue: {
                        $avg: { $cond: [{ $eq: ['$accepted', true] }, '$money', null] }
                    },
                    highestBookingValue: {
                        $max: { $cond: [{ $eq: ['$accepted', true] }, '$money', 0] }
                    },
                    lowestBookingValue: {  // Added: Track lowest booking value
                        $min: { $cond: [{ $eq: ['$accepted', true] }, '$money', null] }
                    },
                    thisMonthBookings: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gte: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                                        { $lt: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    thisMonthRevenue: {  // Added: Track this month's revenue
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$accepted', true] },
                                        { $gte: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                                        { $lt: ['$createdAt', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)] }
                                    ]
                                },
                                '$money',
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalBookings: 0,
            acceptedBookings: 0,
            rejectedBookings: 0,
            pendingBookings: 0,
            completedBookings: 0,
            totalRevenue: 0,
            averageBookingValue: 0,
            highestBookingValue: 0,
            lowestBookingValue: 0,
            thisMonthBookings: 0,
            thisMonthRevenue: 0
        };

        // Calculate additional metrics
        result.acceptanceRate = result.totalBookings > 0 
            ? ((result.acceptedBookings / result.totalBookings) * 100).toFixed(1)
            : 0;

        result.completionRate = result.acceptedBookings > 0
            ? ((result.completedBookings / result.acceptedBookings) * 100).toFixed(1)
            : 0;

        res.status(200).json({
            success: true,
            stats: result
        });

    } catch (error) {
        console.error('Error fetching booking stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking statistics',
            error: error.message
        });
    }
});





module.exports = bookRouter;
