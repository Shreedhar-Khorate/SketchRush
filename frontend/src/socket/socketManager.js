import io from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000'

class SocketManager {
  constructor() {
    this.socket = null
    this.listeners = {}
  }

  connect() {
    if (this.socket?.connected) return

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    this.socket.on('connect', () => {
      console.log('Connected to server')
      this.emit('socket:connected')
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
      this.emit('socket:disconnected')
    })

    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
      this.emit('socket:error', error)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  /* Room Events */
  joinRoom(roomCode, playerName, avatar) {
    this.socket?.emit('join_room', {
      room: roomCode,
      playerName,
      avatar,
    })
  }

  leaveRoom() {
    this.socket?.emit('leave_room')
  }

  /* Drawing Events */
  draw(x, y, color, size) {
    this.socket?.emit('draw', {
      x,
      y,
      color,
      size,
    })
  }

  clearCanvas() {
    this.socket?.emit('clear_canvas')
  }

  /* Game Events */
  startGame() {
    this.socket?.emit('start_game')
  }

  guess(word) {
    this.socket?.emit('guess', { word })
  }

  sendMessage(message) {
    this.socket?.emit('message', { text: message })
  }

  /* Listener Management */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = []
    }
    this.listeners[event].push(callback)

    // Also listen on socket
    if (this.socket) {
      this.socket.on(event, callback)
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback)
    }

    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  emit(event, ...args) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => callback(...args))
    }
  }
}

export const socketManager = new SocketManager()
