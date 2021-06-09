const fs = require('fs');
const express = require('express');
const app = express();
const PORT = 8080;

app.use( express.json() ); // middleware
app.listen(PORT, () => console.log(`running on port ${PORT}`))

app.post('/wave-hello', (req, res) => {
    // load
    let logData = JSON.parse(fs.readFileSync('log.json'));
    
    // append
    logData.users.push(req.body);
    
    // write
    fs.writeFileSync("log.json", JSON.stringify(logData, null, 2))

    // send response
    res.send( {received: "👌"} );
})
