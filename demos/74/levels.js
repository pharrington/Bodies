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
		400: 27,
		500: 35
	},

	lineClearDelay: {
		1: 10
	},

	spawnDelay: {
		1: 6
	},

	velocity: {
		1:  3 / 250,
		10: 6 / 250,
		20: 10 / 250,
		30: 15 / 250,
		40: 20 / 250,
		50: 25 / 250,
		60: 30 / 250,
		80: 40 / 250,
		100: 50 / 250,
		120: 65 / 250,
		150: 80 / 250,
		200: 100 / 250,
		300: 150 / 250,
		400: 1,
		500: 20,
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
	properties: LevelSystem.Base.properties.concat(["keyHoldDelay", "keyHoldInterval"]),

	spawnDelay: {
		1: 0
	},

	groundedTimeout: {
		1: 60
	},

	lineClearDelay: {
		1: 0
	},

	velocity: {
		1: 10 / 250
	},

	keyHoldDelay: {
		1: 250
	},

	keyHoldInterval: {
		1: 1
	}
});
