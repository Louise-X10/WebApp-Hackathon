const express = require('express');
const app = express();
//const path = require('path');

const port = 3000;

app.use(express.static(__dirname));

app.listen(port, function(err){
    if (err) throw err;
    console.log(`Poker app listening on port ${port}!`);
})