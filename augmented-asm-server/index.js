const filenameLog = "C:\\Users\\edw19b\\Dropbox\\dev\\augmented-asm\\augmented-asm-server\\log.json";
const filenameLogUnique = "C:\\Users\\edw19b\\Dropbox\\dev\\augmented-asm\\augmented-asm-server\\log-unique.json";
const express = require('express');
const fs = require('fs');
const dns = require('dns');
const app = express();
const PORT = 8080;
const VERSION = 1.51;

app.use( express.json() ); // load json middleware

// express.static() to serve local files. This is used to "@require" the script within Tampermonkey, allowing me to use VSCode
// the second argument {etag: false} is to disable client-side caching.
app.use('/static', express.static('./', {etag: false}) );

app.listen(PORT, () => console.log(`running on port ${PORT}`))

function reverse_DNS_lookup(ip) {
    return new Promise( (resolve, reject) => {
        dns.lookupService(ip, 587, (err, host, service) =>  {
            if (err) 
            resolve(err);

            resolve(host);
        });
    })
};

app.post('/wave-hello', (req, res) => {
    // load database into memory
    let logData = JSON.parse(fs.readFileSync(filenameLog));
    let logDataUnique = JSON.parse(fs.readFileSync(filenameLogUnique));
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress; // get incoming IP from request headers

    // append incoming data with IP
    req.body.ip = ip;

    // append Hostname (async lookup) and write to disk.
    reverse_DNS_lookup(ip)
        .then((hostname) => {
            req.body.hostname = hostname;
        })

        .finally(n => {
            if (req.body.user === "Edwards, George") // discard me otherwise log fills up when testing
                return;
            logData.users.push(req.body);
            fs.writeFileSync(filenameLog, JSON.stringify(logData, null, 2));
        });

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

