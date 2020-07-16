const functions = require('firebase-functions');
const admin = require('firebase-admin');

// The topic to which to subscribe / unsubscribe.
const topic = 'self_reports';

/**
 * Subscribes / Unsubscribes a device to / from self report FCM topic.
 *
 * Respond only to self report document updates.
 *
 * Whether or not the device is subscribed based on the [remind_me] field: `true` for subscribe;
 * `false` for unsubscribe.
 */
exports.selfReportManageSubscriptions = functions.firestore.document('self_reports/{userId}').onUpdate(async (change, context) => {

    // Get the parameter `{userId}` representing the self report document id
    const userId = context.params.userId;

    // Get an object representing the self report document
    const newValue = change.after.data();

    // access remind_me field
    const remindMe = newValue.remind_me;

    // user tokens
    let userTokens = [];

    // Reference to user tokens
    const userTokensRef = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('tokens');

    // Get all tokens from a user
    await userTokensRef.get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No matching documents.');
                return;
            }

            snapshot.forEach(doc => {
                userTokens.push(doc.data().token);
            });

            return 0;
        })
        .catch(err => {
            console.log('Error getting documents', err);
            return;
        });


    if (remindMe) {
        // Subscribe the devices corresponding to the user tokens to the
        // topic.
        admin.messaging().subscribeToTopic(userTokens, topic)
            .then(function(response) {
                console.log('Successfully subscribed to topic:', response);
                return 0;
            })
            .catch(function(error) {
                console.log('Error subscribing to topic:', error);
            });

    } else {
        // Unsubscribe the devices corresponding to the user tokens from
        // the topic.
        admin.messaging().unsubscribeFromTopic(userTokens, topic)
          .then(function(response) {
            console.log('Successfully unsubscribed from topic:', response);
            return 0;
          })
          .catch(function(error) {
            console.log('Error unsubscribing from topic:', error);
          });
    }

    return 'ok';
  });

/**
 * Unsubscribes a device from self report FCM topic.
 *
 * Respond only to daily report document creations.
 *
 * Unsubscribe automatically when the daily report document `id`
 * is greater than or equal to 14.
 */
exports.selfReportAutoUnsubscribe = functions.firestore.document('self_reports/{userId}/daily_report/{id}').onCreate(async (create, context) => {

    // Get the parameter `{id}` representing the daily report document id
    const id = parseInt(context.params.id);

    // Get the parameter `{userId}` representing the self report document id
    const userId = context.params.userId;

    // user tokens
    let userTokens = [];

    // Reference to user tokens
    const userTokensRef = admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('tokens');

    // Get all tokens from a user
    await userTokensRef.get()
        .then(snapshot => {
            if (snapshot.empty) {
                console.log('No matching documents.');
                return;
            }

            snapshot.forEach(doc => {
                userTokens.push(doc.data().token);
            });

            return 0;
        })
        .catch(err => {
            console.log('Error getting documents', err);
            return;
        });

    if (id >= 14) {
        // Unsubscribe the devices corresponding to the user tokens from
        // the topic.
        admin.messaging().unsubscribeFromTopic(userTokens, topic)
          .then(function(response) {
            console.log('Successfully unsubscribed from topic:', response);
            return 0;
          })
          .catch(function(error) {
            console.log('Error unsubscribing from topic:', error);
          });
    }

    return 'ok';
});

/**
 * Send scheduled self report notifications.
 *
 * This will be run every day at 07:00 WIB.
 */
exports.selfReportScheduledNotification = functions.pubsub.schedule('0 7 * * *').timeZone('Asia/Jakarta').onRun((context) => {

    console.log('Send scheduled self reports notifications');

    // The message payload.
    const payload = {
        notification: {
            title: "👩🏻‍⚕️Sudahkah Anda lapor kesehatan Anda hari ini?",
            body: "Laporkan kesehatan harian Anda di menu Lapor Mandiri sekarang."
        },
        data: {
            click_action: "FCM_PLUGIN_ACTIVITY",
            target: "self_reports",
        }
    };

    // Optional options to alter the message.
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
    };


    // Send a message to devices subscribed to the provided topic.
    admin.messaging().sendToTopic(topic, payload, options)
        .then(function(response) {
            console.log("Successfully sent message:", response);
            return 0;
        })
        .catch(function(error) {
            console.log("Error sending message:", error);
        });

    return null;
});
