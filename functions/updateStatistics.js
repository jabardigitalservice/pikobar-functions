const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios').default;

exports.updateStatistics = functions.https.onRequest((request, response) => {
  axios.get(functions.config().env.updateStatistics.apiURL)
        .then(res => {
            const data = res.data.data.content;
            let lastUpdate = res.data.data.metadata.last_update;
            const milliseconds = lastUpdate ? new Date(lastUpdate).getTime() : Date.now();
            lastUpdate = new admin.firestore.Timestamp(Math.floor(milliseconds / 1000), 0);
            const updatedStats = {
              'updated_at': lastUpdate,
              'aktif': {
                'jabar': data.positif
              },
              'sembuh': {
                'jabar': data.sembuh
              },
              'meninggal': {
                'jabar': data.meninggal
              },
              'odp': {
                'selesai': {
                  'jabar': data.odp_selesai
                },
                'total': {
                  'jabar': data.odp_total
                }
              },
              'pdp': {
                'selesai': {
                  'jabar': data.pdp_selesai
                },
                'total': {
                  'jabar': data.pdp_total
                }
              }
            };

            admin.firestore()
            .collection('statistics')
            .doc('test-cloud-function')
            .set(updatedStats, {merge: true});

            const jsonRes = {"isSuccess": true};
            response.json(jsonRes);
            return jsonRes;
        })
        .catch(error => {
            console.log(error);
            response.json({"isSuccess": false, "error": error});
        })
});
