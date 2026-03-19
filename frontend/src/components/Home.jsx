import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

function Home() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const generateRoomId = (e) => {
    e.preventDefault();
    setRoomId(uuid());
    toast.success('Room ID generated');
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error('Both fields are required');
      return;
    }
    navigate(`/room/${roomId}`, { state: { username } });
  };

  const handleInputEnter = (e) => {
    if (e.code === 'Enter') joinRoom();
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="text-primary text-2xl font-bold font-code">{'<CodeRome />'}</Link>
          <p className="text-muted mt-2">Join or create a room</p>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={handleInputEnter}
            className="input-field"
            placeholder="Room ID"
          />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyUp={handleInputEnter}
            className="input-field"
            placeholder="Username"
          />
          <button onClick={joinRoom} className="btn-success w-full">
            Join Room
          </button>
          <p className="text-center text-muted text-sm">
            No room ID?{' '}
            <button onClick={generateRoomId} className="text-primary hover:underline">
              Generate one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
