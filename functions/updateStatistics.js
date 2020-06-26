const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios').default;

exports.updateStatistics =
  functions.pubsub.schedule('every 6 hours')
    .timeZone('Asia/Jakarta')
    .onRun(async context => {
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
      statistics = await getJabarStatistics(statistics);
      statistics = await getNationalStatistics(statistics);
      updateStatistics(statistics);
    });


async function getJabarStatistics(updatedStatistics) {
  return axios.get(functions.config().env.updateStatistics.jabarAPI)
    .then(res => {
        const data = res.data.data.content;
        let lastUpdate = res.data.data.metadata.last_update;
        const milliseconds = lastUpdate ? new Date(lastUpdate).getTime() : Date.now();
        lastUpdate = new admin.firestore.Timestamp(Math.floor(milliseconds / 1000), 0);

        updatedStatistics.updated_at = lastUpdate;
        updatedStatistics.aktif.jabar = data.positif;
        updatedStatistics.sembuh.jabar = data.sembuh;
        updatedStatistics.meninggal.jabar = data.meninggal;
        updatedStatistics.odp.selesai.jabar = data.odp_selesai;
        updatedStatistics.odp.total.jabar = data.odp_total;
        updatedStatistics.pdp.selesai.jabar = data.pdp_selesai;
        updatedStatistics.pdp.total.jabar = data.pdp_total;

        return updatedStatistics;
    })
    .catch(error => {
        console.log(error);
        return (error);
    })
}

async function getNationalStatistics(updatedStatistics) {
  return axios.get(functions.config().env.updateStatistics.nationalAPI)
    .then(res => {
        const data = res.data;
        const infected = data.numbers.infected;
        const recovered = data.numbers.recovered;
        const fatal = data.numbers.fatal;
        const activeCases = infected - (recovered + fatal);

        updatedStatistics.aktif.nasional = infected;
        updatedStatistics.sembuh.nasional = recovered;
        updatedStatistics.meninggal.nasional = fatal;

        return updatedStatistics;
    })
    .catch(error => {
        console.log(error);
        return (error);
    })
}

function updateStatistics(statistics) {
  admin.firestore()
    .collection('statistics')
    .doc('jabar-dan-nasional')
    .set(statistics, {merge: true});
}
