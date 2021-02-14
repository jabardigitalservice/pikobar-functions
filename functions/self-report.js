const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { PubSub } = require('@google-cloud/pubsub');


exports.testPubSub = functions.https.onRequest(async (request, response) => {
    // Init Pub/Sub client
    const pubSubClient = new PubSub();

    // Pub/Sub topic
    const topicName = functions.config().env.self_report.pubsub_topic;

    // Convert message data to json string
    messageData = JSON.stringify({foo: 'bar'});
    const messageDataBuffer = Buffer.from(messageData);

    try {
        const messageId = await pubSubClient.topic(topicName).publish(messageDataBuffer);
        console.log(`Message ${topicName} - ${messageId} published.`);
    } catch (error) {
        console.error(`Received error while publishing: ${topicName} - ${error.message}`);
        return response.status(500).send("Error.");
    }

    return response.send("OK.");
});

exports.selfReportCreatedPubsub = functions.firestore.document('self_reports/{userId}/daily_report/{id}').onCreate(async (snap, context) => {
    // Get the parameter `{id}` representing the daily report document id
    const id = parseInt(context.params.id);

    // Get the parameter `{userId}` representing the self report document id
    const userId = context.params.userId;

    // Get the new data created
    const newValue = snap.data();
    console.log(`Self Report Created: ${userId}, ${id}, ${newValue}`);

    // Get user data
    const userRef = admin.firestore()
        .collection('users')
        .doc(userId);

    const userData = (await userRef.get()).data();

    // Prepare pub/sub message data
    const pubData = {
        user_id: userId,
        action: "create",
        created_at: newValue.created_at,
        body_temp: newValue.body_temperature,
        symptoms: newValue.indications,
        location: newValue.location,
        user: userData,
    };

    // Init Pub/Sub client
    const pubSubClient = new PubSub();

    // Pub/Sub topic
    const topicName = functions.config().env.self_report.pubsub_topic;

    // Convert message data to json string
    messageJsonString = JSON.stringify(pubData);
    const messageBuffer = Buffer.from(messageJsonString);

    console.log(`Self Report Pub/Sub message data: ${messageJsonString}`);

    // Publish to Pub/Sub
    try {
        const messageId = await pubSubClient.topic(topicName).publish(messageBuffer);
        console.log(`Message ${topicName} - ${messageId} published.`);
    } catch (error) {
        console.error(`Received error while publishing: ${topicName} - ${error.message}`);
        return 'error';
    }

    return 'ok';
});