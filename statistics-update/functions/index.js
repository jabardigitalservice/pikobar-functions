const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios').default;

admin.initializeApp();

exports.updateStatistics = functions.https.onRequest((request, response) => {
  axios.get('https://covid19-public.digitalservice.id/api/v1/rekapitulasi/jabar')
        .then(function (res) {
            const data = res.data;

            response.json({"isSuccess": true});
        })
        .catch(function (error) {
            console.log(error);
            response.json({"isSuccess": false, "error": error});
        })
});
