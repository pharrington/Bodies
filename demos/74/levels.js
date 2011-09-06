(function () {

var LevelSystem = {
	Base: {
		game: null,
		level: 1,
		properties: ["groundedTimeout", "lineClearDelay", "spawnDelay", "velocity"],

		endPiece: $.noop,
		clearLines: $.noop,

		start: function (game) {
			this.level = 1;
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
	groundedTimeout: {
		1: 30,
		901: 17
	},

	lineClearDelay: {
		1: 40,
		500: 25,
		601: 16,
		701: 12,
		801: 6
	},

	spawnDelay: {
		1: 25,
		701: 16,
		801: 12
	},

	velocity: {
		1:  4 / 256,
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
		450: 3
		500: 20
	},

	clearLines: function (numCleared) {
		this.level += numCleared;
		this.applyLevel();
	},

	endPiece: function () {
		this.level++;
		this.applyLevel();
	},
});

LevelSystem.Static = $.inherit(LevelSystem.Base, {
	//properties: LevelSystem.Base.properties.concat("keyHoldDelay", "keyHoldInterval"),
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
})();
