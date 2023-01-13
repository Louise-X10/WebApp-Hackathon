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

var chatHistory = [];
var users = [];

// send message to everyone, including senter
io.on('connection', (socket) => {
  console.log('new user connected');

  // load all previous messages
  chatHistory.forEach(history=>io.emit('chat message', history[0], history[1])); 

  io.emit('ask username');
  console.log('ask for user name');

  // all connected sockets listen to 'send username' event
  socket.on('send username', (username)=>{
    socket.username = username;
  })

  socket.on('disconnect', () => {
    console.log('user disconnected');
    socket.username = '';
  })

  // all connected sockets listen to 'chat message' event
  socket.on('chat message', (msg) => { 
    console.log('message ' + msg + ' by user ' + socket.username);
    chatHistory.push([msg, socket.username]);
    io.emit('chat message', msg, socket.username); // once 'chat message' event fired, emit to all connected sockets
  });

});

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});