const GM_xmlhttpRequest = require('GM_xmlhttpRequest');

const scrapedData = {
    'item1': "value1",
    'item2': "value2"
    }
    
    GM_xmlhttpRequest ({
      method: 'POST',
      url: 'localhost:3000',
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify(scrapedData) 
    })

/*

const axios = require('axios');

axios.post('http://localhost:3000/users', {
    id: 6,
    first_name: 'Fred',
    last_name: 'Blair',
    email: 'freddyb34@gmail.com'
}).then(resp => {
    console.log(resp.data);
}).catch(error => {
    console.log(error);
});   

*/