import { NextApiRequest, NextApiResponse } from 'next';
import {darken} from "polished";
const fetch = require('node-fetch');

export default async function orderNow(req: NextApiRequest, res: NextApiResponse) {

    const {
        query: { checkoutId, paymentid, publickey, id, linkingreference, code, message },
        method,
    } = req;

    // ..
    // // try {
    // //     let url = 'http://localhost:8080/cap';
    // //
    // //     let reference = "2f473a22-b55d-4678-a863-ffa8da77fbfe" + '_' + Math.ceil(Math.random() * 10 ** 8);
    // //     // const checkoutId = "0e4c396b-9df0-423c-8b13-adebbbdc49ea";
    // //
    // //     let options = {
    // //         method: 'POST',
    // //         headers: {
    // //             Accept: 'application/json',
    // //             'Content-Type': 'application/json',
    // //             'X-Auth-Token': 'gdk5cbgxsevvah9669ib22s25x90dc0'
    // //         },
    // //         // body: `{"orderAttempts": "${reference}", "checkoutId": "${checkoutId}", "linkingreference": "${linkingreference}", "code": "${code}"}`,
    // //         body: `{"paymentid": "${paymentid}", "orderAttempts": "${reference}", "checkoutId": "${checkoutId}", "linkingreference": "${linkingreference}", "code": "${code}"}`,
    // //         // body: '{"name":"Bootstrap","description":"Build responsive websites","src":"https://toosoft.com.ng/myscript.js","auto_uninstall":true,"load_method":"default","location":"head","visibility":"all_pages","kind":"src","consent_category":"essential"}'
    // //     };
    // //
    // //     const data = await fetch(url, options)
    // //         .then(res => res.json())
    // //         .then(json => console.log(json))
    // //         .catch(err => console.error('error:' + err));
    // //
    // //     const dtt = {
    // //         "abc": "344",
    // //     }
    // //
    // //     // Respond with the sample data as JSON
    // //     res.status(200).json(data);
    // //     // res.status(200).json(options.body);
    // //
    // // } catch (error) {
    // //     const { message, response } = error;
    // //     res.status(response?.status || 500).json({ message });
    // // }

    console.log("yttt");
    try {

        const fetch = require('node-fetch');

        if(!paymentid) {
            res.redirect(`https://my-bigc.mybigcommerce.com/checkout`)
        }
        else {
            console.log(paymentid);

            //
            try {
                let url = 'http://localhost:8080/cap';

                let reference = "2f473a22-b55d-4678-a863-ffa8da77fbfe" + '_' + Math.ceil(Math.random() * 10 ** 8);
                // const checkoutId = "0e4c396b-9df0-423c-8b13-adebbbdc49ea";

                // const checkoutId = "2b2a792a-4065-490a-a1ff-9e50987cb031";

                let options = {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Auth-Token': 'gdk5cbgxsevvah9669ib22s25x90dc0'
                    },
                    // body: `{"orderAttempts": "${reference}", "checkoutId": "${checkoutId}", "linkingreference": "${linkingreference}", "code": "${code}"}`,
                    body: `{"paymentid": "${paymentid}", "orderAttempts": "${reference}", "checkoutId": "${checkoutId}", "linkingreference": "${linkingreference}", "code": "${code}"}`,
                    // body: '{"name":"Bootstrap","description":"Build responsive websites","src":"https://toosoft.com.ng/myscript.js","auto_uninstall":true,"load_method":"default","location":"head","visibility":"all_pages","kind":"src","consent_category":"essential"}'
                };

                // const data = await fetch(url, options)
                //     .then(res => res.json())
                //     .then(json => console.log(json))
                //     .catch(err => console.error('error:' + err));

                await fetch(url, options)
                    .then(res => res.json())
                    .then(json => console.log(json))
                    .catch(err => console.error('error:' + err));

                const response = await fetch(url, options);
                const data = await response.json();
                // //
                // const dtt = {
                //     "abc": "344",
                // }

                // console.log("dttt"+data.aaa+typeof data.aaa);

                res.status(200).json(data);

                // Respond with the sample data as JSON

                // res.status(200).json(data);

                // res.redirect(`https://my-bigc.mybigcommerce.com/checkout/order-confirmation`);

                // res.redirect(`https://my-bigc.mybigcommerce.com/checkout/order-confirmation/${orderId}`);

                // res.status(200).json(options.body);

            } catch (error) {
                const { message, response } = error;
                res.status(response?.status || 500).json({ message });
            }
            //
        }
//http://localhost:3000/api/capture?paymentid=TEST_IBK_688639041696720151798&linkingreference=ITX714622171696720159914&code=00&message=approved

        // // const response0 = await fetch(`https://staging.itexpay.com/api/v1/transaction/charge/status?publickey=${publickey}&paymentid=${paymentid}`);
        // const response0 = await fetch(`https://staging.itexpay.com/api/v1/transaction/charge/status?publickey=ITXPUB_STAGING_4MLOLINTPIZL9D1SBIUGOR5JM3CEJ0REBZGJBNBO-7623000009-L0GST0KPJXTH0UV&paymentid=${paymentid}`);
        // const data0 = await response0.json();
        //
        // if (data0.code == "00") {
        //
        //
        //
        //     const url = `https://api.bigcommerce.com/stores/kqw14s7hk2/v3/checkouts/${id}/orders`;
        //
        //     const options = {
        //         method: 'POST',
        //         headers: {
        //             Accept: 'application/json',
        //             'Content-Type': 'application/json',
        //             'X-Auth-Token': 'gdk5cbgxsevvah9669ib22s25x90dc0'
        //         }
        //     };
        //
        //     const response = await fetch(url, options);
        //
        //     const data = await response.json();
        //     const orderId = data.data.id;
        //
        //
        //     // update order status
        //     const url2 = `https://api.bigcommerce.com/stores/kqw14s7hk2/v2/orders/${orderId}`;
        //     const options2 = {
        //         method: 'PUT',
        //         headers: {
        //             Accept: 'application/json',
        //             'Content-Type': 'application/json',
        //             'X-Auth-Token': 'gdk5cbgxsevvah9669ib22s25x90dc0'
        //         },
        //         body: '{"status_id":11}',
        //     };
        //
        //     const response2 = await fetch(url2, options2);
        //     const data2 = await response2.json();
        //
        //
        //     res.redirect(`https://my-bigc.mybigcommerce.com/checkout/order-confirmation/${orderId}`);
        //
        // } else {
        //     res.redirect(`https://my-bigc.mybigcommerce.com/checkout`)
        // }

    } catch (error) {
        const { message, response } = error;
        res.status(response?.status || 500).json({ message });
    }

}
