const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios').default;

exports.updateStatistics =
  functions.pubsub.schedule('*/10 * * * *')
    .timeZone('Asia/Jakarta')
    .onRun(async context => {
      const { data } = await axios.get('https://pikobar-api-static.digitalservice.id/v2/covid-cases')
      console.log(data)

      let statistics = {
        'updated_at': null,
        'aktif': {},
        'sembuh': {},
        'meninggal': {},
        'odp': {
          'selesai': {},
          'total': {}
        },
        'pdp': {
          'selesai': {},
          'total': {}
        }
      };
      
      // jawabarat
      statistics['aktif']['jabar'] = data['jawabarat']['positif_total']
      statistics['sembuh']['jabar'] = data['jawabarat']['positif_sembuh']
      statistics['meninggal']['jabar'] = data['jawabarat']['positif_meninggal']

      statistics['odp']['selesai']['jabar'] = data['jawabarat']['odp_selesai']
      statistics['odp']['total']['jabar'] = data['jawabarat']['odp_total']
      statistics['pdp']['selesai']['jabar'] = data['jawabarat']['pdp_selesai']
      statistics['pdp']['total']['jabar'] = data['jawabarat']['pdp_total']

      // nasional
      statistics['aktif']['nasional'] = data['nasional']['positif_total']
      statistics['sembuh']['nasional'] = data['nasional']['positif_sembuh']
      statistics['meninggal']['nasional'] = data['nasional']['positif_meninggal']

      const last_update = new Date(data['meta']['last_update']);
      statistics['updated_at'] = admin.firestore.Timestamp.fromDate(last_update);

      updateStatistics(statistics);
    });

function updateStatistics(statistics) {
  admin.firestore()
    .collection('statistics')
    .doc('jabar-dan-nasional')
    .set(statistics, {merge: true});
}
