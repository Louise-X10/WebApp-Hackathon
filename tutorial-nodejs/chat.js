const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3002;

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

var chatHistory = [];
var users = [];

// send message to everyone, including senter
io.on('connection', (socket) => {
  console.log('new user connected');

  // load all previous messages
  chatHistory.forEach(history=>io.emit('chat message', history[0], history[1])); 

  // Ask username from newly connected user only
  socket.emit('ask username');
  console.log('ask for user name');

  socket.on('disconnect', () => {
    console.log('user disconnected');
    socket.username = '';
  })

  // all connected sockets listen to 'chat message' event
  socket.on('chat message', (msg, username) => { 
    console.log('message ' + msg + ' by user ' + username);
    chatHistory.push([msg, username]);
    console.log('chat history', chatHistory);
    io.emit('chat message', msg, username); // once 'chat message' event fired, emit to all connected sockets
  });

});

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});