var GameStatus = {
	game: null,
	levelElement: null,
	scoreElement: null,

	start: function (game) {
		this.game = game;
		document.getElementById("game_status").style.display = "block";
	},

	draw: function () {
		var game = this.game;

		this.element("level").nodeValue = game.levels.level;
		this.element("score").nodeValue = game.score.score;
	},

	element: function (id) {
		var property = id + "Element";

		if (!this[property]) {
			this[property] = document.getElementById(id).firstChild;
		}

		return this[property];
	},

	hide: function () {
		document.getElementById("game_status").style.display = "none";
	}
};
