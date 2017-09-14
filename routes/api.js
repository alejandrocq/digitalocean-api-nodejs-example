const express = require('express');
const router = express.Router();
const request = require('request');

// Domain and auth token are set as environment variables
const DOMAIN = process.env.DOMAIN;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

const REQUEST_URI = 'https://api.digitalocean.com/v2/domains/' + DOMAIN + '/records/';

router.get('/updateIP', (req, res) => {
    doUpdate(msg => res.send(msg));
});

setInterval(doUpdate, 10 * 60 * 1000 /* 10 minutes in ms */);

function doUpdate(callback) {
    request.get({
        url: REQUEST_URI,
        headers: {
            'Authorization': 'Bearer ' + AUTH_TOKEN
        }
    }, (error, response, domains) => {
        if (error) return console.log("Error while requesting domain records", error);

        // Get target domain record
        let domainRecords = JSON.parse(domains).domain_records;
        let targetRecord;

        domainRecords.forEach(record => {
            // Use whatever criteria you need to find your record
            if (record.name === 'YOUR_RECORD_NAME' && record.type === 'YOUR_RECORD_TYPE') {
                targetRecord = record;
            }
        });

        // Get public IP using ipinfo.io service and update domain record
        request.get('https://ipinfo.io', (error, response, body) => {
            if (error) return console.log("Error while requesting public IP address", error);

            let ip = JSON.parse(body).ip;

            request.put({
                url: REQUEST_URI + targetRecord.id,
                headers: {
                    'Authorization': 'Bearer ' + AUTH_TOKEN
                },
                json: true,
                body: {
                    data: ip
                }
            }, (error, response, body) => {
                if (error) return console.log("Can't update domain record", error);
                let newIp = body.domain_record.data;

                let msg = "IP refresh done! New IP: " + newIp;
                console.log(msg);
                if (callback) callback(msg);
            });
        });

    });
}

module.exports = router;