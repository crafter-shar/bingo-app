'use client'

import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../supabase'

const imgBingoVector = "https://www.figma.com/api/mcp/asset/e2b83636-0495-407e-9741-fafb4fcceb7d"
const imgUserIcon = "https://www.figma.com/api/mcp/asset/d0972d74-a036-44e7-b696-4169b9b3532d"

export default function GamePage({ params }) {
  const { code, name } = React.use(params)
  const [board, setBoard] = useState([])
  const [markedSquares, setMarkedSquares] = useState([])
  const [selectedSquare, setSelectedSquare] = useState(null)
  const [previewPhoto, setPreviewPhoto] = useState(null)
  const [winner, setWinner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState([])
  const [someoneWon, setSomeoneWon] = useState(null)
  const [winTime, setWinTime] = useState(null)
  const [gameOver, setGameOver] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    loadBoard()
    loadPlayers()

    const channel = supabase
      .channel(`room-${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, () => {
        loadPlayers()
      })
      .on('broadcast', { event: 'winner' }, ({ payload }) => {
        setSomeoneWon(payload.playerName)
      })
      .subscribe()

    channelRef.current = channel
    return () => supabase.removeChannel(channel)
  }, [])

  async function loadBoard() {
    setLoading(true)
    const { data } = await supabase
      .from('players')
      .select('board, marked_squares')
      .eq('room_code', code)
      .eq('player_name', decodeURIComponent(name))
      .single()
    if (data) {
      setBoard(data.board)
      setMarkedSquares(data.marked_squares || [])
    }
    setLoading(false)
  }

  async function loadPlayers() {
    const { data } = await supabase
      .from('players')
      .select('player_name, marked_squares')
      .eq('room_code', code)
    if (data) setPlayers(data)
  }

  async function openCamera(index) {
    setSelectedSquare(index)
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    videoRef.current.srcObject = stream
    videoRef.current.play()
  }

  async function takePhoto() {
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const photo = canvas.toDataURL('image/jpeg', 0.5)
    video.srcObject.getTracks().forEach(track => track.stop())
    setPreviewPhoto({ photo, index: selectedSquare })
    setSelectedSquare(null)
  }

  async function retakePhoto() {
    const index = previewPhoto.index
    setPreviewPhoto(null)
    openCamera(index)
  }

  async function confirmPhoto() {
    const { photo, index } = previewPhoto
    const newMarked = markedSquares.filter(m => m.index !== index)
    newMarked.push({ index, photo })
    setMarkedSquares(newMarked)
    setPreviewPhoto(null)

    await supabase.from('players').update({ marked_squares: newMarked })
      .eq('room_code', code)
      .eq('player_name', decodeURIComponent(name))

    checkWinner(newMarked)
  }

  function checkWinner(marked) {
    const indices = marked.map(m => m.index)
    const lines = [
      [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14], [15,16,17,18,19], [20,21,22,23,24],
      [0,5,10,15,20], [1,6,11,16,21], [2,7,12,17,22], [3,8,13,18,23], [4,9,14,19,24],
      [0,6,12,18,24], [4,8,12,16,20]
    ]
    for (let line of lines) {
      if (line.every(i => indices.includes(i) || board[i] === 'FREE')) {
        setWinner(true)
        setWinTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
        channelRef.current.send({
          type: 'broadcast',
          event: 'winner',
          payload: { playerName: decodeURIComponent(name) }
        })
      }
    }
  }

  function isMarked(index) {
    return markedSquares.some(m => m.index === index) || board[index] === 'FREE'
  }

  function getPhoto(index) {
    return markedSquares.find(m => m.index === index)?.photo
  }

  const markedCount = markedSquares.length

  return (
    <main style={{ backgroundColor: '#E5E5E5', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
        <button
          onClick={() => window.location.href = '/'}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', fontSize: '14px', fontWeight: '600' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Leave game
        </button>
        <div style={{ width: '90px' }} />
        <span style={{ fontSize: '14px', fontWeight: '700', color: '#262626' }}>Scavenger Hunt Bingo</span>
      </div>

      {/* Game info bar */}
      <div style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <img src={imgBingoVector} alt="Bingo" style={{ width: '40px', height: '40px', transform: 'rotate(-15deg)', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', width: '60px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#262626' }}>Room</span>
          <span style={{ fontSize: '14px', fontWeight: '300', color: '#262626' }}>{code}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', width: '60px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#262626' }}>Squares</span>
          <span style={{ fontSize: '14px', fontWeight: '300', color: '#262626' }}>{String(markedCount).padStart(2,'0')}/24</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#262626' }}>You</span>
          <span style={{ fontSize: '14px', fontWeight: '300', color: '#262626' }}>{decodeURIComponent(name)}</span>
        </div>
      </div>

      {/* Win banners */}
      {winner && (
        <div
          onClick={() => setGameOver(true)}
          style={{ backgroundColor: '#166534', color: 'white', fontWeight: '700', fontSize: '16px', padding: '12px 16px', textAlign: 'center', cursor: 'pointer' }}
        >
          You won BINGO! — Tap to see your card 🎉
          {winTime && <div style={{ fontSize: '12px', fontWeight: '400', marginTop: '2px', opacity: 0.85 }}>at {winTime}</div>}
        </div>
      )}
      {someoneWon && someoneWon !== decodeURIComponent(name) && (
        <div
          onClick={() => setGameOver(true)}
          style={{ backgroundColor: '#B45309', color: 'white', fontWeight: '700', fontSize: '16px', padding: '12px 16px', textAlign: 'center', cursor: 'pointer' }}
        >
          {someoneWon} got BINGO! — Tap to see your card
        </div>
      )}

      {/* Board */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        {loading ? (
          <p style={{ color: '#A8A29E' }}>Loading board...</p>
        ) : board.length === 0 ? (
          <p style={{ color: '#EF4444' }}>No board found!</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', width: '100%', maxWidth: '543px', maxHeight: '543px', aspectRatio: '1' }}>
            {board.map((word, index) => (
              <div
                key={index}
                onClick={() => openCamera(index)}
                style={{
                  backgroundColor: board[index] === 'FREE' ? '#57534E' : '#FAFAFA',
                  border: board[index] === 'FREE' ? '1px solid #E7E5E4' : '1px solid #D6D3D1',
                  borderRadius: '8px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: board[index] === 'FREE' ? 'default' : 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  overflow: 'hidden',
                  position: 'relative',
                  aspectRatio: '1'
                }}
              >
                {getPhoto(index) ? (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <img src={getPhoto(index)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: '8px', fontWeight: 'bold', textAlign: 'center', padding: '2px' }}>{word}</span>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '8px', fontWeight: board[index] === 'FREE' ? '500' : '600', color: board[index] === 'FREE' ? 'white' : '#262626', textAlign: 'center', lineHeight: '1.25' }}>
                    {word === 'FREE' ? 'Free space' : word}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Players bar */}
      <div style={{ backgroundColor: '#D4D4D4', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', padding: '16px', boxShadow: '0 -1px 3px rgba(0,0,0,0.1)' }}>
        {players.map((player, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1, maxWidth: '200px' }}>
            <div style={{ backgroundColor: '#92400E', borderRadius: '50px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={imgUserIcon} alt="" style={{ width: '20px', height: '20px' }} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: '500', color: '#292524', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80px', textAlign: 'center' }}>
              {player.player_name}
            </span>
            <span style={{ fontSize: '12px', fontWeight: '400', color: '#292524' }}>
              {String((player.marked_squares || []).length).padStart(2,'0')}/24
            </span>
          </div>
        ))}
      </div>

      {/* Camera overlay */}
      {selectedSquare !== null && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#E5E5E5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
          
          {/* Word at top */}
          <div style={{ padding: '16px', textAlign: 'center', paddingTop: '48px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#262626', margin: '0 0 4px 0' }}>Category or item</p>
            <p style={{ fontSize: '30px', fontWeight: '700', color: '#292524', margin: 0, lineHeight: '36px' }}>{board[selectedSquare]}</p>
          </div>

          {/* Camera preview + buttons all constrained to same width */}
          <div style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', width: '100%', aspectRatio: '1' }}>
                <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{ padding: '16px 0 0' }}>
                <button
                  onClick={takePhoto}
                  style={{ backgroundColor: '#57534E', color: '#E5E5E5', border: 'none', borderRadius: '50px', padding: '10px 16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', width: '100%' }}
                >
                  Capture photo
                </button>
              </div>
              <div style={{ padding: '8px 0 0', display: 'flex', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    videoRef.current.srcObject.getTracks().forEach(track => track.stop())
                    setSelectedSquare(null)
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#292524', fontSize: '16px', fontWeight: '500' }}
                >
                  Back to bingo card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview overlay */}
      {previewPhoto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#E5E5E5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

          {/* Word at top */}
          <div style={{ padding: '16px', textAlign: 'center', paddingTop: '48px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#262626', margin: '0 0 4px 0' }}>Category or item</p>
            <p style={{ fontSize: '30px', fontWeight: '700', color: '#292524', margin: 0, lineHeight: '36px' }}>{board[previewPhoto.index]}</p>
          </div>

          {/* Photo preview + buttons */}
          <div style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', width: '100%', aspectRatio: '1' }}>
                <img src={previewPhoto.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '16px 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={confirmPhoto}
                  style={{ backgroundColor: '#57534E', color: '#E5E5E5', border: 'none', borderRadius: '50px', padding: '10px 16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', width: '100%' }}
                >
                  Use this Photo
                </button>
                <button
                  onClick={retakePhoto}
                  style={{ backgroundColor: 'transparent', color: '#525252', border: '1px solid #A8A29E', borderRadius: '50px', padding: '10px 16px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', width: '100%' }}
                >
                  Retake
                </button>
              </div>
            </div>
          </div>

          {/* Back link pinned to bottom */}
          <div style={{ padding: '16px 16px 24px', display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
            <button
              onClick={() => setPreviewPhoto(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#292524', fontSize: '16px', fontWeight: '500' }}
            >
              Back to bingo card
            </button>
          </div>
        </div>
      )}

      {/* Game over screen */}
      {gameOver && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#E5E5E5', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px' }}>
            <button
              onClick={() => setGameOver(false)}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#92400E', fontSize: '14px', fontWeight: '600' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Back
            </button>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#262626' }}>Scavenger Hunt Bingo</span>
          </div>

          {/* Win/loss message */}
          <div style={{ padding: '24px 16px 8px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#262626', margin: '0 0 4px 0' }}>Game over</p>
            <p style={{ fontSize: '30px', fontWeight: '700', color: '#292524', margin: 0, lineHeight: '36px' }}>
              {winner ? 'You won BINGO! 🏆' : `${someoneWon} got BINGO!`}
            </p>
          </div>

          {/* Board preview */}
          <div style={{ flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div id="bingo-board-export" style={{ width: '100%', maxWidth: '480px', backgroundColor: '#E5E5E5', borderRadius: '8px', padding: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', width: '100%', aspectRatio: '1' }}>
                {board.map((word, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: board[index] === 'FREE' ? '#57534E' : '#FAFAFA',
                      border: board[index] === 'FREE' ? '1px solid #E7E5E4' : '1px solid #D6D3D1',
                      borderRadius: '6px',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      aspectRatio: '1'
                    }}
                  >
                    {getPhoto(index) ? (
                      <div style={{ position: 'absolute', inset: 0 }}>
                        <img src={getPhoto(index)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: 'white', fontSize: '6px', fontWeight: 'bold', textAlign: 'center', padding: '1px' }}>{word}</span>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '6px', fontWeight: board[index] === 'FREE' ? '500' : '600', color: board[index] === 'FREE' ? 'white' : '#262626', textAlign: 'center', lineHeight: '1.25' }}>
                        {word === 'FREE' ? 'Free' : word}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
             onClick={async () => {
                const el = document.getElementById('bingo-board-export')
                const html2canvas = (await import('html2canvas')).default
                const canvas = await html2canvas(el)
                const link = document.createElement('a')
                link.download = 'my-bingo-card.png'
                link.href = canvas.toDataURL()
                link.click()
              }}
              style={{ backgroundColor: '#57534E', color: '#E5E5E5', border: 'none', borderRadius: '50px', padding: '10px 16px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', width: '100%' }}
            >
              Export Image
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{ backgroundColor: 'transparent', color: '#525252', border: '1px solid #A8A29E', borderRadius: '50px', padding: '10px 16px', fontSize: '16px', fontWeight: '500', cursor: 'pointer', width: '100%' }}
            >
              Play Again
            </button>
          </div>

          {/* Bottom spacing */}
          <div style={{ padding: '24px' }} />
        </div>
      )}

    </main>
  )
}