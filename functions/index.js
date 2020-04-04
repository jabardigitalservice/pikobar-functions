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
    const userRecord = await admin.auth().getUser(uid)

    response.send(userRecord.toJSON());
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

exports.onBrodcastsCreated = functions.firestore.document(`broadcasts/{broadcastId}`).onCreate(async (snap, context) => {
  const broadcastId = context.params.broadcastId;
  console.log('broadcastId: ' + broadcastId);

  const createUsersMessage = async (lastKey = '', iteration = 0, records = 0) => {
      var db = admin.firestore();
      var batch = db.batch();

      const snapshots = await db.collection(`users`)
        .orderBy('id')
        .startAt(lastKey)
        .limit(20)
        .get();

      var nextKey = null;
      var counter = 0;

      snapshots.forEach(snapshot => {
        const userId = snapshot.data().id;

        if (userId !== lastKey) {
          counter++;

          var message = snap.data();
          message.read = false;
          batch.set(snapshot.ref.collection(`messages`).doc(broadcastId), message);

          nextKey = userId;
        }
      });

      await batch.commit();

      if (nextKey) {
        await createUsersMessage(nextKey, iteration + 1, counter + records);
      } else {
        console.log(`Finished: ${iteration} iterations, ${counter + records} records created.`);
      }
  };

  await createUsersMessage();
  return 'ok';
});

exports.updateStatistics = updateStatistics.updateStatistics;
