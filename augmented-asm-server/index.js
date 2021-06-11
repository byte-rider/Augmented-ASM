const filename = "C:\\Users\\edw19b\\Dropbox\\dev\\augmented-asm\\augmented-asm-server\\log.json";
const fs = require('fs');
const express = require('express');
const app = express();
const PORT = 8080;

app.use( express.json() ); // middleware
app.listen(PORT, () => console.log(`running on port ${PORT}`))

app.post('/wave-hello', (req, res) => {
    // load
    let logData = JSON.parse(fs.readFileSync(filename));
    
    // append
    logData.users.push(req.body);
    
    // write
    fs.writeFileSync(filename, JSON.stringify(logData, null, 2))

    // send response
    res.send( `Augmented-ASM: 👌` );
})

app.get('/wave-hello', (req, res) => {
    // send response
    res.send( `Hello cheeky monkey. I commend your exploration 🍻` );
})

app.get('/', (req, res) => {
    // send response
    res.send( `😘` );
})

