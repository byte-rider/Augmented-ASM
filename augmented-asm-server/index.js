const filenameLog = "C:\\Users\\edw19b\\Dropbox\\dev\\augmented-asm\\augmented-asm-server\\log.json";
const filenameLogUnique = "C:\\Users\\edw19b\\Dropbox\\dev\\augmented-asm\\augmented-asm-server\\log-unique.json";
const express = require('express');
const fs = require('fs');
const dns = require('dns');
const util = require('util');
const lookup = util.promisify(dns.reverse);
const app = express();
const PORT = 8080;
const VERSION = 1.2;

app.use( express.json() ); // middleware
app.listen(PORT, () => console.log(`running on port ${PORT}`))

async function getHostname(ip) {
    try {
        return await lookup(ip);
    } catch (err) {
        throw err;
    }
};

app.post('/wave-hello', (req, res) => {
    // load
    let logData = JSON.parse(fs.readFileSync(filenameLog));
    let logDataUnique = JSON.parse(fs.readFileSync(filenameLogUnique));
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress; // get incoming IP from request headers

    // append incoming data with IP (sync) and Hostname (async) then once promise has resolved write the file to disk.
    req.body.ip = ip;
    getHostname(ip)
        .then(value => {
            req.body.hostname = value[0];
        })
        
        .catch(error => {
            req.body.hostname = `lookup error: ${error.errno}`;
            
        })

        .finally(n => {
            if (req.body.user === "Edwards, George") {
                return;
            }

            logData.users.push(req.body);
            fs.writeFileSync(filenameLog, JSON.stringify(logData, null, 2));
        })

    // append unique entry
    if (!logDataUnique.users.find(e => e.user === req.body.user))
        logDataUnique.users.push(req.body);
    
    // write
    fs.writeFileSync(filenameLogUnique, JSON.stringify(logDataUnique, null, 2))

    // send response
    res.send( { version: VERSION } );
})

app.get('/wave-hello', (req, res) => {
    // send response
    res.send( `I commend your exploration 🍻` );
})

app.get('/', (req, res) => {
    // send response
    res.send( `😘` );
})

app.get('/:other', (req, res) => {
    // send response
    res.send( `what's this now? ☝️` );
})

