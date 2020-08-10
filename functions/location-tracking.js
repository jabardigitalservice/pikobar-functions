const functions = require('firebase-functions');
const admin = require('firebase-admin');

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
exports.locationTracking = functions.https.onRequest((req, res) => {
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

        res.status(200).send('Recorded');
    } else {
        res.status(400).send(`Content type not allowed`);
    }
});
