var GameStatus = {};

GameStatus.Score = {
	game: null,
	levelElement: null,
	scoreElement: null,
	offset: { x: 350, y: 420 },

	start: function (game) {
		var node;

		this.game = game;
		node = document.getElementById("game_status");
		node.style.display = "block";
		node.style.left = this.offset.x + game.field.offset.x + "px";
		node.style.top = this.offset.y + game.field.offset.y + "px";
	},

	draw: function () {
		var game = this.game;

		this.setText("level", game.levels.level);
		this.setText("score", game.score.score);
	},

	setText: function (id, text) {
		var property = id + "Element";

		if (!this[property]) {
			this[property] = document.getElementById(id).firstChild;
		}

		this[property].nodeValue = text;
	},

	hide: function () {
		document.getElementById("game_status").style.display = "none";
	}
};

GameStatus.Timer = {
};
