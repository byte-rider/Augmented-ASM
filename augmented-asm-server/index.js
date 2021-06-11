const filenameLog = "C:\\Users\\edw19b\\Dropbox\\dev\\augmented-asm\\augmented-asm-server\\log.json";
const filenameLogUnique = "C:\\Users\\edw19b\\Dropbox\\dev\\augmented-asm\\augmented-asm-server\\log-unique.json";
const fs = require('fs');
const express = require('express');
const app = express();
const PORT = 8080;

app.use( express.json() ); // middleware
app.listen(PORT, () => console.log(`running on port ${PORT}`))

app.post('/wave-hello', (req, res) => {
    // load
    let logData = JSON.parse(fs.readFileSync(filenameLog));
    let logDataUnique = JSON.parse(fs.readFileSync(filenameLogUnique));
    
    // append entry
    logData.users.push(req.body);

    // append unique entry
    if (!logDataUnique.users.find(e => e.user === req.body.user))
        logDataUnique.users.push(req.body);
    
    // write
    fs.writeFileSync(filenameLog, JSON.stringify(logData, null, 2))
    fs.writeFileSync(filenameLogUnique, JSON.stringify(logDataUnique, null, 2))

    // send response
    res.send( `Augmented-ASM: 👌` );
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
