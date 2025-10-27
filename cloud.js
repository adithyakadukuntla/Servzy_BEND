const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');

const auth = new GoogleAuth({
  keyFile: './servzycaptain-firebase-adminsdk-fbsvc-5f2f4d2ace.json',
  scopes: ['https://www.googleapis.com/auth/firebase.messaging']
});

async function sendNotification() {
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();

  const message = {
    message: {
      token: 'fxWff9uaQRyJt7bawifYRF:APA91bESD21TA6U1DEv5gAJ1cQDNcnWL0G2dKb4NIb9djuzk6Ynbak8IJUHr8jr_Ro6ZJt7FBiTJJMGl4gHdOlAi8U2nv6K0UGA9xesYxhXy0S9bIcJvpFQ',
      notification: {
        title: 'Booking Confirmed!',
        body: 'Servzy Captain accepted your booking!'
      },
      data: {
        bookingId: '12345',
        type: 'booking_update'
      }
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

  console.log('Notification sent');
}

sendNotification();
