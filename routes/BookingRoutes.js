const express = require('express');
const Booking = require('../models/PhotoSBookings');
const Photographer = require('../models/Photographer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const bookRouter = express.Router();
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

const auth = new GoogleAuth({
  keyFile: './servzy-87f88-firebase-adminsdk-fbsvc-b45300962a.json',
  scopes: ['https://www.googleapis.com/auth/firebase.messaging']
});
const scAuth = new GoogleAuth({
  keyFile: './servzycaptain-firebase-adminsdk-fbsvc-5f2f4d2ace.json',
  scopes: ['https://www.googleapis.com/auth/firebase.messaging']
});
    
// Helper function to send FCM notification
// this function is for servzy captain one for sending notifications to Client or customers
async function sendServzyCaptainFCMNotification(fcmToken, title, body, data = {}) {
  try {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
     console.log("tkn of servzy/ customers",fcmToken)
    const message = {
      message: {
        token: fcmToken,
        notification: {
          title: title,
          body: body
        },
        data: data 
      }
    };

    const projectId = 'servzy-87f88';
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    await axios.post(url, message, {
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      }
    });

    // console.log('FCM Notification sent successfully');


  } catch (error) {
    console.error('Error sending FCM notification:', error);
  }
}
// this one is for servzy to use sproviders token to send notifications to them about new bookings or cancelling of bookings 
async function sendServzyFCMNotification(fcmToken, title, body, data = {}) {
  try {
    const client = await scAuth.getClient();
    const accessToken = await client.getAccessToken();
        console.log("tkn",fcmToken)
    const message = {
      message: {
        token: fcmToken,
        notification: {
          title: title,
          body: body
        },
        data: data
      }
    };

    const projectId = 'servzycaptain';
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    await axios.post(url, message, {
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      }
    });

    // console.log('FCM Notification sent successfully');
  } catch (error) {
    console.error('Error sending FCM notification:', error);
  }
}


bookRouter.get('/',async(req,res)=>{
    res.send({message:"book route"})
})

bookRouter.post('/new-booking', async (req, res) => {
    try {
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
                businessName: serviceProvider.businessName,
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

        const savedBooking = await newBooking.save();
        
        if (savedBooking) {
            res.status(201).json({
                success: true,
                message: "Booking created successfully",
                booking: savedBooking
            });

            // Send FCM notification to service provider
            // console.log("spid fcm token",serviceProvider.fcmToken)
            if (serviceProvider.fcmToken) {
                const title = "New Booking Created";
                const body = `You got a new booking from ${clientDetails.name}`;
                const notificationData = {
                    bookingId: savedBooking._id.toString(),
                    type: 'new_booking',
                    clientName: clientDetails.name
                };

                await sendServzyFCMNotification(serviceProvider.fcmToken, title, body, notificationData);
            } else {
                console.log("No FCM token found for service provider");
            }
        }
        
    } catch (error) {
        res.send({
            success: false,
            message: "Error creating booking",
            error: error.message
        });
    }
});




bookRouter.get('/bookings/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log("uid",userId)

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
    // console.log("Request body:", req.body);

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

        res.status(200).json({
            success: true,
            message: `Booking ${accepted ? 'accepted' : 'rejected'} successfully`,
            booking: updatedBooking
        });

        // Send FCM notification to client
        const clientId = updatedBooking.client[0].clientId;
        const user = await User.findById(clientId);
        
        if (user?.fcmToken) {
            const title = accepted 
                ? `${updatedBooking.serviceProvider[0].businessName} Booking Accepted`
                : `${updatedBooking.serviceProvider[0].businessName} Booking Rejected`;
            
            const body = accepted 
                ? `Your booking has been accepted by ${updatedBooking.serviceProvider[0].name}.`
                : `Your booking has been rejected by ${updatedBooking.serviceProvider[0].name}.`;
            
            const notificationData = {
                bookingId: bookingId,
                type: 'booking_update',
                status: status,
                serviceProvider: updatedBooking.serviceProvider[0].businessName
            };

            await sendServzyCaptainFCMNotification(user.fcmToken, title, body, notificationData);
        } else {
            console.log(`No FCM token found for user ${clientId}`);
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
bookRouter.put('/update/:bookingId/complete', async (req, res) => {
    const bookingId = req.params.bookingId;
    const { completed, status } = req.body;
    // console.log("Request body:", req.body);

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
                status: "completed",
                
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
            totalBookings: 10,
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

// GET refund preview for a booking (optional)
bookRouter.get('/refund/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        const refundData = calculateRefund(booking);

        return res.status(200).json({
            success: true,
            refund: refundData
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});


bookRouter.delete('/cancel/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { userId, cancellationReason } = req.body;

        // Validate required fields
        if (!bookingId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Booking ID and User ID are required'
            });
        }

        // Find the booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Verify the booking belongs to the user
        if (booking.client[0].clientId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to cancel this booking'
            });
        }

        // Check if booking is already cancelled
        if (booking.cancelled) {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        // Check if booking is already rejected
        if (booking.accepted === false) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a rejected booking'
            });
        }

        // Check cancellation policy (2 hours before booking time)
        if (booking.bookDateTime) {
            const bookingTime = new Date(booking.bookDateTime);
            const currentTime = new Date();
            const timeDifference = bookingTime.getTime() - currentTime.getTime();
            const hoursDifference = timeDifference / (1000 * 3600);

            if (hoursDifference <= 2 && hoursDifference > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel booking less than 2 hours before scheduled time'
                });
            }

            if (hoursDifference <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot cancel past bookings'
                });
            }
        }

        // Calculate refund amount
        const refundData = calculateRefund(booking);

        // Update booking status
        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            {
                cancelled: true,
                cancelledAt: new Date(),
                cancelledBy: 'client',
                cancellationReason: cancellationReason || 'No reason provided',
                status: 'cancelled',
                refundAmount: refundData.refundAmount,
                refundPercentage: refundData.refundPercentage,
                refundStatus: refundData.refundAmount > 0 ? 'pending' : 'none',
                accepted:false,
                completed:false
            },
            { new: true }
        );

        

        // Send FCM notification to service provider
        const photographer = await Photographer.findById(booking.serviceProvider[0].serviceProviderId);
        if (photographer?.fcmToken) {
            await sendServzyFCMNotification(
                photographer.fcmToken,
                'Booking Cancelled',
                `${booking.client[0].name} has cancelled their booking`,
                {
                    bookingId: bookingId,
                    type: 'booking_cancelled',
                    clientName: booking.client[0].name
                }
            );
        }

        // Process refund if applicable
        if (refundData.refundAmount > 0) {
            await processRefund(booking, refundData);
        }

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            booking: updatedBooking,
            refund: {
                amount: refundData.refundAmount,
                percentage: refundData.refundPercentage,
                status: refundData.refundAmount > 0 ? 'pending' : 'none'
            }
        });

    } catch (error) {
        console.error('Error cancelling booking:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

// Helper function to calculate refund
function calculateRefund(booking) {
    const bookingTime = new Date(booking.bookDateTime);
    const currentTime = new Date();
    const hoursDifference = (bookingTime.getTime() - currentTime.getTime()) / (1000 * 3600);
    
    let refundPercentage = 0;
    
    if (hoursDifference > 48) {
        refundPercentage = 100; // Full refund if cancelled 48+ hours before
    } else if (hoursDifference > 24) {
        refundPercentage = 75; // 75% refund if cancelled 24-48 hours before
    } else if (hoursDifference > 12) {
        refundPercentage = 50; // 50% refund if cancelled 12-24 hours before
    } else if (hoursDifference > 2) {
        refundPercentage = 25; // 25% refund if cancelled 2-12 hours before
    }
    
    const refundAmount = (booking.money * refundPercentage) / 100;
    
    return {
        refundAmount: Math.round(refundAmount),
        refundPercentage
    };
}

// // Helper function to create notification
// async function createNotification(notificationData) {
//     try {
//         const notification = new Notification(notificationData);
//         await notification.save();
//         console.log('Notification created successfully');
//     } catch (error) {
//         console.error('Error creating notification:', error);
//     }
// }

// Helper function to process refund
async function processRefund(booking, refundData) {
    try {
        console.log(`Processing refund of ₹${refundData.refundAmount} for booking ${booking._id}`);
        
        // Here you would integrate with your payment gateway
        // For example: Razorpay, Stripe, etc.
        
        // Update booking with refund status
        await Booking.findByIdAndUpdate(booking._id, {
            refundStatus: 'processed',
            refundProcessedAt: new Date(),
            paymentStatus: refundData.refundPercentage === 100 ? 'refunded' : 'partially_refunded'
        });
        
        // Create notification for client about refund
        await createNotification({
            recipient: booking.client[0].clientId,
            recipientType: 'User',
            senderType: 'System',
            type: 'refund_processed',
            title: 'Refund Processed',
            message: `Your refund of ₹${refundData.refundAmount} has been processed and will be credited to your account within 5-7 business days`,
            bookingId: booking._id,
            data: {
                refundAmount: refundData.refundAmount,
                refundPercentage: refundData.refundPercentage
            },
            priority: 'medium'
        });
        
    } catch (error) {
        console.error('Error processing refund:', error);
    }
}

// // Get notifications for user
// bookRouter.get('/notifications/:userId', async (req, res) => {
//     try {
//         const { userId } = req.params;
//         const { page = 1, limit = 20, unreadOnly = false } = req.query;
        
//         const query = { recipient: userId };
//         if (unreadOnly === 'true') {
//             query.read = false;
//         }
        
//         const notifications = await Notification.find(query)
//             .populate('bookingId', 'bookDateTime serviceType money')
//             .sort({ createdAt: -1 })
//             .limit(limit * 1)
//             .skip((page - 1) * limit);
            
//         const totalCount = await Notification.countDocuments(query);
//         const unreadCount = await Notification.countDocuments({ 
//             recipient: userId, 
//             read: false 
//         });
        
//         res.status(200).json({
//             success: true,
//             notifications,
//             pagination: {
//                 currentPage: page,
//                 totalPages: Math.ceil(totalCount / limit),
//                 totalCount,
//                 unreadCount
//             }
//         });
        
//     } catch (error) {
//         console.error('Error fetching notifications:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error fetching notifications',
//             error: error.message
//         });
//     }
// });

// // Mark notification as read
// bookRouter.put('/notifications/:notificationId/read', async (req, res) => {
//     try {
//         const { notificationId } = req.params;
        
//         const notification = await Notification.findByIdAndUpdate(
//             notificationId,
//             { 
//                 read: true, 
//                 readAt: new Date() 
//             },
//             { new: true }
//         );
        
//         if (!notification) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Notification not found'
//             });
//         }
        
//         res.status(200).json({
//             success: true,
//             message: 'Notification marked as read',
//             notification
//         });
        
//     } catch (error) {
//         console.error('Error marking notification as read:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Error updating notification',
//             error: error.message
//         });
//     }
// });




module.exports = bookRouter;
