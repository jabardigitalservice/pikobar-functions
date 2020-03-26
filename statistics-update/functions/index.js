const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios').default;

admin.initializeApp();

exports.updateStatistics = functions.https.onRequest((request, response) => {
  axios.get('https://covid19-public.digitalservice.id/api/v1/rekapitulasi/jabar')
        .then(function (res) {
            const data = res.data.data.content;

            const lastUpdate = res.data.data.metadata.last_update;

            // console.log(data);
            const updatedStats = {
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

            if (lastUpdate) {
              updatedStats['updated_at'] = lastUpdate;
            }

            admin.firestore()
            .collection('statistics')
            .doc('test-cloud-function')
            .set(updatedStats, {merge: true});

            response.json({"isSuccess": true});
        })
        .catch(function (error) {
            console.log(error);
            response.json({"isSuccess": false, "error": error});
        })
});
