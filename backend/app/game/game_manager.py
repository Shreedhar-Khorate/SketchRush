import random
import string
from typing import Dict, List, Optional
from datetime import datetime
from app.models.models import Room, Player, GameState


class GameManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        self.word_list = [
            "apple", "banana", "cat", "dog", "elephant", "flower",
            "guitar", "house", "ice cream", "jellyfish", "kite", "lion",
            "mountain", "nose", "orange", "penguin", "question", "rocket",
            "sun", "tree", "umbrella", "violin", "whale", "xylophone",
            "yacht", "zebra", "airplane", "bicycle", "camera", "dinosaur"
        ]

    def generate_room_code(self) -> str:
        """Generate a 5-character uppercase room code"""
        while True:
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
            if code not in self.rooms:
                return code

    def create_room(self, host_id: str) -> str:
        """Create a new room and return the room code"""
        code = self.generate_room_code()
        room = Room(
            code=code,
            host_id=host_id,
            created_at=datetime.now()
        )
        self.rooms[code] = room
        return code

    def get_room(self, room_code: str) -> Optional[Room]:
        """Get a room by code"""
        return self.rooms.get(room_code)

    def add_player_to_room(self, room_code: str, player_id: str, player_name: str, avatar: str) -> bool:
        """Add a player to a room"""
        room = self.get_room(room_code)
        if not room:
            return False

        if len(room.players) >= room.max_players:
            return False

        # Check if player already exists
        if any(p.id == player_id for p in room.players):
            return False

        player = Player(
            id=player_id,
            name=player_name,
            avatar=avatar
        )
        room.players.append(player)
        return True

    def remove_player_from_room(self, room_code: str, player_id: str) -> bool:
        """Remove a player from a room"""
        room = self.get_room(room_code)
        if not room:
            return False

        room.players = [p for p in room.players if p.id != player_id]

        # Delete room if empty
        if len(room.players) == 0:
            del self.rooms[room_code]
            return True

        return True

    def start_game(self, room_code: str) -> bool:
        """Start a game in a room"""
        room = self.get_room(room_code)
        if not room or len(room.players) < 2:
            return False

        room.game_state = GameState.CHOOSING_WORD
        room.round_number = 1
        room.current_drawer_index = 0
        return True

    def get_current_drawer(self, room_code: str) -> Optional[Player]:
        """Get the current player drawing"""
        room = self.get_room(room_code)
        if not room or not room.players:
            return None

        index = room.current_drawer_index % len(room.players)
        return room.players[index]

    def select_word(self, room_code: str) -> Optional[str]:
        """Randomly select a word for the current drawer"""
        room = self.get_room(room_code)
        if not room:
            return None

        word = random.choice(self.word_list)
        room.current_word = word
        room.game_state = GameState.DRAWING
        return word

    def check_guess(self, room_code: str, guess: str) -> bool:
        """Check if a guess is correct"""
        room = self.get_room(room_code)
        if not room or not room.current_word:
            return False

        return guess.lower().strip() == room.current_word.lower().strip()

    def next_round(self, room_code: str) -> bool:
        """Move to the next round"""
        room = self.get_room(room_code)
        if not room:
            return False

        room.current_drawer_index += 1

        # Check if game is over
        if room.round_number >= room.max_rounds:
            room.game_state = GameState.GAME_END
            return False

        room.round_number += 1
        room.game_state = GameState.CHOOSING_WORD
        return True

    def get_leaderboard(self, room_code: str) -> List[Player]:
        """Get sorted leaderboard"""
        room = self.get_room(room_code)
        if not room:
            return []

        return sorted(room.players, key=lambda p: p.score, reverse=True)

    def delete_room(self, room_code: str) -> bool:
        """Delete a room"""
        if room_code in self.rooms:
            del self.rooms[room_code]
            return True
        return False
