'use client'

import { useState } from 'react'
import { supabase } from './supabase'

export default function Home() {
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [customWords, setCustomWords] = useState(null)
  const [fileName, setFileName] = useState('No file chosen')

  async function createGame() {
    if (!playerName.trim()) return alert('Please enter your name!')
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    await supabase.from('games').insert({ room_code: code })
    await supabase.from('players').insert({
      room_code: code,
      player_name: playerName,
      board: generateBoard(customWords),
      marked_squares: []
    })
    window.location.href = `/game/${encodeURIComponent(code)}/${encodeURIComponent(playerName)}`
  }

  async function joinGame() {
    if (!playerName.trim()) return alert('Please enter your name!')
    if (!roomCode.trim()) return alert('Please enter a room code!')
    const { error } = await supabase.from('players').insert({
      room_code: roomCode,
      player_name: playerName,
      board: generateBoard(customWords),
      marked_squares: []
    })
    if (error) {
      alert('Error joining game: ' + error.message)
      return
    }
    window.location.href = `/game/${encodeURIComponent(roomCode)}/${encodeURIComponent(playerName)}`
  }

  function generateBoard(words) {
    const wordList = words || [
      'Sun', 'Beach', 'Sand', 'Wave', 'Palm',
      'Surf', 'Shell', 'Crab', 'Fish', 'Boat',
      'Tan', 'Swim', 'Dive', 'Salt', 'Tide',
      'Reef', 'Gull', 'Dock', 'Pier', 'Buoy',
      'Sail', 'Mast', 'Anchor', 'Dune', 'Tide'
    ]
    const shuffled = [...wordList].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, 24)
    picked.splice(12, 0, 'FREE')
    return picked
  }

  return (
    <main style={{ backgroundColor: '#292524', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingTop: '80px', fontFamily: 'Inter, sans-serif' }}>
      

      {/* Top content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', alignItems: 'center', width: '293px' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%' }}>
          <img
            src="/bingo-vector.png"
            alt="Bingo"
            style={{ width: '75px', height: '75px', transform: 'rotate(-15deg)', marginBottom: '4px' }}
          />
          <h1 style={{ color: '#F5F5F4', fontSize: '30px', fontWeight: '700', textAlign: 'center', margin: 0, lineHeight: '36px' }}>
            Scavenger Hunt Bingo
          </h1>
        </div>

        {/* Name input - only show when not joining */}
        {!joining && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
            <label style={{ color: '#D4D4D4', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>
              Enter player name
            </label>
            <input
              style={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px', padding: '8px 16px', color: '#FAFAFA', fontSize: '16px', textAlign: 'center', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              placeholder="John Doe"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
            />
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          {!joining ? (
            <>
              <button
                onClick={createGame}
                style={{ backgroundColor: '#E7E5E4', color: '#262626', border: 'none', borderRadius: '50px', padding: '10px 16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', width: '100%' }}
              >
                Start a new game
              </button>
              <button
                onClick={() => setJoining(true)}
                style={{ backgroundColor: 'transparent', color: '#E7E5E4', border: '1px solid #A8A29E', borderRadius: '50px', padding: '10px 16px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', width: '100%' }}
              >
                Join game with code
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ color: '#D4D4D4', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>Enter player name</label>
                  <input
                    style={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px', padding: '8px 16px', color: '#FAFAFA', fontSize: '16px', textAlign: 'center', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    placeholder="John Doe"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ color: '#D4D4D4', fontSize: '14px', fontWeight: '500', textAlign: 'center' }}>Enter room code</label>
                  <input
                    style={{ backgroundColor: '#171717', border: '1px solid #404040', borderRadius: '8px', padding: '8px 16px', color: '#FAFAFA', fontSize: '16px', textAlign: 'center', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    placeholder="ABC123"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '24px' }}>
                <button
                  onClick={joinGame}
                  style={{ backgroundColor: '#E7E5E4', color: '#262626', border: 'none', borderRadius: '50px', padding: '10px 16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', width: '100%' }}
                >
                  Join game
                </button>
                <button
                  onClick={() => setJoining(false)}
                  style={{ backgroundColor: 'transparent', color: '#E7E5E4', border: 'none', padding: '10px 16px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', width: '100%' }}
                >
                  Back to homepage
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom upload - only show when not joining */}
      {!joining && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '16px 16px 48px', width: '360px', boxSizing: 'border-box' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#E7E5E4', fontSize: '16px', fontWeight: '500', cursor: 'pointer', padding: '8px 16px', borderRadius: '50px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E7E5E4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Upload a custom list</span>
            <input
              type="file"
              accept=".txt"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files[0]
                if (!file) return
                const text = await file.text()
                const words = text.split('\n').map(w => w.trim()).filter(w => w.length > 0)
                if (words.length < 24) {
                  alert('Please upload at least 24 words!')
                  return
                }
                setCustomWords(words)
                setFileName(`✅ ${words.length} words loaded`)
              }}
            />
          </label>
          <p style={{ color: '#A8A29E', fontSize: '12px', margin: 0 }}>{fileName}</p>
        </div>
      )}
    </main>
  )
}