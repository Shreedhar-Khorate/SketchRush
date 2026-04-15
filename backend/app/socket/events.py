from fastapi import FastAPI
from socketio import AsyncServer, ASGIApp
import json
import uuid
from app.game.game_manager import GameManager

# Initialize socketio
sio = AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    ping_timeout=60,
    ping_interval=25
)

# Game manager
game_manager = GameManager()

# Track socket to player mapping
socket_to_player: dict = {}
socket_to_room: dict = {}


def create_socket_app():
    """Create and configure Socket.IO app"""

    @sio.event
    async def connect(sid, environ):
        print(f"Client {sid} connected")
        # Generate unique player ID
        player_id = str(uuid.uuid4())
        socket_to_player[sid] = player_id

    @sio.event
    async def disconnect(sid):
        print(f"Client {sid} disconnected")
        
        # Get room and remove player
        room_code = socket_to_room.get(sid)
        if room_code:
            player_id = socket_to_player.get(sid)
            game_manager.remove_player_from_room(room_code, player_id)
            
            # Notify other players
            await sio.emit('player_left', {
                'player_id': player_id,
                'room_code': room_code
            }, room=room_code)
            
            del socket_to_room[sid]
        
        if sid in socket_to_player:
            del socket_to_player[sid]

    @sio.event
    async def join_room(sid, data):
        """Handle player joining a room"""
        try:
            room_code = data['room'].upper()
            player_name = data['playerName']
            avatar = data['avatar']
            player_id = socket_to_player[sid]

            # Create room if doesn't exist
            if not game_manager.get_room(room_code):
                game_manager.create_room(player_id)
                # Update room to use provided code (for quick play)
                if room_code not in game_manager.rooms:
                    game_manager.rooms[room_code] = game_manager.rooms.pop(
                        [k for k in game_manager.rooms.keys()][-1]
                    )

            # Add player to room
            if game_manager.add_player_to_room(room_code, player_id, player_name, avatar):
                socket_to_room[sid] = room_code
                await sio.enter_room(sid, room_code)

                room = game_manager.get_room(room_code)
                await sio.emit('player_joined', {
                    'player_id': player_id,
                    'player_name': player_name,
                    'avatar': avatar,
                    'room_code': room_code,
                    'players_count': len(room.players)
                }, room=room_code)

                print(f"Player {player_name} joined room {room_code}")
            else:
                await sio.emit('error', {
                    'message': 'Failed to join room'
                }, to=sid)

        except Exception as e:
            print(f"Error joining room: {e}")
            await sio.emit('error', {
                'message': str(e)
            }, to=sid)

    @sio.event
    async def leave_room(sid, data):
        """Handle player leaving a room"""
        room_code = socket_to_room.get(sid)
        if room_code:
            player_id = socket_to_player.get(sid)
            game_manager.remove_player_from_room(room_code, player_id)
            
            await sio.emit('player_left', {
                'player_id': player_id,
                'room_code': room_code
            }, room=room_code)
            
            del socket_to_room[sid]

    @sio.event
    async def start_game(sid, data):
        """Start a game"""
        room_code = socket_to_room.get(sid)
        if not room_code:
            return

        if game_manager.start_game(room_code):
            # Select first word
            word = game_manager.select_word(room_code)
            drawer = game_manager.get_current_drawer(room_code)

            await sio.emit('game_started', {
                'room_code': room_code,
                'drawer_id': drawer.id,
                'drawer_name': drawer.name
            }, room=room_code)

            # Send word only to drawer
            await sio.emit('word_selected', {
                'word': word
            }, to=sid)

    @sio.event
    async def draw(sid, data):
        """Handle drawing event"""
        room_code = socket_to_room.get(sid)
        if not room_code:
            return

        # Broadcast drawing to other players
        await sio.emit('draw', data, room=room_code, skip_sid=sid)

    @sio.event
    async def clear_canvas(sid, data):
        """Clear canvas for all players"""
        room_code = socket_to_room.get(sid)
        if not room_code:
            return

        await sio.emit('canvas_cleared', {}, room=room_code)

    @sio.event
    async def guess(sid, data):
        """Handle a player's guess"""
        room_code = socket_to_room.get(sid)
        if not room_code:
            return

        word = data.get('word', '').strip()
        if not word:
            return

        player_id = socket_to_player.get(sid)
        room = game_manager.get_room(room_code)
        
        # Check if guess is correct
        is_correct = game_manager.check_guess(room_code, word)

        if is_correct:
            # Find player and add points
            player = next((p for p in room.players if p.id == player_id), None)
            if player:
                player.score += 10

            await sio.emit('correct_guess', {
                'player_id': player_id,
                'player_name': player.name,
                'word': room.current_word
            }, room=room_code)
        else:
            await sio.emit('wrong_guess', {
                'player_id': player_id,
                'player_name': next((p.name for p in room.players if p.id == player_id), 'Unknown')
            }, room=room_code)

    @sio.event
    async def message(sid, data):
        """Handle chat message"""
        room_code = socket_to_room.get(sid)
        if not room_code:
            return

        player_id = socket_to_player.get(sid)
        player = next((p for p in game_manager.get_room(room_code).players if p.id == player_id), None)
        
        if player:
            await sio.emit('message', {
                'player_id': player_id,
                'player_name': player.name,
                'message': data.get('text', '')
            }, room=room_code)

    return ASGIApp(sio)


def get_sio():
    """Get socketio instance"""
    return sio
