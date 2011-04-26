$.inherit = function (proto, attrs) {
	var maker = function () {},
	    o;

	maker.prototype = proto;
	o = new maker;
	typeof attrs === "object" && $.extend(o, attrs);

	return o;
};

var InputSource = {
	Base: {
		game: null,
		keyHold: $.noop,
		keyPress: $.noop,
		refresh: $.noop,
		startPiece: $.noop,
		nextPiece: $.noop,
		endPiece: $.noop,

		start: function (game) {
			this.game = game;
		}
	}
};

InputSource.Player = $.inherit(InputSource.Base, {
	keyHold: function (key) {
		if (!this.spawnTimer) {
			this.inputSource.move(key);
		}
	},

	move: function (key) {
		var direction,
		    game = this.game;

		if (key === game.Config.Left) {
			direction = Piece.Direction.Left;
		} else if (key === game.Config.Right) {
			direction = Piece.Direction.Right;
		}

		direction && game.tryMove(direction);
	},

	keyPress: function (key) {
		var rotation;

		if (key === Game.Config.Pause) {
			this.pause();
		}

		if (key === Game.Config.RotateCW) {
			rotation = Piece.Rotation.CW;
		}

		if (key === Game.Config.RotateCCW) {
			rotation = Piece.Rotation.CCW;
		}

		if (!this.spawnTimer && key === Game.Config.HardDrop) {
			this.hardDrop();
		}

		rotation && this.tryRotation(rotation);
	},

	refresh: function (elapsed, now) {
		var game = this.game;

		if ($.keys[game.Config.SoftDrop]) {
			game.dropPiece();
		}
	}
});

InputSource.AI = $.inherit(InputSource.Base, {
	keyPress: function (key) {
		if (key === Game.Config.Pause) {
			this.pause();
		}
	},

	refresh: function (elapsed) {
		AI.movePiece(elapsed);
	},

	nextPiece: function () {
		AI.startPiece();
	},

	endPiece: function () {
		AI.endPiece();
	},

	start: function (game) {
		InputSource.Base.start.call(this, game);
		AI.init(game);
	}
});
