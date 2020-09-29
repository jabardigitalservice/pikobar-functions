const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios').default;

exports.updateStatistics =
    functions.pubsub.schedule('*/10 * * * *')
    .timeZone('Asia/Jakarta')
    .onRun(async context => {
        const { data } = await axios.get('https://pikobar-api-static.digitalservice.id/v2/covid-cases-new')
        console.log(data)

        let statistics = {
            'updated_at': null,
            'aktif': {},
            'sembuh': {},
            'meninggal': {},
            'kontak_erat': {},
            'probable': {},
            'suspek': {}
        };

        let prc = {
            'last_update': null,
            'invalid': null,
            'negatif': null,
            'positif': null,
            'total': null
        }

        let rdt = {
            'last_update': null,
            'invalid': null,
            'negatif': null,
            'positif': null,
            'total': null
        }

        const last_update = new Date(data['meta']['last_update']);
        const formated_last_update = admin.firestore.Timestamp.fromDate(last_update);

        // jawabarat
        statistics['aktif']['jabar'] = data['jawabarat']['confirmation_total']
        statistics['sembuh']['jabar'] = data['jawabarat']['confirmation_selesai']
        statistics['meninggal']['jabar'] = data['jawabarat']['confirmation_meninggal']

        statistics['kontak_erat']['karantina'] = data['jawabarat']['closecontact_dikarantina']
        statistics['kontak_erat']['total'] = data['jawabarat']['closecontact_total']
        statistics['probable']['isolasi'] = data['jawabarat']['probable_diisolasi']
        statistics['probable']['selesai'] = data['jawabarat']['probable_discarded']
        statistics['probable']['total'] = data['jawabarat']['probable_total']
        statistics['suspek']['isolasi'] = data['jawabarat']['suspect_diisolasi']
        statistics['suspek']['total'] = data['jawabarat']['suspect_total']

        // nasional
        statistics['aktif']['nasional'] = data['nasional']['positif_total']
        statistics['sembuh']['nasional'] = data['nasional']['positif_sembuh']
        statistics['meninggal']['nasional'] = data['nasional']['positif_meninggal']

        statistics['updated_at'] = formated_last_update;

        // pcr
        prc['invalid'] = data['jawabarat']['pcr_invalid']
        prc['negatif'] = data['jawabarat']['pcr_negatif']
        prc['positif'] = data['jawabarat']['pcr_positif']
        prc['total'] = data['jawabarat']['pcr_total']
        prc['last_update'] = formated_last_update;

        // rdt
        rdt['invalid'] = data['jawabarat']['rdt_invalid']
        rdt['negatif'] = data['jawabarat']['rdt_negatif']
        rdt['positif'] = data['jawabarat']['rdt_positif']
        rdt['total'] = data['jawabarat']['rdt_total']
        rdt['last_update'] = formated_last_update;

        updateStatistics(statistics, prc, rdt);
    });

function updateStatistics(statistics, pcr, rdt) {
    admin.firestore()
        .collection('statistics')
        .doc('jabar-dan-nasional')
        .set(statistics, { merge: true });

    admin.firestore()
        .collection('statistics')
        .doc('pcr')
        .set(pcr, { merge: true });

    admin.firestore()
        .collection('statistics')
        .doc('rdt')
        .set(rdt, { merge: true });
}