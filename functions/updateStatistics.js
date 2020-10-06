const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios').default;

exports.updateStatistics =
    functions.pubsub.schedule('*/10 * * * *')
    .timeZone('Asia/Jakarta')
    .onRun(async context => {

        const baseUrl = functions.config().env.updateStatistics.pikobarAPI.baseUrl;
        const apiKey = functions.config().env.updateStatistics.pikobarAPI.apiKey;

        const { data } = await axios.get(baseUrl, {
            headers: {
                'api-key': apiKey
            }
        })

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

        let pcr = {
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

        const last_update = new Date(data['metadata']['last_update']);
        const formated_last_update = admin.firestore.Timestamp.fromDate(last_update);

        const datas = data['data'][0];

        // jawabarat
        statistics['aktif']['jabar'] = datas['confirmation_total']
        statistics['sembuh']['jabar'] = datas['confirmation_selesai']
        statistics['meninggal']['jabar'] = datas['confirmation_meninggal']

        statistics['kontak_erat']['karantina'] = datas['closecontact_dikarantina']
        statistics['kontak_erat']['total'] = datas['closecontact_total']
        statistics['probable']['isolasi'] = datas['probable_diisolasi']
        statistics['probable']['selesai'] = datas['probable_discarded']
        statistics['probable']['total'] = datas['probable_total']
        statistics['suspek']['isolasi'] = datas['suspect_diisolasi']
        statistics['suspek']['total'] = datas['suspect_total']
        statistics['updated_at'] = formated_last_update;

        // pcr
        pcr['invalid'] = datas['pcr_invalid']
        pcr['negatif'] = datas['pcr_negatif']
        pcr['positif'] = datas['pcr_positif']
        pcr['total'] = datas['pcr_total']
        pcr['last_update'] = formated_last_update;

        // rdt
        rdt['invalid'] = datas['rdt_invalid']
        rdt['negatif'] = datas['rdt_negatif']
        rdt['positif'] = datas['rdt_positif']
        rdt['total'] = datas['rdt_total']
        rdt['last_update'] = formated_last_update;

        updateStatistics(statistics, pcr, rdt);
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