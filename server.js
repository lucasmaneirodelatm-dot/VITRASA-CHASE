const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
// Servir public
app.use(express.static(path.join(__dirname, 'public')));
// Endpoints auxiliares
app.get('/health', (req, res) => res.send('ok'));
// Simple in-memory state (para prototipado)
const rooms = {}; // { roomId: { players: {}, buses:[], ... } }
io.on('connection', (socket) => {
console.log('socket connected', socket.id);
socket.on('create_room', (data, cb) => {
// data: { name, role, level }
const roomId = 'room-' + Math.random().toString(36).slice(2,8);
rooms[roomId] = { players: {}, buses: [], createdAt: Date.now() };
rooms[roomId].players[socket.id] = data;
socket.join(roomId);
cb({ ok: true, roomId });
});
socket.on('join_room', (data, cb) => {
const { roomId, name, level } = data;
if (!rooms[roomId]) return cb({ ok: false, error: 'room-not-found' });
rooms[roomId].players[socket.id] = { name, level };
socket.join(roomId);
io.to(roomId).emit('player_joined', { players: rooms[roomId].players });
cb({ ok: true });
});
socket.on('start_game', (roomId) => {
if (!rooms[roomId]) return;
// placeholder: create buses and schedule
rooms[roomId].buses = [];
io.to(roomId).emit('game_started', { msg: 'Game starting (stub)' });
});
socket.on('disconnect', () => {
// remove from rooms
for (const [rid, r] of Object.entries(rooms)) {
if (r.players[socket.id]) {
delete r.players[socket.id];
io.to(rid).emit('player_left', { id: socket.id });
}
// optional: cleanup empty rooms
if (Object.keys(r.players).length === 0) delete rooms[rid];
}
});
});
server.listen(PORT, () => console.log('Server listening on', PORT));