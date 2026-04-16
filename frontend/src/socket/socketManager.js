/**
 * SketchRush Socket Manager (v2)
 *
 * Wraps Socket.IO client with typed emit/on helpers for every
 * game event:  room, drawing, chat/guess, gesture control.
 */
import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

class SocketManager {
  constructor() {
    this.socket = null
    this._connected = false
  }

  // ── Connection ─────────────────────────────────────────────────────────────

  connect() {
    if (this.socket?.connected) return this.socket

    this.socket = io(BACKEND_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    })

    this.socket.on('connect', () => {
      this._connected = true
      console.log('[Socket] Connected:', this.socket.id)
    })
    this.socket.on('disconnect', (reason) => {
      this._connected = false
      console.warn('[Socket] Disconnected:', reason)
    })
    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message)
    })

    return this.socket
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
    this._connected = false
  }

  get isConnected() {
    return this._connected
  }

  // ── Low-level emit / on ───────────────────────────────────────────────────

  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn(`[Socket] Tried to emit '${event}' but not connected`)
      return
    }
    this.socket.emit(event, data)
  }

  on(event, cb) {
    this.socket?.on(event, cb)
    return () => this.socket?.off(event, cb)  // returns unsubscribe fn
  }

  off(event, cb) {
    this.socket?.off(event, cb)
  }

  // ── Room events ───────────────────────────────────────────────────────────

  joinRoom(roomCode, playerName, avatar) {
    this.emit('join_room', { room: roomCode, playerName, avatar })
  }

  leaveRoom() {
    this.emit('leave_room', {})
  }

  // ── Game events ───────────────────────────────────────────────────────────

  startGame() {
    this.emit('start_game', {})
  }

  startGameWithRounds(maxRounds) {
    this.emit('start_game', { max_rounds: maxRounds })
  }

  restartGame(maxRounds) {
    this.emit('restart_game', { max_rounds: maxRounds })
  }

  selectWord(word) {
    this.emit('select_word', { word })
  }

  requestNextTurn() {
    this.emit('request_next_turn', {})
  }

  // ── Drawing events ────────────────────────────────────────────────────────

  /** Send a stroke segment to the server */
  sendDraw({ x, y, prevX, prevY, color, size, isEraser, mode = 'mouse' }) {
    this.emit('draw', { x, y, prevX, prevY, color, size, isEraser, mode })
  }

  clearCanvas() {
    this.emit('clear_canvas', {})
  }

  // ── Chat / Guess ──────────────────────────────────────────────────────────

  sendGuess(word) {
    this.emit('guess', { word })
  }

  sendMessage(text) {
    this.emit('message', { text })
  }

  // ── Gesture (Air Canvas) ──────────────────────────────────────────────────

  startGesture() {
    this.emit('start_gesture', {})
  }

  stopGesture() {
    this.emit('stop_gesture', {})
  }

  setGestureColor(color) {
    this.emit('gesture_color', { color })
  }

  setGestureBrushSize(size) {
    this.emit('gesture_brush_size', { size })
  }

  setGestureEraser(enabled) {
    this.emit('gesture_eraser', { enabled })
  }
}

// Singleton
export const socketManager = new SocketManager()
