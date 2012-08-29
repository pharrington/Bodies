(function (window, undefined) {

var Score = {
	Base: {
		score: 0,
		elapsed: 0,
		combo: 0,
		hardDropY: 0,
		softDropY: 0,
		softDropValue: 0,
		hardDropValue: 0,
		save: null,
		currentPiece: null,
		callbacks: [],

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
		},

		refresh: function (elapsed) {
			if (this.won()) { return; }

			this.elapsed += elapsed;
			this.callbacks.forEach(function (c) {
				c.call(this, elapsed);
			}, this);
		},

		toString: function () {
			return "" + this.score;
		}

	}
};

Score.Master = $.inherit(Score.Base, {
	save: "grade",
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
	tetrises: 0,
	lastSectionEndTime: 0,
	benchmark: 63000,
	doMRoll: true,

	start: function (game) {
		this.points = 0;
		this.grade = 0;
		this.uncomboedFrames = 0;
		this.lastSectionEndTime = 0;
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

		if (lines === 4) {
			this.tetrises++;
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

	toString: function () {
		return this.displayMap[this.grade];
	},

	won: function () {
	},

	toRoll: function (roll, callback) {
		var game = this.game,
		    score = this;

		game.active = false;
		game.tick = game.draw;
		$.keyPress($.noop);

		game.clearTimers();
		game.setTimeout(function () {
			var nextRoll = $.inherit(roll);

			nextRoll.elapsed = score.elapsed;

			game.field.clearGrid();
			game.field.redraw();
			$.keyPress(game.keyPress.bind(game));
			game.tick = game.doFrame;
			game.active = true;
			game.score = nextRoll;
			
			game.nextPiece();
			callback.call(score, game);
		}, 240);
	},

	callbacks: [
		function () {
			if (this.combo || this.game.spawnTimer) { return; }

			this.uncomboedFrames++;
			if (this.uncomboedFrames === this.grades[this.grade].decay) {
				this.points = Math.max(this.points - 1, 0);
				this.uncomboedFrames = 0;
			}
		},

		//M-Roll conditions
		function (elapsed) {
			if (!this.doMRoll) { return; }

			var level = this.game.levels.level,
			    minTetrises,
			    minGrade = 0,
			    sectionTime;

			if (level === 0 || (level % 100) && (level !== 999)) { return; }

			sectionTime = this.elapsed - this.lastSectionEndTime;
			this.lastSectionEndTime = this.elapsed;

			if (level <= 500) {
				minTetrises = 2;
			} else if (level === 600) {
				this.benchmark = ((this.elapsed - sectionTime) / 5 >> 0);
				minTetrises = 1;
			} else if (level > 600) {
				this.benchmark += sectionTime;
				minTetrises = 1;
			}

			if (level === 999) {
				minTetrises = 0;
				minGrade = 31;
			}

			if  (sectionTime > this.benchmark + 2000 ||
				this.tetrises < minTetrises ||
				this.grade < minGrade ||
				(this.level === 999 && this.elapsed > 525000)) {
				this.doMRoll = false;
			}

			this.tetrises = 0;
		},

		// do staff roll
		function () {
			var level = this.game.levels.level,
			    game = this.game,
			    score = this;

			if (level < 999) { return; }

			if (this.doMRoll) {
				this.toRoll(Score.TGM2Roll, function (game) {
					game.invisible = true;
				});
			} else {
				this.toRoll(Score.StaffRoll, function (game) {
					game.score.grade = this.grade;
					game.fade = game.field.fade = true;
				});
			}
		}
	]
});

Score.StaffRoll = $.inherit(Score.Base, {
	grade: 0,
	survived: 0,
	save: "grade",

	refresh: function (elapsed) {
		if (this.won()) { return; }

		this.survived += elapsed;
	},

	winCallback: function () {
		Game.winCallback.call(this);
	},

	loseCallback: function () {
		Game.loseCallback.call(this);
	},

	won: function () {
		if (this.survived >= 60000) {
			return true;
		}

		return false;
	}
});

Score.TGM2MRoll = $.inherit(Score.StaffRoll, {
	grade: 32,

	won: function () {
		if (this.survived >= 60000) {
			this.grade = 33;
			return true;
		}

		return false;
	}
});

Score.Points = $.inherit(Score.Base, {
	save: "score",
	lineValues: [100, 300, 600, 1600],
	elapsedFrames: 0,
	framesLimit: 60,
	multiplier: 1,
	multiplierMax: 11,

	clearLines: function (numCleared) {
		if (!numCleared && this.elapsedFrames >= this.framesLimit) {
			this.multiplier = Math.max(1, Math.floor(this.multiplier / 2));
		}
		
		if (this.elapsedFrames < this.framesLimit) {
			this.multiplier = Math.min(this.multiplierMax, this.multiplier + Math.pow((this.framesLimit - this.elapsedFrames) / this.framesLimit, 2));
		}

		if (numCleared) {
			this.score += Math.floor(this.multiplier) * this.game.levels.level * this.lineValues[numCleared - 1];
		}

		this.elapsedFrames = 0;
	},

	callbacks: [
		function () {
			this.elapsedFrames++;
		}
	]
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

	goal: function () { return this.linesLeft; },

	won: function () {
		return this.linesLeft === 0;
	}
});

window.Score = Score;

})(this);
