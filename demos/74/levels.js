var LevelSystem = {
	game: null,
	level: 1,
	properties: ["groundedTimeout", "lineClearDelay", "spawnDelay", "velocity"],

	groundedTimeout: {
		1: 30
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
		var level,
		    table,
		    game = this.game;

		this.properties.forEach(function (p) {
			table = this[p];

			level = this.level;
			while (!(level in table)) {
				level--;
			}

			game[p] = table[level];
		}, this);
	}
};
