// const logFilePath = "/home/node/app/log.json";
const logFilePath = "C:\\Users\\edw19b\\Dropbox\\dev\\augmented-asm\\augmented-asm-server\\log.json";
const express = require('express');
const fs = require('fs');
const fetch = require('node-fetch');
const app = express();
const PORT = 8080;
const CURRENT_VERSION = 1.70;
const USER_AGENT_API_URL = "https://api.whatismybrowser.com/api/v2/user_agent_parse";
const USER_AGENT_API_KEY = require('./api_key');
const { stderr } = require('process');
const { response } = require('express');

app.use( express.json() ); // load json middleware
app.use('/static', express.static('./', {etag: false}) ); // load static to serve local files; second argument disables client-side caching
app.listen(PORT, () => console.log(`running on port ${PORT}`))

app.post('/wave-hello', async (req, res) => {
    try {
        // send client the latest version number so it'll know if an update is available
        res.send( { version: CURRENT_VERSION } );
        
        // load database into memory
        let log = JSON.parse(fs.readFileSync(logFilePath));
        
        if (!log.hasOwnProperty(req.body.user)) { // first time user
            log[req.body.user] = {"count": 0, "gameCount": 0, "gameTopScore": 0}
        }
        
        log[req.body.user].lastseen = req.body.time;
        log[req.body.user].version = req.body.version;
        log[req.body.user].scriptengine = req.body.scriptengine;
        log[req.body.user].software = await parse_user_agent(req.body.userAgent);
        log[req.body.user].count = log[req.body.user].count + 1;
        
        // write
        fs.writeFileSync(logFilePath, JSON.stringify(log, null, 2))
    } catch (error) {
        console.error("(http-post):/wave-hello failed on server because: ", error);
    }
})

app.get('/wave-hello', (req, res) => {
    res.send( `I commend your exploration 🍻` );
})

app.post('/game', (req, res) => {
    // log that game was played
    const log = JSON.parse(fs.readFileSync(logFilePath));
    log[req.body.user].gameCount = log[req.body.user].gameCount + 1;
    (log[req.body.user].gameTopScore < req.body.score) ? log[req.body.user].gameTopScore = req.body.score : null;
    fs.writeFileSync(logFilePath, JSON.stringify(log, null, 2));
    
    // respond with the top score.
    let response = {"user": "initialised value", "score": -1};
    for (const [key, value] of Object.entries(log)) {
        if (response.score < log[key].gameTopScore) {
            response.user = key;
            response.score = log[key].gameTopScore;
        };
    };
    res.send(response);
})

app.get('/game', (req, res) => {
    const log = JSON.parse(fs.readFileSync(logFilePath));
    let response = {"user": "initialised value", "score": -1};
    for (const [key, value] of Object.entries(log)) {
        if (response.score < log[key].gameTopScore) {
            response.user = key;
            response.score = log[key].gameTopScore;
        };
    };
    res.send( response );
})

app.get('/', (req, res) => {
    res.send( `😘` );
})

app.get('/:other', (req, res) => {
    res.send( `what's this now? ☝️` );
})

// This no longer works as the server is behind a proxy, i.e., requester's ip ==  proxy's ip 😢
// function reverse_DNS_lookup(ip) {
//     return new Promise( (resolve, reject) => {
//         dns.lookupService(ip, 587, (err, host, service) =>  {
//             if (err) {
//                 resolve(ip);
//             } else {
//                 resolve(host);
//             }
//         });
//     })
// };

function parse_user_agent(userAgent) {
    let software;
    return new Promise((resolve, reject) => {
        fetch(USER_AGENT_API_URL, {
            method: 'post',
            body:   `{"user_agent": "${userAgent}"}`,
            headers: { 'Content-Type': 'application/json',
                       'X-API-KEY': USER_AGENT_API_KEY.API_KEY},
            })
        .then(response => response.json())
        .then(json => {
            software = json.parse.simple_software_string;
            resolve(software);
        })
        .catch(error => console.error("😢 failed to parse userAgent string:", error));
    })
    
}