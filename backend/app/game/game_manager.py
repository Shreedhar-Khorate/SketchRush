"""
GameManager — core game state for SketchRush.

Handles:
  - Room lifecycle (create / join / leave / delete)
  - Turn management and drawer rotation
  - Word selection (with category support, no repeat within a game)
  - Score calculation (time-weighted)
  - Round timers via asyncio
"""

import random
import string
import asyncio
from typing import Dict, List, Optional, Callable, Tuple, Set
from datetime import datetime

from app.models.models import Room, Player, GameState


# ── Word Bank ─────────────────────────────────────────────────────────────────
# 16 categories, 500+ total words.
# Each turn: 4 words are drawn from 4 *different* random categories so players
# always see a nice variety, and used words are tracked per room to avoid repeats.

WORD_BANK: Dict[str, List[str]] = {

    "animals": [
        "cat", "dog", "elephant", "giraffe", "penguin", "dolphin",
        "parrot", "turtle", "lion", "zebra", "kangaroo", "octopus",
        "snake", "frog", "horse", "bear", "fox", "owl", "wolf",
        "rabbit", "cheetah", "gorilla", "flamingo", "crocodile", "panda",
        "koala", "jaguar", "peacock", "hamster", "chameleon", "bison",
        "platypus", "hedgehog", "meerkat", "armadillo", "narwhal", "toucan",
        "capybara", "axolotl", "sloth", "manatee", "lemur", "wombat",
        "quokka", "ocelot", "tapir", "cassowary", "ibis", "macaw",
    ],

    "humans": [
        "astronaut", "doctor", "teacher", "pirate", "ninja", "superhero",
        "dancer", "chef", "magician", "king", "queen", "wizard",
        "soldier", "police", "farmer", "judge", "student", "knight",
        "archaeologist", "firefighter", "clown", "monk", "samurai", "viking",
        "detective", "scientist", "architect", "photographer", "sculptor",
        "acrobat", "gladiator", "jester", "merchant", "nomad", "bard",
        "alchemist", "assassin", "blacksmith", "cartographer", "diver",
        "explorer", "gladiator", "hacker", "illusionist", "journalist",
    ],

    "space": [
        "rocket", "satellite", "alien", "moon", "planet", "asteroid",
        "comet", "nebula", "galaxy", "black hole", "meteor", "spaceship",
        "space station", "orbit", "astronaut helmet", "supernova",
        "dark matter", "wormhole", "pulsar", "quasar", "cosmic dust",
        "solar flare", "eclipse", "crater", "gravity", "telescope",
        "launch pad", "space suit", "rover", "probe", "hubble",
        "martian", "exoplanet", "neutron star", "constellation",
        "aurora borealis", "solar system", "big bang", "spacewalk",
        "space debris", "lunar module", "milky way", "cosmic ray",
        "interstellar", "vacuum", "zero gravity", "tidal wave",
    ],

    "objects": [
        "umbrella", "guitar", "bicycle", "camera", "telescope",
        "lighthouse", "hourglass", "compass", "anchor", "lantern",
        "clock", "phone", "keyboard", "chair", "table",
        "magnifying glass", "binoculars", "fire extinguisher", "microscope",
        "thermometer", "suitcase", "parachute", "sword", "shield",
        "crown", "torch", "map", "scroll", "bell", "candle",
        "boomerang", "broom", "cauldron", "crystal ball", "dice",
        "drum", "fan", "flute", "harp", "hook", "jar", "key",
        "ladder", "lasso", "locket", "net", "oar", "pendulum",
        "quill", "safe", "scalpel", "sled", "trowel", "vase",
        "whip", "yoyo", "zipper",
    ],

    "food": [
        "pizza", "sushi", "burger", "ice cream", "watermelon",
        "donut", "taco", "croissant", "cupcake", "ramen",
        "sandwich", "pasta", "fries", "coffee", "tea",
        "waffle", "pancake", "burrito", "hot dog", "pretzel",
        "cheesecake", "brownie", "macaron", "spring roll",
        "dumplings", "kebab", "curry", "lasagna", "risotto",
        "smoothie", "milkshake", "churro", "eclair", "falafel",
        "gyoza", "hummus", "lemonade", "mochi", "nachos",
        "onion ring", "paella", "quesadilla", "samosa", "tiramisu",
        "udon", "vinegar", "wrap", "yakitori", "zaatar", "pho",
    ],

    "places": [
        "volcano", "igloo", "pyramid", "castle", "treehouse",
        "library", "submarine", "windmill", "cave",
        "school", "hospital", "airport", "beach", "forest",
        "skyscraper", "colosseum", "eiffel tower", "great wall",
        "lighthouse", "mosque", "cathedral", "temple", "bunker",
        "greenhouse", "observatory", "aquarium", "stadium", "maze",
        "haunted house", "campsite", "lighthouse", "harbor",
        "waterfall", "cliff", "island", "desert", "swamp",
        "glacier", "canyon", "savanna", "tundra", "rainforest",
        "hot spring", "coral reef", "abandoned mine", "monastery",
        "war bunker", "space colony", "underwater city",
    ],

    "actions": [
        "skateboarding", "swimming", "cooking", "painting", "dancing",
        "fishing", "surfing", "hiking", "juggling", "knitting",
        "running", "jumping", "sleeping", "driving", "climbing",
        "skiing", "archery", "boxing", "cycling", "diving",
        "fencing", "gardening", "hang gliding", "ice skating",
        "kayaking", "meditating", "mountain biking", "parachuting",
        "pottery", "rafting", "rock climbing", "rowing", "sailing",
        "scuba diving", "skydiving", "snowboarding", "stargazing",
        "stretching", "tightrope walking", "trampolining",
        "weightlifting", "windsurfing", "wrestling", "yoga",
        "zip lining",
    ],

    "technology": [
        "computer", "robot", "mobile phone", "internet",
        "keyboard", "mouse", "drone", "AI", "server",
        "coding", "website", "app", "virtual reality", "augmented reality",
        "3d printer", "smartwatch", "tablet", "headphones",
        "bluetooth", "wifi", "satellite dish", "solar panel",
        "electric car", "self-driving car", "hologram",
        "quantum computer", "microchip", "circuit board",
        "hard drive", "cloud storage", "firewall", "algorithm",
        "machine learning", "neural network", "cryptocurrency",
        "blockchain", "cybersecurity", "data center",
        "fiber optics", "GPS", "infrared", "laser", "nanotechnology",
        "radar", "sonar", "touchscreen", "USB drive",
    ],

    "nature": [
        "rainbow", "tornado", "tsunami", "earthquake", "thunder",
        "lightning", "snowflake", "volcano", "aurora", "fog",
        "hurricane", "monsoon", "blizzard", "drought", "wildfire",
        "tide", "erosion", "fossil", "geode", "geyser",
        "glacier", "marsh", "peat bog", "quicksand", "sinkhole",
        "stalactite", "stalagmite", "tundra", "wetland", "oasis",
        "sand dune", "coral reef", "hot spring", "mangrove",
        "permafrost", "river delta", "sea cave", "volcanic island",
        "lava flow", "meteor shower", "northern lights", "thunder cloud",
    ],

    "sports": [
        "cricket", "football", "basketball", "tennis",
        "badminton", "hockey", "swimming", "volleyball",
        "running race", "goal", "stadium", "baseball",
        "golf", "rugby", "table tennis", "wrestling",
        "cycling", "gymnastics", "fencing", "archery",
        "judo", "karate", "boxing", "rowing", "canoeing",
        "triathlon", "decathlon", "marathon", "pole vault",
        "high jump", "long jump", "shot put", "discus",
        "hammer throw", "javelin", "pentathlon", "equestrian",
        "synchronized swimming", "water polo", "lacrosse",
        "handball", "curling", "bobsled", "biathlon",
    ],

    "emotions": [
        "happy", "sad", "angry", "surprised",
        "scared", "excited", "confused", "crying",
        "laughing", "love", "bored", "jealous",
        "disgusted", "proud", "anxious", "relieved",
        "embarrassed", "hopeful", "lonely", "nostalgic",
        "overwhelmed", "peaceful", "regret", "shy",
        "suspicious", "thankful", "tired", "worried",
    ],

    "history": [
        "pyramid", "king", "queen", "sword", "shield",
        "battle", "soldier", "castle", "crown",
        "ancient scroll", "war", "map", "flag",
        "catapult", "trebuchet", "roman chariot", "gladiator",
        "pharaoh", "colosseum", "knights templar", "crusade",
        "black plague", "silk road", "aztec temple",
        "viking longship", "samurai armor", "feudal lord",
        "trojan horse", "sparta", "athens", "greek temple",
        "roman aqueduct", "medieval village", "torture chamber",
        "dungeon", "gallows", "jousting", "moat",
    ],

    "mythology": [
        "dragon", "phoenix", "unicorn", "mermaid", "griffin",
        "centaur", "minotaur", "medusa", "cerberus", "hydra",
        "kraken", "sphinx", "cyclops", "vampire", "werewolf",
        "fairy", "goblin", "troll", "elf", "dwarf",
        "giant", "witch", "warlock", "demon", "angel",
        "titan", "zeus", "poseidon", "hades", "thor",
        "loki", "odin", "fenrir", "pegasus", "chimera",
        "banshee", "basilisk", "leviathan", "manticore",
        "siren", "satyr", "valkyrie", "yeti", "bigfoot",
    ],

    "vehicles": [
        "airplane", "helicopter", "submarine", "speedboat",
        "motorcycle", "tank", "hot air balloon", "jet ski",
        "tram", "train", "skateboard", "scooter",
        "aircraft carrier", "fire truck", "ambulance", "bulldozer",
        "crane", "forklift", "garbage truck", "hovercraft",
        "ice cream truck", "jeep", "kayak", "limousine",
        "monster truck", "oil tanker", "police car", "quad bike",
        "rocket ship", "sailboat", "school bus", "taxi",
        "tractor", "tugboat", "van", "warship", "yacht",
        "zeppelin",
    ],

    "clothing": [
        "crown", "helmet", "top hat", "sombrero", "beret",
        "kimono", "tuxedo", "space suit", "scuba gear",
        "wedding dress", "raincoat", "trenchcoat", "cowboy hat",
        "cape", "mask", "glove", "boot", "sandal",
        "swimsuit", "tutu", "uniform", "vest", "kilt",
        "turban", "hijab", "bandana", "bowtie", "earmuffs",
        "monocle", "scarf", "apron", "overalls", "poncho",
        "cloak", "gauntlet", "armor", "toga", "robe",
    ],

    "hard": [
        "serendipity", "silhouette", "ephemeral", "metamorphosis",
        "labyrinth", "archipelago", "cacophony",
        "cryptic", "paradox", "whimsical",
        "schadenfreude", "melancholy", "bioluminescence",
        "kaleidoscope", "pandemonium", "quagmire",
        "hallucination", "juxtaposition", "nostalgia",
        "onomatopoeia", "perpendicular", "renaissance",
        "soliloquy", "transcendence", "ubiquitous",
        "vertigo", "wanderlust", "xenophobia", "zeitgeist",
        "absurdity", "bureaucracy", "claustrophobia",
        "déjà vu", "euphoria", "flabbergasted",
        "gobsmacked", "hypnosis", "inertia",
    ],
}

# Flat list of all words (used as fallback)
ALL_WORDS: List[str] = [w for words in WORD_BANK.values() for w in words]

# All category names (used for rotation)
ALL_CATEGORIES: List[str] = list(WORD_BANK.keys())


class GameManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}
        # Maps room_code → asyncio.Task for the active round timer
        self._timers: Dict[str, asyncio.Task] = {}
        # Maps room_code → set of words already used this game session
        self._used_words: Dict[str, Set[str]] = {}
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
        if code in self.rooms:
            code = self.generate_room_code()
        self.rooms[code] = Room(
            code=code,
            host_id=host_id,
            created_at=datetime.now(),
        )
        # Initialise the used-words set for this room
        self._used_words[code] = set()
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

        for p in room.players:
            if p.id == player_id and p.is_drawing:
                p.is_drawing = False

        room.players = [p for p in room.players if p.id != player_id]

        if not room.players:
            self._cancel_timer(room_code)
            self._used_words.pop(room_code, None)
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

        # Reset scores and clear used-word history for the new game
        for p in room.players:
            p.score = 0
            p.is_drawing = False
        self._used_words[room_code] = set()

        return True

    # ── Word selection helpers ─────────────────────────────────────────────────

    def _pick_unused_word(self, room_code: str, category: str) -> str:
        """
        Return a word from *category* that hasn't been used yet this game.
        Falls back to ANY unused word, then to a fully random word if the pool
        is exhausted (extremely unlikely with 500+ words).
        """
        used = self._used_words.get(room_code, set())
        pool = WORD_BANK.get(category, [])

        # Shuffle the pool each time so selection order is unpredictable
        shuffled = pool.copy()
        random.shuffle(shuffled)

        for word in shuffled:
            if word not in used:
                return word

        # Category exhausted — try any word from the full bank
        all_shuffled = ALL_WORDS.copy()
        random.shuffle(all_shuffled)
        for word in all_shuffled:
            if word not in used:
                return word

        # Absolute fallback (full bank exhausted)
        return random.choice(ALL_WORDS)

    def get_word_choices(self, room_code: str) -> List[str]:
        """
        Return 4 word choices drawn from 4 *different* randomly selected
        categories.  Each word is guaranteed to be unused this game session,
        and the final list is shuffled so the 'hard' word never predictably
        appears in the same slot.
        """
        room = self.get_room(room_code)
        if not room:
            return []

        # Pick 4 distinct random categories each turn
        categories = random.sample(ALL_CATEGORIES, min(4, len(ALL_CATEGORIES)))

        choices: List[str] = []
        for cat in categories:
            word = self._pick_unused_word(room_code, cat)
            choices.append(word)

        # Shuffle so category order is also unpredictable
        random.shuffle(choices)

        room.word_choices = choices
        room.game_state = GameState.CHOOSING_WORD
        return choices

    def select_word(self, room_code: str) -> Optional[str]:
        """Pick a random unused word, set it on the room, return it."""
        room = self.get_room(room_code)
        if not room:
            return None
        word = self._pick_unused_word(room_code, random.choice(ALL_CATEGORIES))
        self._mark_word_used(room_code, word)
        room.current_word = word
        room.game_state = GameState.DRAWING
        return word

    def select_word_from_choices(self, room_code: str, selected_word: str) -> bool:
        """Set the selected word from the choices. Returns True if valid."""
        room = self.get_room(room_code)
        if not room or selected_word not in (room.word_choices or []):
            return False
        self._mark_word_used(room_code, selected_word)
        room.current_word = selected_word
        room.game_state = GameState.DRAWING
        return True

    def _mark_word_used(self, room_code: str, word: str):
        """Record a word as used for this game session."""
        if room_code not in self._used_words:
            self._used_words[room_code] = set()
        self._used_words[room_code].add(word.lower().strip())

    # ── Turn management ───────────────────────────────────────────────────────

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

        if not room.players:
            room.game_state = GameState.WAITING
            return False, False

        self._cancel_timer(room_code)

        room.current_word = None
        for p in room.players:
            p.is_drawing = False

        room.current_drawer_index += 1
        round_completed = (room.current_drawer_index % len(room.players) == 0)

        if round_completed:
            room.round_number += 1
            if room.round_number > room.max_rounds:
                room.game_state = GameState.GAME_END
                return False, True

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

        points = 100 + int(200 * (time_remaining / total_time))

        guesser = self.get_player(room_code, guesser_id)
        if guesser:
            guesser.score += points

        drawer = self.get_current_drawer(room_code)
        if drawer and drawer.id != guesser_id:
            drawer.score += 30

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
