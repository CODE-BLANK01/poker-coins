import { useState } from 'react';

export default function Home({ onCreate, onJoin, error }) {
  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [startChips, setStartChips] = useState('1000');
  const [code, setCode] = useState('');

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name: name.trim(), startChips: parseInt(startChips) || 1000 });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    onJoin({ name: name.trim(), code: code.trim().toUpperCase() });
  }

  return (
    <div className="home">
      <div className="home-logo">🃏</div>
      <h1 className="home-title">Poker Coins</h1>
      <p className="home-sub">Digital chips for your card games</p>

      <div className="home-card">
        {error && <div className="error-msg">{error}</div>}

        <div className="tab-row">
          <button className={`tab-btn ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>
            Create Room
          </button>
          <button className={`tab-btn ${tab === 'join' ? 'active' : ''}`} onClick={() => setTab('join')}>
            Join Room
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Alice"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Starting Chips per Player</label>
              <input
                className="form-input"
                type="number"
                placeholder="1000"
                value={startChips}
                onChange={e => setStartChips(e.target.value)}
                min={10}
                max={1000000}
                required
              />
            </div>
            <button className="btn btn-gold" type="submit">
              🎯 Create Room
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Bob"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                autoFocus
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Room Code</label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. ABC123"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                required
              />
            </div>
            <button className="btn btn-gold" type="submit">
              🚀 Join Room
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
