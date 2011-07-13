var LevelSystem = {
	game: null,
	level: 1,
	properties: ["groundedTimeout", "lineClearDelay", "spawnDelay", "velocity"],

	groundedTimeout: {
		1: 30,
		400: 20
	},

	lineClearDelay: {
		1: 10
	},

	spawnDelay: {
		1: 6
	},

	velocity: {
		1:  3 / 250,
		10: 7 / 250,
		25: 11 / 250,
		40: 15 / 250,
		60: 20 / 250,
		80: 40 / 250,
		100: 80 / 250,
		400: 1,
		500: 20,
	},

	start: function (game) {
		this.level = 1;
		this.game = game;
	},

	endPiece: function () {
		this.level++;
		this.applyLevel();
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
};
