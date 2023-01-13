const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  //res.send('<h1>Hello world</h1>');
  res.sendFile(__dirname + '/chat.html');
});

/* io.on('connection', (socket) => {
  console.log('a user connected'); //* Log message when another user joins the server
  socket.on('disconnect', () => {
    console.log('user disconnected'); //* Log message when another user leaves the server
  });
}); */

// send message to everyone, including senter
io.on('connection', (socket) => {
  socket.on('chat message', (msg) => { // all connected sockets listen to 'chat message' event
    console.log('message' + msg);
    io.emit('chat message', msg); // once 'chat message' event fired, emit to all connected sockets
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});