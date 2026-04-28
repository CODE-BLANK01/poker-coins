import { useState, useCallback } from 'react';

const fmt = (n) => Number(n).toLocaleString();

export default function GameRoom({ socket, code, playerId, state, onLeave }) {
  const [betAmount, setBetAmount] = useState('');
  const [showAward, setShowAward] = useState(false);
  const [showAddChips, setShowAddChips] = useState(null);
  const [addChipsAmount, setAddChipsAmount] = useState('');
  const [toast, setToast] = useState('');
  const [toastKey, setToastKey] = useState(0);

  const amHost = state.hostId === playerId;
  const me = state.players.find(p => p.id === playerId);

  function showToast(msg) {
    setToast(msg);
    setToastKey(k => k + 1);
  }

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => showToast('Room code copied!'));
  }

  function placeBet() {
    const amount = parseInt(betAmount);
    if (!amount || amount <= 0) return;
    socket.emit('bet', { amount });
    setBetAmount('');
  }

  function setQuickBet(amount) {
    setBetAmount(String(amount));
  }

  function setAllIn() {
    if (me) setBetAmount(String(me.chips));
  }

  function awardPot(toId) {
    socket.emit('award', { to: toId });
    setShowAward(false);
  }

  function addChips() {
    const amount = parseInt(addChipsAmount);
    if (!amount || amount <= 0 || !showAddChips) return;
    socket.emit('addchips', { to: showAddChips.id, amount });
    setShowAddChips(null);
    setAddChipsAmount('');
  }

  function kickPlayer(pid) {
    if (confirm('Remove this player from the room?')) {
      socket.emit('kick', { playerId: pid });
    }
  }

  const quickAmounts = [25, 50, 100, 500];

  return (
    <div className="game-room">
      {toast && <div key={toastKey} className="toast">{toast}</div>}

      {/* Header */}
      <header className="game-header">
        <div className="game-logo">🃏 Poker Coins</div>
        <div className="room-code-pill" onClick={copyCode} title="Tap to copy">
          <span className="room-code-text">{code}</span>
          <span className="copy-icon">📋</span>
        </div>
        <button className="leave-btn" onClick={onLeave}>Leave</button>
      </header>

      {/* Scrollable content */}
      <div className="game-content">

        {/* Pot */}
        <div className="pot-area">
          <div className="pot-label">Current Pot</div>
          <div className="pot-amount">
            🪙 {state.pot > 0 ? fmt(state.pot) : <span className="empty-pot">0</span>}
          </div>
          {amHost && (
            <div className="pot-actions">
              <button
                className="pot-award-btn"
                disabled={state.pot === 0}
                onClick={() => setShowAward(true)}
              >
                🏆 Award Pot
              </button>
              <button className="new-hand-btn" onClick={() => socket.emit('newhand')}>
                🔄 New Hand
              </button>
            </div>
          )}
        </div>

        {/* Players */}
        <div className="section-label">Players ({state.players.length})</div>
        <div className="players-list">
          {state.players.map(player => {
            const isMe = player.id === playerId;
            const isPlayerHost = player.id === state.hostId;
            const initial = player.name.charAt(0).toUpperCase();

            return (
              <div key={player.id} className={`player-card${isMe ? ' is-me' : ''}`}>
                <div className="player-avatar">{initial}</div>

                <div className="player-info">
                  <div className="player-name-row">
                    <span className="player-name">{player.name}</span>
                    {isPlayerHost && <span className="badge badge-host">HOST</span>}
                    {isMe && <span className="badge badge-you">YOU</span>}
                  </div>
                  {player.bet > 0 && (
                    <div className="player-bet">
                      bet: <strong>{fmt(player.bet)}</strong>
                    </div>
                  )}
                </div>

                <div className="player-chips">
                  <span className="chips-amount">{fmt(player.chips)}</span>
                  <span className="chips-label">chips</span>
                </div>

                {amHost && !isMe && (
                  <div className="player-actions">
                    <button
                      className="icon-btn"
                      title="Add chips (buy-in)"
                      onClick={() => { setShowAddChips(player); setAddChipsAmount(''); }}
                    >
                      ➕
                    </button>
                    <button
                      className="icon-btn danger"
                      title="Remove player"
                      onClick={() => kickPlayer(player.id)}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Spacer so content isn't hidden behind bet controls */}
        <div style={{ height: 8 }} />
      </div>

      {/* Bet Controls — sticky bottom */}
      <div className="bet-controls">
        <div className="bet-header">
          <span className="bet-title">Place a Bet</span>
          {me && (
            <span className="my-stack">
              Stack: <strong>{fmt(me.chips)}</strong>
            </span>
          )}
        </div>

        <div className="quick-bets">
          {quickAmounts.map(amt => (
            <button
              key={amt}
              className={`quick-bet-btn${betAmount === String(amt) ? ' selected' : ''}`}
              onClick={() => setQuickBet(amt)}
              disabled={me && amt > me.chips}
            >
              {fmt(amt)}
            </button>
          ))}
          <button
            className={`quick-bet-btn${me && betAmount === String(me?.chips) ? ' selected' : ''}`}
            onClick={setAllIn}
            disabled={!me || me.chips === 0}
          >
            All In
          </button>
        </div>

        <div className="bet-row">
          <input
            className="bet-input"
            type="number"
            placeholder="Custom amount…"
            value={betAmount}
            onChange={e => setBetAmount(e.target.value)}
            min={1}
            max={me?.chips}
            onKeyDown={e => e.key === 'Enter' && placeBet()}
          />
          <button
            className="place-bet-btn"
            onClick={placeBet}
            disabled={!betAmount || parseInt(betAmount) <= 0 || !me || parseInt(betAmount) > me.chips}
          >
            Bet {betAmount ? fmt(parseInt(betAmount)) : ''}
          </button>
        </div>
      </div>

      {/* Award Pot Modal */}
      {showAward && (
        <div className="modal-overlay" onClick={() => setShowAward(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🏆 Award Pot</div>
            <div className="modal-sub">
              Pot: {fmt(state.pot)} chips — who won this hand?
            </div>
            <div className="modal-players">
              {state.players.map(p => (
                <button key={p.id} className="modal-player-btn" onClick={() => awardPot(p.id)}>
                  <span>{p.name} {p.id === playerId ? '(you)' : ''}</span>
                  <span className="modal-player-chips">{fmt(p.chips)} chips</span>
                </button>
              ))}
            </div>
            <button className="modal-cancel" onClick={() => setShowAward(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add Chips Modal */}
      {showAddChips && (
        <div className="modal-overlay" onClick={() => setShowAddChips(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">➕ Add Chips</div>
            <div className="modal-sub">Buy-in for {showAddChips.name}</div>
            <div className="add-chips-form">
              <input
                className="add-chips-input"
                type="number"
                placeholder="Amount…"
                value={addChipsAmount}
                onChange={e => setAddChipsAmount(e.target.value)}
                autoFocus
                min={1}
                onKeyDown={e => e.key === 'Enter' && addChips()}
              />
              <button className="add-chips-btn" onClick={addChips}>
                Add
              </button>
            </div>
            <button className="modal-cancel" onClick={() => setShowAddChips(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
