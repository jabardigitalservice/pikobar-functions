const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios').default;

exports.updateStatistics =
    functions.pubsub.schedule('*/30 * * * *')
        .timeZone('Asia/Jakarta')
        .onRun(async context => {

            const baseUrl = functions.config().env.updateStatistics.pikobarAPI.baseUrl;
            const apiKey = functions.config().env.updateStatistics.pikobarAPI.apiKey;

            const { data } = await axios.get(baseUrl, {
                headers: {
                    'api-key': apiKey
                }
            })

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

            const field = data['data'][0];

            // const last_update = new Date(data['metadata']['last_update']);
            const pcr_update = new Date(field['pcr_date']);
            const rdt_update = new Date(field['rdt_tanggal']);
            const formated_last_update = admin.firestore.Timestamp.now();
            const formated_pcr_update = admin.firestore.Timestamp.fromDate(pcr_update);
            const formated_rdt_update = admin.firestore.Timestamp.fromDate(rdt_update);


            // jawabarat
            statistics['aktif']['jabar'] = field['confirmation_total']
            statistics['sembuh']['jabar'] = field['confirmation_selesai']
            statistics['meninggal']['jabar'] = field['confirmation_meninggal']

            statistics['kontak_erat']['karantina'] = field['closecontact_dikarantina']
            statistics['kontak_erat']['total'] = field['closecontact_total']
            statistics['probable']['isolasi'] = field['probable_diisolasi']
            statistics['probable']['selesai'] = field['probable_discarded']
            statistics['probable']['total'] = field['probable_total']
            statistics['suspek']['isolasi'] = field['suspect_diisolasi']
            statistics['suspek']['total'] = field['suspect_total']
            statistics['updated_at'] = formated_last_update;

            // pcr
            pcr['invalid'] = field['pcr_invalid']
            pcr['negatif'] = field['pcr_negatif']
            pcr['positif'] = field['pcr_positif']
            pcr['total'] = field['pcr_total']
            pcr['last_update'] = formated_pcr_update;

            // rdt
            rdt['invalid'] = field['rdt_invalid']
            rdt['negatif'] = field['rdt_negatif']
            rdt['positif'] = field['rdt_positif']
            rdt['total'] = field['rdt_total']
            rdt['last_update'] = formated_rdt_update;

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
