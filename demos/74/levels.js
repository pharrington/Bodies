var LevelSystem = {
	Base: {
		game: null,
		level: 1,
		properties: ["groundedTimeout", "lineClearDelay", "spawnDelay", "velocity"],

		endPiece: $.noop,

		start: function (game) {
			this.level = 1;
			this.game = game;
		},


		applyLevel: function () {
			var level = this.level,
			    table,
			    game = this.game;

			this.properties.forEach(function (p) {
				table = this[p];

				if (level in table) {
					game[p] = table[level];
				}
			}, this);
		}

	}
};

LevelSystem.Master = $.extend(LevelSystem.Base, {
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

	endPiece: function () {
		this.level++;
		this.applyLevel();
	},
});
