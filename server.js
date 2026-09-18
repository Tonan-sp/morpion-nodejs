const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" } // Autorise les connexions depuis n'importe quel navigateur
});

let waitingPlayer = null;

io.on('connection', (socket) => {
  if (!waitingPlayer) {
    waitingPlayer = socket;
    socket.emit('waiting', 'En attente d\'un adversaire...');
  } else {
    const room = `room_${socket.id}_${waitingPlayer.id}`;
    socket.join(room);
    waitingPlayer.join(room);

    // Informe les 2 joueurs que la partie commence et leur attribue un symbole (X ou O)
    waitingPlayer.emit('startGame', { room, symbol: 'X', myTurn: true });
    socket.emit('startGame', { room, symbol: 'O', myTurn: false });

    waitingPlayer = null;
  }

  socket.on('makeMove', (data) => {
    // Transmet le coup joué à l'adversaire
    socket.to(data.room).emit('moveMade', data);
  });

  socket.on('disconnect', () => {
    if (waitingPlayer === socket) waitingPlayer = null;
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Serveur lancé sur le port ${PORT}`));