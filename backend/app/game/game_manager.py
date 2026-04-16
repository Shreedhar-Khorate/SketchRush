"""
GameManager — core game state for SketchRush.

Handles:
  - Room lifecycle (create / join / leave / delete)
  - Turn management and drawer rotation
  - Word selection (with category support)
  - Score calculation (time-weighted)
  - Round timers via asyncio
"""

import random
import string
import asyncio
from typing import Dict, List, Optional, Callable, Tuple
from datetime import datetime

from app.models.models import Room, Player, GameState


from typing import Dict, List

WORD_BANK: Dict[str, List[str]] = {
    "animals": [
        "cat", "dog", "elephant", "giraffe", "penguin", "dolphin",
        "parrot", "turtle", "lion", "zebra", "kangaroo", "octopus",
        "snake", "frog", "horse", "bear", "fox", "owl",
    ],

    "humans": [
        "astronaut", "doctor", "teacher", "pirate", "ninja", "superhero",
        "dancer", "chef", "magician", "king", "queen", "wizard",
        "soldier", "police", "farmer", "judge", "student",
    ],

    "space": [
        "rocket", "satellite", "alien", "moon", "planet", "asteroid",
        "comet", "nebula", "galaxy", "black hole", "meteor", "spaceship",
        "space station", "orbit", "astronaut helmet",
    ],

    "objects": [
        "umbrella", "guitar", "bicycle", "camera", "telescope",
        "lighthouse", "hourglass", "compass", "anchor", "lantern",
        "clock", "phone", "keyboard", "chair", "table",
    ],

    "food": [
        "pizza", "sushi", "burger", "ice cream", "watermelon",
        "donut", "taco", "croissant", "cupcake", "ramen",
        "sandwich", "pasta", "fries", "coffee", "tea",
    ],

    "places": [
        "volcano", "igloo", "pyramid", "castle", "treehouse",
        "library", "submarine", "windmill", "cave",
        "school", "hospital", "airport", "beach", "forest",
    ],

    "actions": [
        "skateboarding", "swimming", "cooking", "painting", "dancing",
        "fishing", "surfing", "hiking", "juggling", "knitting",
        "running", "jumping", "sleeping", "driving",
    ],

    "history": [
        "pyramid", "king", "queen", "sword", "shield",
        "battle", "soldier", "castle", "crown",
        "ancient scroll", "war", "map", "flag",
    ],

    "politics": [
        "election", "vote", "ballot box", "parliament",
        "president", "prime minister", "flag",
        "speech", "law", "government building",
    ],

    
    "technology": [
        "computer", "robot", "mobile phone", "internet",
        "keyboard", "mouse", "drone", "AI", "server",
        "coding", "website", "app",
    ],

   
    "emotions": [
        "happy", "sad", "angry", "surprised",
        "scared", "excited", "confused",
        "crying", "laughing", "love",
    ],

    "sports": [
        "cricket", "football", "basketball", "tennis",
        "badminton", "hockey", "swimming",
        "running race", "goal", "stadium",
    ],

    "hard": [
        "serendipity", "silhouette", "ephemeral", "metamorphosis",
        "labyrinth", "archipelago", "cacophony",
        "cryptic", "paradox", "whimsical",
    ],
}
ALL_WORDS = [w for words in WORD_BANK.values() for w in words]


class GameManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        # Maps room_code → asyncio.Task for the active round timer
        self._timers: Dict[str, asyncio.Task] = {}
        # Callback: called when timer fires (next_turn)  set by socket events module
        self.on_round_timeout: Optional[Callable[[str], None]] = None

    # ── Room helpers ──────────────────────────────────────────────────────────

    def generate_room_code(self) -> str:
        """Generate a unique 5-char alphanumeric room code."""
        while True:
            code = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
            if code not in self.rooms:
                return code

    def create_room(self, host_id: str, room_code: Optional[str] = None) -> str:
        """Create a new room; returns the room code."""
        code = room_code or self.generate_room_code()
        # Ensure code is not already taken
        if code in self.rooms:
            code = self.generate_room_code()
        self.rooms[code] = Room(
            code=code,
            host_id=host_id,
            created_at=datetime.now(),
        )
        return code

    def get_room(self, room_code: str) -> Optional[Room]:
        return self.rooms.get(room_code.upper())

    def add_player_to_room(
        self, room_code: str, player_id: str, player_name: str, avatar: str
    ) -> bool:
        room = self.get_room(room_code)
        if not room:
            return False
        if len(room.players) >= room.max_players:
            return False
        if any(p.id == player_id for p in room.players):
            return False  # already in room

        player = Player(id=player_id, name=player_name, avatar=avatar)
        room.players.append(player)
        return True

    def remove_player_from_room(self, room_code: str, player_id: str) -> bool:
        room = self.get_room(room_code)
        if not room:
            return False

        # Reset is_drawing flag if drawer left
        for p in room.players:
            if p.id == player_id and p.is_drawing:
                p.is_drawing = False

        room.players = [p for p in room.players if p.id != player_id]

        # Clean up empty room
        if not room.players:
            self._cancel_timer(room_code)
            del self.rooms[room_code]
        return True

    def get_player(self, room_code: str, player_id: str) -> Optional[Player]:
        room = self.get_room(room_code)
        if not room:
            return None
        return next((p for p in room.players if p.id == player_id), None)

    # ── Game lifecycle ────────────────────────────────────────────────────────

    def start_game(self, room_code: str) -> bool:
        room = self.get_room(room_code)
        if not room or len(room.players) < 2:
            return False
        if room.game_state not in (GameState.WAITING, GameState.GAME_END):
            return False

        room.game_state = GameState.DRAWING
        room.round_number = 1
        room.current_drawer_index = 0
        room.current_word = None

        # Reset scores
        for p in room.players:
            p.score = 0
            p.is_drawing = False

        return True

    def select_word(self, room_code: str) -> Optional[str]:
        """Pick a random word, set it on the room, return it."""
        room = self.get_room(room_code)
        if not room:
            return None
        word = random.choice(ALL_WORDS)
        room.current_word = word
        room.game_state = GameState.DRAWING
        return word

    def get_word_choices(self, room_code: str) -> List[str]:
        """Get 4 word choices: human, space, animal, hard (all random)."""
        room = self.get_room(room_code)
        if not room:
            return []
        
        # Select one from each category
        choices = [
            random.choice(WORD_BANK.get("humans", ["human"])),
            random.choice(WORD_BANK.get("space", ["rocket"])),
            random.choice(WORD_BANK.get("animals", ["cat"])),
            random.choice(WORD_BANK.get("hard", ["challenge"])),
        ]
        
        # Shuffle the order so the hard word isn't always last
        random.shuffle(choices)
        
        room.word_choices = choices
        room.game_state = GameState.CHOOSING_WORD
        return choices

    def select_word_from_choices(self, room_code: str, selected_word: str) -> bool:
        """Set the selected word from the choices. Returns True if valid."""
        room = self.get_room(room_code)
        if not room or selected_word not in (room.word_choices or []):
            return False
        room.current_word = selected_word
        room.game_state = GameState.DRAWING
        return True

    def get_current_drawer(self, room_code: str) -> Optional[Player]:
        room = self.get_room(room_code)
        if not room or not room.players:
            return None
        idx = room.current_drawer_index % len(room.players)
        return room.players[idx]

    def mark_drawer(self, room_code: str):
        """Set is_drawing flag on the current drawer, clear others."""
        room = self.get_room(room_code)
        if not room:
            return
        drawer = self.get_current_drawer(room_code)
        for p in room.players:
            p.is_drawing = p.id == drawer.id if drawer else False

    def next_turn(self, room_code: str) -> Tuple[bool, bool]:
        """Advance to the next drawer / round. Returns (can_continue, round_completed)."""
        room = self.get_room(room_code)
        if not room:
            return False, False

        self._cancel_timer(room_code)

        # Clear drawing state
        room.current_word = None
        for p in room.players:
            p.is_drawing = False

        room.current_drawer_index += 1
        round_completed = (room.current_drawer_index % len(room.players) == 0)

        # Check if all players have drawn this round
        if round_completed:
            room.round_number += 1
            if room.round_number > room.max_rounds:
                room.game_state = GameState.GAME_END
                return False, True

        room.game_state = GameState.DRAWING
        return True, round_completed

    def get_leaderboard(self, room_code: str) -> List[Player]:
        room = self.get_room(room_code)
        if not room:
            return []
        return sorted(room.players, key=lambda p: p.score, reverse=True)

    # ── Scoring ───────────────────────────────────────────────────────────────

    def award_guess_points(
        self,
        room_code: str,
        guesser_id: str,
        time_remaining: int,
        total_time: int = 60,
    ) -> int:
        """Award time-weighted points to the guesser, smaller bonus to drawer."""
        room = self.get_room(room_code)
        if not room:
            return 0

        # Base 100 pts + up to 200 for speed
        points = 100 + int(200 * (time_remaining / total_time))

        guesser = self.get_player(room_code, guesser_id)
        if guesser:
            guesser.score += points

        drawer = self.get_current_drawer(room_code)
        if drawer and drawer.id != guesser_id:
            drawer.score += 30  # Drawer gets bonus for each correct guess

        return points

    def check_guess(self, room_code: str, guess: str) -> bool:
        room = self.get_room(room_code)
        if not room or not room.current_word:
            return False
        return guess.lower().strip() == room.current_word.lower().strip()

    # ── Async timer ──────────────────────────────────────────────────────────

    def start_round_timer(self, room_code: str, duration: int = 60):
        """Start an asyncio countdown timer; fires on_round_timeout when done."""
        self._cancel_timer(room_code)

        async def _timer():
            await asyncio.sleep(duration)
            if self.on_round_timeout:
                await self.on_round_timeout(room_code)

        try:
            loop = asyncio.get_event_loop()
            task = loop.create_task(_timer())
            self._timers[room_code] = task
        except RuntimeError:
            # No running loop (e.g., during tests)
            pass

    def _cancel_timer(self, room_code: str):
        task = self._timers.pop(room_code, None)
        if task and not task.done():
            task.cancel()

    def get_timer_remaining(self, room_code: str) -> int:
        """Rough estimate — actual countdown lives in the frontend."""
        room = self.get_room(room_code)
        return room.timer if room else 60

    # ── Word hint ─────────────────────────────────────────────────────────────

    @staticmethod
    def build_hint(word: str, reveal_count: int = 0) -> str:
        """Return the word with some letters revealed: 'c _ t'"""
        if not word:
            return ""
        chars = list(word)
        revealed_indices = set(
            random.sample(range(len(word)), min(reveal_count, len(word)))
        ) if reveal_count else set()
        return " ".join(c if (c == " " or i in revealed_indices) else "_" for i, c in enumerate(chars))
