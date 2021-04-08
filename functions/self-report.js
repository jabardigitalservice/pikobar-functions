const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { PubSub } = require('@google-cloud/pubsub');

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
        report_id: id,
        user_id: userId,
        action: "create",
        created_at: newValue.created_at,
        body_temp: newValue.body_temperature,
        symptoms: parseSymptoms(newValue.indications),
        location: newValue.location,
        user: userData,
    };

    const result = publishMessageTopic(pubData);

    if (result === false) {
        return 'error';
    }

    return 'ok';
});

exports.selfReportUpdatedPubsub = functions.firestore.document('self_reports/{userId}/daily_report/{id}').onUpdate(async (change, context) => {
    // Get the parameter `{id}` representing the daily report document id
    const id = parseInt(context.params.id);

    // Get the parameter `{userId}` representing the self report document id
    const userId = context.params.userId;

    // Get the new data updated
    const newValue = change.after.data();
    console.log(`Self Report Updated: ${userId}, ${id}, ${newValue}`);

    // Get user data
    const userRef = admin.firestore()
        .collection('users')
        .doc(userId);

    const userData = (await userRef.get()).data();

    // Prepare pub/sub message data
    const pubData = {
        report_id: id,
        user_id: userId,
        action: "edit",
        created_at: newValue.created_at,
        body_temp: newValue.body_temperature,
        symptoms: parseSymptoms(newValue.indications),
        location: newValue.location,
        user: userData,
    };

    const result = publishMessageTopic(pubData);

    if (result === false) {
        return 'error';
    }

    return 'ok';
});

function parseSymptoms(input) {
    var symptomsArray = [];

    if (typeof input !== 'undefined' && input !== null && input !== '') {
        const regexp = /\w+( +\w+)*/g;

        symptomsArray = input.match(regexp);
    }
    
    return symptomsArray;
}

exports.selfOtherReportCreatedPubsub = functions.firestore.document('self_reports/{userId}/other_report/{personId}/daily_report/{id}').onCreate(async (snap, context) => {
    // Get the parameter `{id}` representing the daily report document id
    const id = parseInt(context.params.id);

    // Get the parameter `{userId}` representing the self report document id
    const userId = context.params.userId;
    const personId = context.params.personId;

    // Get the new data created
    const newValue = snap.data();
    console.log(`Self Other Report Created: ${userId}, ${personId}, ${id}, ${newValue}`);

    // Get user data
    const userRef = admin.firestore()
        .collection('users')
        .doc(userId);

    const userData = (await userRef.get()).data();

    // Prepare pub/sub message data
    const pubData = {
        report_id: id,
        user_id: userId,
        action: "create",
        created_at: newValue.created_at,
        body_temp: newValue.body_temperature,
        symptoms: parseSymptoms(newValue.indications),
        location: newValue.location,
        user: userData,
    };

    messageJsonString = JSON.stringify(pubData);
    console.log(messageJsonString);

    // const result = publishMessageTopic(pubData);

    // if (result === false) {
    //     return 'error';
    // }

    return 'ok';
});

exports.selfOtherReportUpdatedPubsub = functions.firestore.document('self_reports/{userId}/other_report/{personId}/daily_report/{id}').onUpdate(async (change, context) => {
    // Get the parameter `{id}` representing the daily report document id
    const id = parseInt(context.params.id);

    // Get the parameter `{userId}` representing the self report document id
    const userId = context.params.userId;
    const personId = context.params.personId;

    // Get the new data created
    // const newValue = snap.data();
    console.log(`Self Other Report Updated: ${userId}, ${personId}, ${id}, ${newValue}`);

    return 'ok';
});

async function publishMessageTopic(payload) {
    // Init Pub/Sub client
    const pubSubClient = new PubSub();

    // Pub/Sub topic
    const topicName = functions.config().env.self_report.pubsub_topic;

    // Convert message data to json string
    messageJsonString = JSON.stringify(payload);
    const messageBuffer = Buffer.from(messageJsonString);

    console.log(`Self Report Pub/Sub message data: ${messageJsonString}`);

    // Publish to Pub/Sub
    try {
        const messageId = await pubSubClient.topic(topicName).publish(messageBuffer);
        console.log(`Message ${topicName} - ${messageId} published.`);
        return true;
    } catch (error) {
        console.error(`Received error while publishing: ${topicName} - ${error.message}`);
        return false;
    }
}