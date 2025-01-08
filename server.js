const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');

// Configurar servidor y Redis
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const redisClient = require('./config/redis'); // Asegúrate de importar correctamente el cliente de Redis

const MAX_MESSAGES = 100;

app.use(express.static('public'));

// Almacenar los nombres de usuario
let users = {};

io.on('connection', (socket) => {
  console.log('Un usuario se ha conectado:', socket.id);

  // Enviar los últimos 100 mensajes al nuevo cliente
  redisClient.lRange('chatMessages', 0, MAX_MESSAGES - 1, (err, messages) => {
    messages.forEach((message) => {
      socket.emit('chatMessage', JSON.parse(message)); // Enviar mensajes antiguos al cliente
    });
  });

  // Establecer nombre de usuario
  socket.on('setUsername', (username) => {
    users[socket.id] = username; // Guardar el nombre de usuario en el objeto
  });

  // Manejar el mensaje de texto
  socket.on('chatMessage', (data) => {
    const message = { ...data, username: users[socket.id] || 'Anonymous' };
    const messageString = JSON.stringify(message);
    redisClient.rPush('chatMessages', messageString); // Agregar mensaje a Redis
    redisClient.lTrim('chatMessages', -MAX_MESSAGES, -1); // Mantener solo los últimos 100 mensajes
    io.emit('chatMessage', message); // Reenviar mensaje a todos los clientes
  });

  // Manejar el envío de imágenes
  socket.on('chatImage', (data) => {
    const message = { ...data, username: users[socket.id] || 'Anonymous' };
    const messageString = JSON.stringify(message);
    redisClient.rPush('chatMessages', messageString);
    redisClient.lTrim('chatMessages', -MAX_MESSAGES, -1);
    io.emit('chatImage', message); // Reenviar imagen a todos los clientes
  });

  // Juego de tres en raya
  socket.on('move', (data) => {
    io.emit('move', data); // Reenviar el movimiento a todos los jugadores
  });

  // Evento para desconectar un cliente
  socket.on('disconnect', () => {
    console.log('Un usuario se ha desconectado:', socket.id);
    delete users[socket.id]; // Eliminar al usuario de la lista
  });
});

// Iniciar servidor
server.listen(3000, () => {
  console.log('Servidor escuchando en puerto 3000');
});
