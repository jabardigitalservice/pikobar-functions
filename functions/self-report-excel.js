const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Export Firestore collection to Excel format
 */
exports.selfReportGetExcel = functions.https.onRequest(async (request, response) => {
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
