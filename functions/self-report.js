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
