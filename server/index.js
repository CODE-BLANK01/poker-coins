import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

const rooms = new Map();

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function snapshot(room) {
  return {
    code: room.code,
    pot: room.pot,
    hostId: room.hostId,
    players: Array.from(room.players.values()),
  };
}

function push(code) {
  const room = rooms.get(code);
  if (room) io.to(code).emit('state', snapshot(room));
}

io.on('connection', (socket) => {
  let roomCode = null;

  socket.on('create', ({ name, startChips }) => {
    const code = genCode();
    const chips = Math.max(10, Math.min(1_000_000, parseInt(startChips) || 1000));
    rooms.set(code, {
      code,
      hostId: socket.id,
      pot: 0,
      settings: { startChips: chips },
      players: new Map([[socket.id, { id: socket.id, name: name.trim().slice(0, 20), chips, bet: 0 }]]),
    });
    roomCode = code;
    socket.join(code);
    socket.emit('joined', { code, playerId: socket.id });
    push(code);
  });

  socket.on('join', ({ name, code: raw }) => {
    const code = raw?.toString().trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return socket.emit('err', 'Room not found. Check the code and try again.');
    room.players.set(socket.id, {
      id: socket.id,
      name: name.trim().slice(0, 20),
      chips: room.settings.startChips,
      bet: 0,
    });
    roomCode = code;
    socket.join(code);
    socket.emit('joined', { code, playerId: socket.id });
    push(code);
  });

  socket.on('bet', ({ amount }) => {
    const room = rooms.get(roomCode);
    const player = room?.players.get(socket.id);
    if (!player) return;
    const a = Math.min(Math.max(0, Math.floor(amount)), player.chips);
    player.chips -= a;
    player.bet += a;
    room.pot += a;
    push(roomCode);
  });

  socket.on('award', ({ to }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;
    const winner = room.players.get(to);
    if (!winner || room.pot === 0) return;
    winner.chips += room.pot;
    room.pot = 0;
    room.players.forEach((p) => { p.bet = 0; });
    push(roomCode);
  });

  socket.on('addchips', ({ to, amount }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;
    const player = room.players.get(to);
    if (!player) return;
    player.chips += Math.max(1, Math.floor(amount));
    push(roomCode);
  });

  socket.on('newhand', () => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id) return;
    room.players.forEach((p) => { p.bet = 0; });
    push(roomCode);
  });

  socket.on('kick', ({ playerId }) => {
    const room = rooms.get(roomCode);
    if (!room || room.hostId !== socket.id || playerId === socket.id) return;
    room.players.delete(playerId);
    io.to(playerId).emit('kicked');
    push(roomCode);
  });

  socket.on('disconnect', () => {
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    room.players.delete(socket.id);
    if (room.players.size === 0) { rooms.delete(roomCode); return; }
    if (room.hostId === socket.id) {
      room.hostId = room.players.keys().next().value;
    }
    push(roomCode);
  });
});

const clientDist = join(__dirname, '../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_, res) => res.sendFile(join(clientDist, 'index.html')));
}

const PORT = process.env.PORT || 3003;
httpServer.listen(PORT, () => console.log(`🃏 PokerCoins server on :${PORT}`));
