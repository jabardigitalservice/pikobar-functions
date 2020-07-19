const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Export Firestore collection to Excel format
 */
exports.selfReportGetExcel = functions.https.onRequest(async (request, response) => {
    try {
      const uid = request.query.id;

      const dailyReports = await admin.firestore()
        .collection(`self_reports`)
        .doc(uid)
        .collection(`daily_report`)
        .get();

      const result = [];

      dailyReports.forEach(report =>{
        const reportId = report.id;
        result.push({
            [reportId]: report.data()
        });
      })

      return response.send(result);
    } catch (error) {
      return response.status(500).send("Error.");
    }
  });
