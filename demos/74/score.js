var Score = {
	Base: {
		score: 0,
		combo: 0,
		hardDropY: 0,
		softDropY: 0,
		softDropValue: 0,
		hardDropValue: 0,
		currentPiece: null,

		hardDrop: $.noop,
		softDrop: $.noop,
		refresh: $.noop,
		clearLines: $.noop,
		won: $.noop,

		start: function (game) {
			this.score = 0;
			this.combo = 0;
			this.game = game;
			this.hardDropY = this.softDropY = 0;
			this.currentPiece = null;
		}
	}
};

Score.Master = $.inherit(Score.Base, {
	softDropValue: 1,
	hardDropValue: 4,

	lineClears: {
		0: 0,
		1: 200,
		2: 500,
		3: 800,
		4: 1600
	},

	clearLines: function (lines) {
		var value = this.lineClears[lines],
		    level = this.game.levels.level;

		if (!lines) {
			this.combo = 0;
			return;
		}

		value *= this.levelMultiplier();

		this.combo++;
		this.score += value;
	},

	levelMultiplier: function () {
		var level = this.game.levels.level;

		if (level >= 500) { return 6; }
		else if (level >= 400) { return 5; }
		else if (level >= 300) { return 4; }
		else if (level >= 200) { return 3; }
		else if (level >= 100) { return 2; }
		else { return 1; }
	},

	refresh: function () {
		var piece = this.currentPiece,
		    y;

		if (!piece) { return; }

		y = piece.gridPosition.y;

		this.score += (y - this.hardDropY) * this.hardDropValue * this.levelMultiplier();

		this.hardDropY = this.softDropY = 0;
		this.currentPiece = null;
	},

	hardDrop: function (piece) {
		this.currentPiece = piece;
		this.hardDropY = piece.gridPosition.y;
	},

	softDrop: function () {
	}
});

Score.TimeAttack = $.inherit(Score.Base, {
	linesRemaining: 0,
	elapsed: 0,

	start: function (game) {
		Score.Base.start.call(this, game);
		this.linesRemaining = 40;
		this.elapsed = 0;
	},

	clearLines: function (lines) {
		this.linesRemaining = Math.max(this.linesRemaining - lines, 0);
	},

	refresh: function (elapsed) {
		if (this.linesRemaining !== 0) {
			this.elapsed += elapsed;
		}
	},

	won: function () {
		return this.linesRemaining === 0;
	}
});
