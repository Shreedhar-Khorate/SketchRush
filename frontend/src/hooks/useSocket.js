/**
 * useSocket — shared game state driven by Socket.IO
 *
 * This hook connects to the backend, joins a room, and exposes
 * all live game state (players, timer, messages, etc.) so every
 * component stays in sync without prop-drilling.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { socketManager } from '../socket/socketManager'

const ROUND_DURATION = 60

export function useSocket({ roomCode, playerName, avatar }) {
  const [socketId, setSocketId]         = useState(null)
  const [playerId, setPlayerId]         = useState(null)
  const [isHost, setIsHost]             = useState(false)
  const [hostId, setHostId]             = useState(null)
  const [connected, setConnected]       = useState(false)
  const [players, setPlayers]           = useState([])
  const [messages, setMessages]         = useState([])
  const [gameState, setGameState]       = useState('waiting') // waiting | drawing | round_end | game_end | choosing_word
  const [currentDrawerId, setCurrentDrawerId] = useState(null)
  const [currentWord, setCurrentWord]   = useState(null)   // only set for the drawer
  const [wordHint, setWordHint]         = useState('')
  const [wordChoices, setWordChoices]   = useState(null)   // [word1, word2, word3, word4] - only for drawer
  const [timeLeft, setTimeLeft]         = useState(ROUND_DURATION)
  const [round, setRound]               = useState(1)
  const [maxRounds, setMaxRounds]       = useState(5)
  const [roundResult, setRoundResult]   = useState(null)   // { word, leaderboard }
  const [gameResult, setGameResult]     = useState(null)   // { leaderboard, winner }
  const [roundCountdown, setRoundCountdown] = useState(null) // 5, 4, 3, 2, 1, null
  const [hasGuessedCorrectly, setHasGuessedCorrectly] = useState(false)

  const playerIdRef = useRef(null)

  // Callbacks for drawing — set by DrawingCanvas
  const onRemoteDraw   = useRef(null)
  const onRemoteClear  = useRef(null)

  const addMessage = useCallback((msg) => {
    setMessages(prev => [...prev.slice(-199), { ...msg, id: Date.now() + Math.random() }])
  }, [])

  // ── Setup ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomCode || !playerName) return

    const socket = socketManager.connect()

    const unsubs = []
    const sub = (ev, cb) => unsubs.push(socketManager.on(ev, cb))

    // Connection
    sub('connect', () => {
      setConnected(true)
      setSocketId(socket.id)
    })
    sub('disconnect', () => setConnected(false))

    // Server assigned player_id
    sub('connected', ({ player_id }) => {
      setPlayerId(player_id)
      playerIdRef.current = player_id
      // Now join the room
      socketManager.joinRoom(roomCode, playerName, avatar)
    })

    // Room joined — initial state
    sub('room_joined', (data) => {
      setPlayerId(data.player_id)
      playerIdRef.current = data.player_id
      setIsHost(data.is_host)
      setHostId(data.host_id || null)
      setPlayers(Array.isArray(data.players) ? data.players.filter(Boolean) : [])
      setGameState(data.game_state || 'waiting')
      setHasGuessedCorrectly(false)
      addMessage({ type: 'system', content: `✅ Joined room #${data.room_code}` })
    })

    sub('host_changed', ({ host_id }) => {
      setHostId(host_id)
      setIsHost(host_id === playerIdRef.current)
    })

    // Player joined / left (system messages already come through chat_message)
    sub('player_joined', () => {})
    sub('player_left', () => {})

    // Players list update
    sub('players_update', ({ players, host_id }) => {
      setPlayers(Array.isArray(players) ? players.filter(Boolean) : [])
      if (host_id) {
        setHostId(host_id)
        setIsHost(host_id === playerIdRef.current)
      }
    })

    // ── Game events ──────────────────────────────────────────────────────────
    sub('game_started', () => {
      console.log('[useSocket] Game started event received')
      setGameState('playing')
      setRoundResult(null)
      setGameResult(null)
      setHasGuessedCorrectly(false)
    })

    sub('turn_started', (data) => {
      console.log('[useSocket] Turn started event received', data)
      setCurrentDrawerId(data.drawer_id)
      setWordHint('')
      setCurrentWord(null)             // cleared for all players
      setWordChoices(null)             // clear any stale choices
      setRound(data.round)
      setMaxRounds(data.max_rounds)
      setTimeLeft(data.time)
      setRoundResult(null)             // dismiss round end modal
      setRoundCountdown(null)
      setHasGuessedCorrectly(false)
      // Server signals choosing_word state; drawer will get word_choices event
      setGameState('choosing_word')
    })

    // Word sent only to the drawer after they select it
    sub('word_to_draw', ({ word }) => {
      setCurrentWord(word)
      setWordHint(word.split('').map(() => '_').join(' '))
    })

    // Word choices sent to drawer for selection
    sub('word_choices', ({ choices }) => {
      setWordChoices(choices)
      setGameState('choosing_word')
    })

    // Word has been selected by drawer, drawing phase begins
    sub('word_selected', ({ hint }) => {
      setWordChoices(null)             // dismiss word choice modal
      setWordHint(hint)
      setGameState('drawing')
    })

    sub('hint_update', ({ hint }) => setWordHint(hint))

    sub('timer_tick', ({ time }) => setTimeLeft(time))

    sub('round_ended', (data) => {
      setRoundResult(data)
      setGameState('round_end')
      setCurrentWord(null)
      setCurrentDrawerId(null)
      setHasGuessedCorrectly(false)
    })

    sub('game_ended', (data) => {
      setGameResult(data)
      setGameState('game_end')
    })

    sub('round_countdown', ({ countdown }) => {
      if (countdown === 0) {
        // Countdown finished — clear modal, next turn_started will update state
        setRoundResult(null)
        setRoundCountdown(null)
        // Safety net: if turn_started doesn't arrive, don't stay stuck in round_end
        setGameState(prev => prev === 'round_end' ? 'waiting' : prev)
      } else {
        setRoundCountdown(countdown)
      }
    })

    // ── Drawing events ────────────────────────────────────────────────────────
    sub('draw', (data) => {
      if (onRemoteDraw.current) onRemoteDraw.current(data)
    })
    sub('canvas_cleared', () => {
      if (onRemoteClear.current) onRemoteClear.current()
    })

    // ── Chat / guess events ───────────────────────────────────────────────────
    sub('chat_message', (msg) => {
      // Ignore duplicate "correct" messages; we handle via correct_guess.
      if (msg?.type === 'correct') return
      addMessage(msg)
    })

    sub('correct_guess', (data) => {
      const isSelf = data.player_id === playerIdRef.current
      if (isSelf) setHasGuessedCorrectly(true)
      addMessage({
        type: 'correct',
        player: data.player_name,
        avatar: data.player_avatar,
        content: isSelf ? data.word : null,
        points: data.points,
      })
    })

    // Error
    sub('error', ({ message }) => {
      console.error('[useSocket] Error event:', message)
      addMessage({ type: 'system', content: `⚠️ ${message}` })
    })

    return () => {
      unsubs.forEach(fn => fn && fn())
      socketManager.leaveRoom()
      socketManager.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, playerName, avatar])

  // ── Derived ────────────────────────────────────────────────────────────────
  const isDrawing   = playerId && playerId === currentDrawerId
  const drawerName  = players.find(p => p && p.id === currentDrawerId)?.name || ''
  const drawerAvatar = players.find(p => p && p.id === currentDrawerId)?.avatar || ''

  // ── Actions ───────────────────────────────────────────────────────────────
  const sendDraw   = useCallback((data) => socketManager.sendDraw(data), [])
  const sendClear  = useCallback(() => socketManager.clearCanvas(), [])
  const sendGuess  = useCallback((word) => socketManager.sendGuess(word), [])
  const sendMessage = useCallback((text) => socketManager.sendMessage(text), [])
  const startGame  = useCallback(() => socketManager.startGame(), [])
  const startGameWithRounds = useCallback((maxRounds) => socketManager.startGameWithRounds(maxRounds), [])
  const restartGame = useCallback((maxRounds) => socketManager.restartGame(maxRounds), [])
  const selectWord = useCallback((word) => socketManager.selectWord(word), [])

  return {
    // State
    connected, socketId, playerId, isHost, hostId,
    players, messages,
    gameState, round, maxRounds,
    currentDrawerId, drawerName, drawerAvatar,
    currentWord, wordHint, wordChoices,
    timeLeft, roundResult, gameResult, roundCountdown,
    isDrawing,
    hasGuessedCorrectly,
    // Drawing callbacks (set by DrawingCanvas via ref)
    onRemoteDraw, onRemoteClear,
    // Actions
    sendDraw, sendClear, sendGuess, sendMessage,
    startGame, startGameWithRounds, restartGame, selectWord,
  }
}
