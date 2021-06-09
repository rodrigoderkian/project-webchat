const express = require('express');

const app = express();
const http = require('http').createServer(app);
const cors = require('cors');
const moment = require('moment');
const path = require('path');

const io = require('socket.io')(http, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Um agradecimento especial para o mestre Anderson Alves, que me deu uma luz antes de iniciar o projeto, dando dicas e mostrando o caminho das pedras.
// O uso do index para manipular o array de usuários foi visto no código dele, o cara manja demais.

const onlineUsers = [];

const connection = require('./models/connection');

const saveNewMessageInBD = async (data, nickname, message) =>
  connection().then((db) =>
    db.collection('messages')
    .insertOne({ data, nickname, message }));

const messagesBD = async () =>
  connection().then((db) => db.collection('messages').find().toArray());

const userDisconect = (socket) => {
  const index = onlineUsers.findIndex((user) => user.id === socket.id);
  onlineUsers.splice(index, 1);
};

const newMessage = (message) => {
  const data = moment().format('DD-MM-YYYY hh:mm:ss');
  saveNewMessageInBD(data, message.nickname, message.chatMessage);
  io.emit('message', `${data} ${message.nickname} ${message.chatMessage}`);
};

const updateNick = (socket, newNickname) => {
  const index = onlineUsers.findIndex((user) => user.id === socket.id);
  onlineUsers[index].user = newNickname;
  io.emit('updateUsers', onlineUsers);
};

io.on('connection', (socket) => {
  socket.on('newUser', (user) => {
    onlineUsers.push({ id: socket.id, user });
    io.emit('updateUsers', onlineUsers);
  });
  socket.on('messagesBD', async () => {
    io.emit('messagesBD', await messagesBD());
  });
  socket.on('updateNickname', (newNickname) => {
    // Tive que fazer essa função para diminuir o numero de linhas
    updateNick(socket, newNickname);
  });
  socket.on('message', (message) => {
    // Tive que fazer essa função para diminuir o numero de linhas
    newMessage(message);
  });
  socket.on('disconnect', () => {
    // Tive que fazer essa função para diminuir o numero de linhas
    userDisconect(socket);
    io.emit('updateUsers', onlineUsers);
  });
});

app.use(cors());

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, 'index.html'));
});

http.listen(3000, () => {
  console.log('Servidor ouvindo na porta 3000');
});
