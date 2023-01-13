const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3000;

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

var chatHistory = []
// send message to everyone, including senter
io.on('connection', (socket) => {
  console.log('new user connected');
  console.log('chat history', chatHistory);
  chatHistory.forEach(msg=>io.emit('chat message', msg)); // load all previous messages
  socket.on('chat message', (msg) => { // all connected sockets listen to 'chat message' event
    console.log('message' + msg);
    chatHistory.push(msg);
    console.log('chat history update to', chatHistory);
    io.emit('chat message', msg); // once 'chat message' event fired, emit to all connected sockets
  });
});

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});