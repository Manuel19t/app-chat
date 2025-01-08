const { createClient } = require('redis');

const redisClient = createClient({
  url: 'redis://redis:6379' 
});

redisClient.on('error', (err) => {
  console.log('Redis Client Error:', err);
});

redisClient.connect().then(() => {
  console.log('Conectado a Redis');
}).catch((err) => {
  console.log('Error de conexión a Redis:', err);
});

module.exports = redisClient;
