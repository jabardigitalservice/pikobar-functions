const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { PubSub } = require('@google-cloud/pubsub');

/**
 * Stores location data sent from the user's device.
 * 
 * Responds to an HTTP request using data from the request body parsed according
 * to the "content-type" header.
 * 
 * Request body:
 * 
 * {
 *   "data": {
 *      "latitude": -6.914744,
 *      "logitude": 107.609810,
 *      "speed": 30.0,
 *      "activity": "still",        |`still`, `walking`, `on_foot`, `running`, `on_bicycle`, `in_vehicle`|
 *      "battery": {
 *          "isCharging":true,
 *          "level": 80
 *      },
 *      "timestamp":"2020-08-09T20:01:01.123Z"
 *   },
 *   "userId":"Ed5Circ68dSRciE2y7V5UgF1hKT7"
 * }
 * 
 */
exports.locationTracking = functions.https.onRequest(async (req, res) => {
    if (req.get('content-type').includes('application/json')) {
        const requestData = req.body;
        const userId = requestData.userId;
        const locationData = requestData.data;

        // Reference to user locations
        const userLocations = admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('locations');

        // Store location data to firestore
        for(let val of locationData) {
            let data = {
                latitude: val.latitude,
                longitude: val.longitude,
                speed: val.speed,
                activity: val.activity,
                battery: { isCharging: val.battery.isCharging, level: val.battery.level },
                timestamp: admin.firestore.Timestamp.fromDate(new Date(val.timestamp))
            }

            userLocations.add(data);
        }


        /**
         * Pub/Sub Update Location Tracking Topic
         */

        // Init Pub/Sub client
        const pubSubClient = new PubSub();

        // Pub/Sub topic
        const topicName = functions.config().env.tracking.pubsub_topic;
        
        // Prepare message data
        // Add user data
        const userRef = admin.firestore()
            .collection('users')
            .doc(userId);

        const userData = (await userRef.get()).data();
        requestData.user = userData
        
        // Convert message data to json string
        messageData = JSON.stringify(requestData);
        const messageDataBuffer = Buffer.from(messageData);

        console.log(`Location Tracking updated: ${messageData}`);

        // Publish to Pub/Sub
        try {
            const messageId = await pubSubClient.topic(topicName).publish(messageDataBuffer);
            console.log(`Message ${topicName} - ${messageId} published.`);
        } catch (error) {
            console.error(`Received error while publishing: ${topicName} - ${error.message}`);
            return res.status(500).send("Error pub/sub publish message.");
        }

        return res.status(200).send('Recorded');
    } else {
        return res.status(400).send(`Content type not allowed`);
    }
});
