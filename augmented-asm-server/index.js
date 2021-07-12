const filenameLog = "C:\\Users\\edw19b\\Dropbox\\dev\\augmented-asm\\augmented-asm-server\\log.json";
const filenameLogUnique = "C:\\Users\\edw19b\\Dropbox\\dev\\augmented-asm\\augmented-asm-server\\log-unique.json";
const gameScoreboard = "C:\\Users\\edw19b\\Dropbox\\dev\\augmented-asm\\augmented-asm-server\\game-scoreboard.json";
const gameLog = "C:\\Users\\edw19b\\Dropbox\\dev\\augmented-asm\\augmented-asm-server\\game-log.json";
const express = require('express');
const fs = require('fs');
const dns = require('dns');
const fetch = require('node-fetch');
const app = express();
const PORT = 8080;
const CURRENT_VERSION = 1.6;
const USER_AGENT_API_URL = "https://api.whatismybrowser.com/api/v2/user_agent_parse";
const USER_AGENT_API_KEY = require('./api_key');

app.use( express.json() ); // load json middleware
app.use('/static', express.static('./', {etag: false}) ); // load static to serve local files; second argument disables client-side caching

app.listen(PORT, () => console.log(`running on port ${PORT}`))

app.post('/wave-hello', async (req, res) => {
    // send response (contains current version number so client knows if update available)
    res.send( { version: CURRENT_VERSION } );

    // discard me otherwise log fills up when testing
    if (req.body.user === "Edwards, George") {
        return;
    }

    // load database into memory
    let log = JSON.parse(fs.readFileSync(filenameLog));
    let logUnique = JSON.parse(fs.readFileSync(filenameLogUnique));
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress; // get incoming IP from request headers
    
    // perform async functions
    const hostname = reverse_DNS_lookup(ip);
    const software = parse_user_agent(req.body.userAgent);
    const finished = await Promise.all([hostname, software]);
    
    // append data to incoming json body
    req.body.hostname = finished[0];
    req.body.software = finished[1];

    // remove the userAgent string
    delete req.body['userAgent'];

    // add to normal log and the unique log if it's a new user
    log.users.push(req.body);
    if (!logUnique.users.find(e => e.user === req.body.user)) {
        logUnique.users.push(req.body);
    }

    // write
    fs.writeFileSync(filenameLog, JSON.stringify(log, null, 2));
    fs.writeFileSync(filenameLogUnique, JSON.stringify(logUnique, null, 2))
})

app.post('/game', (req, res) => {
    // load databases into memory
    const topScore = JSON.parse(fs.readFileSync(gameScoreboard));
    const log = JSON.parse(fs.readFileSync(gameLog));

    // log this instance of game use:
    log.game.push(req.body);
    fs.writeFileSync(gameLog, JSON.stringify(log, null, 2));

    // potentially write a new high score
    if (req.body.score > topScore.score) {
        fs.writeFileSync(gameScoreboard, JSON.stringify(req.body, null, 2));
    }

    // send highscore as response
    res.send( fs.readFileSync(gameScoreboard) );
})

app.get('/game', (req, res) => {
    const topScore = JSON.parse(fs.readFileSync(gameScoreboard));

    // send response
    res.send( `high score: ${topScore.score}` );
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

function reverse_DNS_lookup(ip) {
    return new Promise( (resolve, reject) => {
        dns.lookupService(ip, 587, (err, host, service) =>  {
            if (err) {
                resolve(ip);
            } else {
                resolve(host);
            }
        });
    })
};

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
        .catch(error => console.error('😢 Parsing userAgent string has failed:', error));
    })
    
}