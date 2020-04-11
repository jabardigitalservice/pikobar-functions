const functions = require('firebase-functions');
const admin = require('firebase-admin');
const updateStatistics = require('./updateStatistics');

admin.initializeApp();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

exports.getUserById = functions.https.onRequest(async (request, response) => {
  try {
    const uid = request.query.id;

    const dbRecord = await admin.firestore()
      .collection(`users`)
      .doc(uid)
      .get();

    const dbData = dbRecord.data();

    const userRecord = {
      id: dbData.id,
      name: dbData.name,
      gender: dbData.gender,
      photo_url: dbData.photo_url,
      province_code: dbData.province_id,
      city_code: dbData.city_id,
    }

    response.send(userRecord);
  } catch (error) {
    response.send("Error.");
  }
});

exports.storeUser = functions.auth.user().onCreate((user) => {
  console.log('User:', user);

  const record = {
    id: user.uid,
    name: user.displayName,
    email: user.email,
    photo_url: user.photoURL,
    phone_number: user.phoneNumber,
    created_at: admin.firestore.Timestamp.now(),
    health_status: null,
    health_status_text: null,
    health_status_check: null
  }

  admin.firestore()
    .collection(`users`)
    .doc(user.uid)
    .set(record);

  return 'ok';
});

exports.deleteUser = functions.auth.user().onDelete((user) => {
  console.log('User:', user);

  admin.firestore()
    .collection(`users`)
    .doc(user.uid)
    .delete();

  return 'ok';
});

exports.autoSubscribeTopic = functions.firestore.document(`tokens/{tokenId}`).onCreate(async (snap, context) => {
  var tokenId = context.params.tokenId;

  var token = snap.data();
  console.log('Token:', token);

  admin.messaging().subscribeToTopic(tokenId, 'general');

  return 'ok';
});

exports.updateStatistics = updateStatistics.updateStatistics;
