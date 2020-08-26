const functions = require('firebase-functions');
const admin = require('firebase-admin');
const updateStatistics = require('./updateStatistics');
const cors = require('cors')({origin: true});
const axios = require('axios');
const selfReport = require('./self-report-notification');

admin.initializeApp();

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

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
      email: dbData.email,
      name: dbData.name,
      gender: dbData.gender,
      location: dbData.location,
      phone_number: dbData.phone_number,
      birthdate: dbData.birthdate,
      health_status: dbData.health_status,
      address: dbData.address,
      photo_url: dbData.photo_url,
      province_code: dbData.province_id,
      city_code: dbData.city_id,
    }

    return response.send(userRecord);
  } catch (error) {
    return response.status(500).send("Error.");
  }
});

exports.postChatApiIncoming = functions.https.onRequest(async (request, response) => {
  const requestData = request.body;
  const requestToken = request.query.token;
  const token = functions.config().chatapi.token;
  const baseUrl = functions.config().chatapi.baseurl;

  try {
    const chatId = requestData.messages[0].chatId;
    const fromMe = requestData.messages[0].fromMe;

    if (fromMe === true) {
      console.log("OK, Incoming from me. ChatID ", chatId);

      return response.send("OK, Incoming from me. ChatID " + chatId);
    }

    await axios({
      method: 'post',
      url: `${baseUrl}/sendMessage?token=${token}`,
      data: {
        chatId: chatId,
        body: 'Ini adalah pesan otomatis layanan notifikasi PIKOBAR Pusat Informasi dan Koordinasi COVID-19 Jawa Barat. Untuk informasi dan pertanyaan lebih lanjut, Anda bisa menghubungi Hotline Call Center di https://s.id/HotlinePikobar\n\n' +
        'Pertanyaan dan informasi situasi perkembangan COVID-19 di Jawa Barat, dapat diakses melalui:\n'+
        'Pertanyaan Umum: https://s.id/ChatbotPikobar\n' +
        'Whatsapp: https://s.id/HotlinePikobar\n' +
        'Website: https://pikobar.jabarprov.go.id\n' +
        'Aplikasi Android: https://bit.ly/PIKOBAR-V1'
      }
    });

    await axios({
      method: 'post',
      url: `${baseUrl}/sendVCard?token=${token}`,
      data: {
        chatId: chatId,
        vcard: 'BEGIN:VCARD\nVERSION:3.0\nFN;CHARSET=UTF-8:PIKOBAR Provinsi Jawa Barat\nN;CHARSET=UTF-8:;PIKOBAR Provinsi Jawa Barat;;;\nTEL;TYPE=CELL:+628112093306\nTEL;TYPE=CELL:+6282117745875\nTEL;TYPE=CELL:+6285697391854\nURL;CHARSET=UTF-8:https://pikobar.jabarprov.go.id\nNOTE;CHARSET=UTF-8:Hotline Call Center PIKOBAR Pusat Informasi dan Koordinasi Jawa Barat\nEND:VCARD'
      }
    });

    console.log("OK. ChatID ", chatId);

    return response.send("OK. ChatID " + chatId);
  } catch (error) {
    console.log("Error. ChatID ", chatId);

    return response.status(500).send("Error. ChatID "  + chatId);
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

/**
 * Update user data in the tracking dashboard 
 * whenever user data in firestore is updated.
 */
exports.updateProfileTracking = functions.firestore.document('users/{userId}').onUpdate( async (change, context) => {

  // Get the tracking profile url from the environment config
  const profileUrl = functions.config().env.tracking.profileurl;

  // Get the parameter `{userId}`
  const userId = context.params.userId;

  // Get an object representing the user document
  const newValue = change.after.data();

  // Set the data to be sent when performing a PATCH request
  const record = {
    userId: userId,
    name: newValue.name,
    gender: String(newValue.gender),
    stay_at: String(newValue.address),
    phone: String(newValue.phone_number),
    stay_at_province: String(newValue.province_id),
    stay_at_city: String(newValue.city_id),
    birthday: (typeof newValue.birthdate !== 'undefined' && newValue.birthdate) ? newValue.birthdate.toDate().toISOString() : 'undefined',
    status: String(newValue.health_status)
  }

  // Performs a PATCH request to update user profile data in the tracking dashboard
  await axios({
    method: 'PATCH',
    url: profileUrl,
    data: record
  }).then(response => console.log(response.status))
  .catch(error => console.error(error));

  return 'OK';
});

exports.updateStatistics = updateStatistics.updateStatistics;


exports.selfReportManageSubscriptions = selfReport.selfReportManageSubscriptions;
exports.selfReportAutoUnsubscribe = selfReport.selfReportAutoUnsubscribe;
exports.selfReportScheduledNotification = selfReport.selfReportScheduledNotification;
