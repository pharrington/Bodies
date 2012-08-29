(function (window, undefined) {

function clamp(value, min, max) {
	return Math.min(Math.max(min, value), max);
}

var LevelSystem = {
	Base: {
		game: null,
		startLevel: 1,
		properties: ["groundedTimeout", "lineClearDelay", "spawnDelay", "velocity"],

		endPiece: $.noop,
		endSpawnNext: $.noop,
		clearLines: $.noop,
		levelUpCallback: $.noop,

		start: function (game) {
			this.level = this.startLevel;
			this.game = game;
			this.applyLevel();
		},


		applyLevel: function () {
			var level,
			    table,
			    game = this.game;

			this.properties.forEach(function (p) {
				level = this.level;
				table = this[p];

				while (!(level in table)) {
					level--;
				}

				this.set(p, table[level]);
			}, this);

			this.levelUpCallback();
		},

		set: function (property, value) {
			var game = this.game;

			game[property] = value;
			if (property === "keyHoldDelay" || property === "keyHoldInterval") {
				$.keyHold(game.keyHold, game.keyHoldDelay, game.keyHoldInterval);
			}
		}

	}
};

LevelSystem.Master = $.inherit(LevelSystem.Base, {
	properties: LevelSystem.Base.properties.concat("lineClearSpawnDelay", "keyHoldDelay"),
	startLevel: 0,

	keyHoldDelay: {
		0: 14 * 16,
		500: 8 * 16,
		900: 6 * 16
	},

	groundedTimeout: {
		0: 30,
		901: 17
	},

	lineClearDelay: {
		0: 40,
		500: 25,
		601: 16,
		701: 12,
		801: 6
	},

	lineClearSpawnDelay: {
		0: 25,
		600: 16,
		700: 12,
		800: 6
	},

	spawnDelay: {
		0: 25,
		701: 16,
		801: 12
	},

	velocity: {
		0:  4 / 256,
		30: 6 / 256,
		35: 8 / 256,
		40: 10 / 256,
		50: 12 / 256,
		60: 16 / 256,
		70: 32 / 256,
		80: 48 / 256,
		90: 64 / 256,
		100: 80 / 256,
		120: 96 / 256,
		140: 112 / 256,
		160: 128 / 256,
		170: 144 / 256,
		200: 4 / 256,
		220: 32 / 256,
		230: 64 / 256,
		233: 96 / 256,
		236: 128 / 256,
		239: 160 / 256,
		243: 192 / 256,
		247: 224 / 256,
		251: 1,
		300: 2,
		330: 3,
		360: 4,
		400: 5,
		420: 4,
		450: 3,
		500: 20
	},

	setLevel: function (level) {
		this.level = Math.min(level, 999);
	},

	clearLines: function (numCleared) {
		this.setLevel(this.level + numCleared);
		this.applyLevel();
	},

	endSpawnNext: function () {
		if (((this.level + 1) % 100) && (this.level !== 998)) {
			this.setLevel(this.level + 1);
		}
		this.applyLevel();
	},

	levelUpCallback: function () {
		if (this.level >= 100) {
			this.game.enableGhostPiece = false;
		}
	}
});

LevelSystem.Normal = $.inherit(LevelSystem.Base, {
	properties: LevelSystem.Base.properties.concat("keyHoldDelay"),

	clearedLines: 0,

	keyHoldDelay: {
		1: 170,
		19: 128,
		20: 96
	},

	spawnDelay: {
		1: 15,
		15: 10
	},

	groundedTimeout: {
		1: 30,
		18: 23,
		20: 18
	},

	lineClearDelay: {
		1: 40,
		15: 25
	},

	levelGoals: {
		1: 10,
		2: 10,
		3: 10,
		4: 12,
		5: 14,
		6: 16,
		7: 18,
		8: 20,
		9: 22,
		10: 25,
		11: 28,
		12: 31,
		13: 34,
		14: 37,
		15: 40
	},

	velocity: {
		1: 4 / 256,
		2: 8 / 256,
		3: 10 / 256,
		4: 12 / 256,
		5: 16 / 256,
		6: 24 / 256,
		7: 36 / 256,
		8: 48 / 256,
		9: 96 / 256,
		10: 128 / 256,
		11: 150 / 256,
		12: 170 / 256,
		13: 192 / 256,
		14: 224 / 256,
		15: 1,
		16: 2,
		17: 3,
		18: 5,
		19: 20
	},

	
	goal: function () {
		var level = this.level,
		    goal = this.levelGoals[level];

		while (goal === undefined && level >= 0) {
			goal = this.levelGoals[level--];
		}

		return goal;
	},

	clearLines: function (numCleared) {
		var goal = this.goal();

		this.clearedLines += numCleared;

		if (this.clearedLines >= goal) {
			this.clearedLines -= goal;
			this.level++;
			this.applyLevel();
		}
	},

	levelUpCallback: function () {
		switch (this.level) {
		case 20:
			this.game.setFade(true);
			break;
		case 21:
			this.game.won();
			break;
		default:
		}
	}
});

LevelSystem.Static = $.inherit(LevelSystem.Base, {
	spawnDelay: {
		1: 0
	},

	keyHoldDelay: {
		1: 1
	},

	keyHoldInterval: {
		1: 75
	},

	groundedTimeout: {
		1: 60
	},

	lineClearDelay: {
		1: 0
	},

	velocity: {
		1: 3 / 250
	}
});

LevelSystem.Death = $.inherit(LevelSystem.Base, {
	groundedTimeout: {
		1: 35
	},

	spawnDelay: {
		1: 6
	},

	lineClearDelay: {
		1: 10
	},

	velocity: {
		1: 20
	}
});

window.LevelSystem = LevelSystem;
})(this);
