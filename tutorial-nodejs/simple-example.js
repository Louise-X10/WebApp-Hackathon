const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const port = 3001;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/simple-example.html');
});

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});