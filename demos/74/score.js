(function (exports) {

function run(callback) { callback(); }

var Score = {
	Base: {
		score: 0,
		elapsed: 0,
		combo: 0,
		hardDropY: 0,
		softDropY: 0,
		softDropValue: 0,
		hardDropValue: 0,
		currentPiece: null,
		callbacks: null,

		hardDrop: $.noop,
		softDrop: $.noop,
		refresh: $.noop,
		clearLines: $.noop,
		won: $.noop,

		start: function (game) {
			this.score = 0;
			this.combo = 0;
			this.elapsed = 0;
			this.game = game;
			this.hardDropY = this.softDropY = 0;
			this.currentPiece = null;
			this.callbacks = [];
		},

		refresh: function (elapsed) {
			if (this.won()) { return; }

			this.elapsed += elapsed;
			this.callbacks.forEach(run.curry(elapsed), this);
		}

	}
};

Score.Master = $.inherit(Score.Base, {
	grades: [
		// internal grade 0
		{decay: 125, clearPoints: [10, 20, 40, 50]},

		// internal grade 1
		{decay: 80, clearPoints: [10, 20, 30, 40]},

		// internal grade 2
		{decay: 80, clearPoints: [10, 20, 30, 40]},

		// internal grade 3
		{decay: 50, clearPoints: [10, 15, 20, 40]},

		// internal grade 4
		{decay: 45, clearPoints: [10, 15, 20, 40]},

		// internal grade 5
		{decay: 45, clearPoints: [5, 15, 20, 30]},

		// internal grade 6
		{decay: 45, clearPoints: [5, 10, 20, 30]},

		// internal grade 7
		{decay: 40, clearPoints: [5, 10, 15, 30]},

		// internal grade 8
		{decay: 40, clearPoints: [5, 10, 15, 30]},

		// internal grade 9
		{decay: 40, clearPoints: [5, 10, 15, 30]},

		// internal grade 10
		{decay: 40, clearPoints: [2, 12, 13, 30]},

		// internal grade 11
		{decay: 40, clearPoints: [2, 12, 13, 30]},

		// internal grade 12
		{decay: 30, clearPoints: [2, 12, 13, 30]},

		// internal grade 13
		{decay: 30, clearPoints: [2, 12, 13, 30]},

		// internal grade 14
		{decay: 30, clearPoints: [2, 12, 13, 30]},

		// internal grade 15
		{decay: 20, clearPoints: [2, 12, 13, 30]},

		// internal grade 16
		{decay: 20, clearPoints: [2, 12, 13, 30]},

		// internal grade 17
		{decay: 20, clearPoints: [2, 12, 13, 30]},

		// internal grade 18
		{decay: 20, clearPoints: [2, 12, 13, 30]},

		// internal grade 19
		{decay: 20, clearPoints: [2, 12, 13, 30]},

		// internal grade 20
		{decay: 15, clearPoints: [2, 12, 13, 30]},

		// internal grade 21
		{decay: 15, clearPoints: [2, 12, 13, 30]},

		// internal grade 22
		{decay: 15, clearPoints: [2, 12, 13, 30]},

		// internal grade 23
		{decay: 15, clearPoints: [2, 12, 13, 30]},

		// internal grade 24
		{decay: 15, clearPoints: [2, 12, 13, 30]},

		// internal grade 25
		{decay: 15, clearPoints: [2, 12, 13, 30]},

		// internal grade 26
		{decay: 15, clearPoints: [2, 12, 13, 30]},

		// internal grade 27
		{decay: 15, clearPoints: [2, 12, 13, 30]},

		// internal grade 28
		{decay: 15, clearPoints: [2, 12, 13, 30]},

		// internal grade 29
		{decay: 15, clearPoints: [2, 12, 13, 30]},

		// internal grade 30
		{decay: 10, clearPoints: [2, 12, 13, 30]},

		// internal grade 31
		{decay: 10, clearPoints: [2, 12, 13, 30]}
	],

	comboMultiplier: [
		[1.0, 1.0, 1.0, 1.0],
		[1.2, 1.4, 1.5, 1.0],
		[1.2, 1.5, 1.8, 1.0],
		[1.4, 1.6, 2.0, 1.0],
		[1.4, 1.7, 2.2, 1.0],
		[1.4, 1.8, 2.3, 1.0],
		[1.4, 1.9, 2.4, 1.0],
		[1.5, 2.0, 2.5, 1.0],
		[1.5, 2.1, 2.6, 1.0],
		[2.0, 2.5, 3.0, 1.0]
	],

	points: 0,
	grade: 0,
	uncomboedFrames: 0,

	start: function (game) {
		this.points = 0;
		this.grade = 0;
		this.uncomboedFrames = 0;
		Score.Base.start.call(this, game);
	},

	clearLines: function (lines) {
		var level = this.game.levels.level,
		    comboMultiplier,
		    levelMultiplier;

		if (!lines) {
			this.combo = 0;
			return;
		} else if (lines >= 2) {
			this.combo++;
		}

		this.uncomboedFrames = 0;
		this.combo = Math.max(1, this.combo);

		comboMultiplier = this.comboMultiplier[Math.min(this.combo, this.comboMultiplier.length) - 1][lines - 1];
		levelMultiplier = Math.min(~~(level / 250) + 1, 4);

		this.points += Math.ceil(this.grades[this.grade].clearPoints[lines - 1] * comboMultiplier) * levelMultiplier;

		if (this.points >= 100) {
			this.grade++;
			this.points = 0;
		}
	},

	callbacks: [
		function () {
			if (this.combo || this.game.spawnTimer) { return; }

			this.uncomboedFrames++;
			if (this.uncomboedFrames === this.grades[this.grade].decay) {
				this.points = Math.max(this.points - 1, 0);
				this.uncomboedFrames = 0;
			}
		}
	]
});

Score.Infinite = $.inherit(Score.Base, {
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
	linesLeft: 0,

	start: function (game) {
		Score.Base.start.call(this, game);
		this.linesLeft = 40;
	},

	clearLines: function (lines) {
		this.linesLeft = Math.max(this.linesLeft - lines, 0);
	},

	won: function () {
		return this.linesLeft === 0;
	}
});

exports.Score = Score;

})(window);
