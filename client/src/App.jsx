import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import Home from './Home';
import GameRoom from './GameRoom';

export default function App() {
  const socketRef = useRef(null);
  const [screen, setScreen] = useState('home');
  const [error, setError] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on('joined', ({ code, playerId: pid }) => {
      setRoomCode(code);
      setPlayerId(pid);
      setError('');
      setScreen('game');
    });

    socket.on('state', (state) => setGameState(state));

    socket.on('err', (msg) => setError(msg));

    socket.on('kicked', () => {
      setScreen('home');
      setGameState(null);
      setError('You were removed from the room.');
    });

    socket.on('disconnect', () => {
      if (screen === 'game') setError('Connection lost. Reconnecting…');
    });

    socket.on('connect', () => setError(''));

    return () => socket.disconnect();
  }, []);

  const handleCreate = useCallback(({ name, startChips }) => {
    setError('');
    socketRef.current?.emit('create', { name, startChips });
  }, []);

  const handleJoin = useCallback(({ name, code }) => {
    setError('');
    socketRef.current?.emit('join', { name, code });
  }, []);

  const handleLeave = useCallback(() => {
    setScreen('home');
    setGameState(null);
    setRoomCode('');
    setPlayerId('');
  }, []);

  if (screen === 'game' && gameState) {
    return (
      <GameRoom
        socket={socketRef.current}
        code={roomCode}
        playerId={playerId}
        state={gameState}
        onLeave={handleLeave}
      />
    );
  }

  return <Home onCreate={handleCreate} onJoin={handleJoin} error={error} />;
}
