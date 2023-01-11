const express = require('express');
const app = express();
//const path = require('path');

const port = 3000;

app.use(express.static(__dirname));

/* app.get('/', function(req, res){
    var fileName = path.join(__dirname, 'index.html');
    res.sendFile(fileName, function(err){
        if (err) throw err;
        else {console.log('Sent:', fileName)}
    })
}) */

app.listen(port, function(err){
    if (err) throw err;
    console.log(`Poker app listening on port ${port}!`);
})

/* 
// Use Node.js
const http = require('http');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req,res)=>{
    res.writeHead(200, {
        'Content-Type': 'text/html',
    })
    fs.readFile('index.html', function(err,data){
        if (err){
            res.writeHead(404)
            res.write('Error: File Not Found')
        } else {
            res.write(data)
        }
        res.end()
    })
});

server.listen(port, hostname, (err) => {
    if (err) throw err;
    else {console.log(`Server running at http://${hostname}:${port}/`);}
  
}); */