const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let onlineUsers = {}; // username -> socket.id

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userData) => {
    const username = userData.username.toLowerCase();
    
    const isTaken = Object.values(onlineUsers).some(u => u.username === username);
    if (isTaken) {
      socket.emit('name_taken', 'This username is already taken!');
      return;
    }

    socket.username = username;
    onlineUsers[socket.id] = { username, avatar: userData.avatar, socketId: socket.id };
    
    socket.emit('join_success');
    io.emit('update_users', Object.values(onlineUsers));
  });

  socket.on('chat_message', (data) => {
    const target = onlineUsers[data.toSocketId];
    if (target) {
      io.to(target.socketId).emit('chat_message', {
        from: socket.username,
        content: data.content,
        msgType: data.msgType
      });
    }
  });

  socket.on('disconnect', () => {
    delete onlineUsers[socket.id];
    io.emit('update_users', Object.values(onlineUsers));
    console.log('User disconnected:', socket.id);
  });
});

// Render ke liye PORT configuration fix
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
