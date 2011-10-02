$.inherit = function (proto, attrs) {
	var maker = function notObjectDotCreate() {},//$.inherit.maker,
	    o;

	maker.prototype = proto;
	o = new maker;
	typeof attrs === "object" && $.extend(o, attrs);

	return o;
};
//$.inherit.maker = new Function;

var Inputs = {
	Left: 0x01,
	Right: 0x02,
	RotateCW: 0x04,
	RotateCCW: 0x08,
	HardDrop: 0x10,
	SoftDrop: 0x20,
	Hold: 0x40
};

Inputs.RotateCCWAlt = Inputs.RotateCCW;

var InputSource = {
	Base: {
		game: null,
		keyHold: $.noop,
		keyPress: $.noop,
		refresh: $.noop,
		enable: $.noop,
		disable: $.noop,
		startPiece: $.noop,
		nextPiece: $.noop,
		endPiece: $.noop,
		endSpawnNext: $.noop,
		gameOver: $.noop,

		start: function (game) {
			this.game = game;
		}
	}
};

InputSource.Player = $.inherit(InputSource.Base, {
	keyHold: function (key) {
		if (this.spawnTimer) { return; }
		var config = this.Config,
		    left = $.keys[config.Left],
		    right = $.keys[config.Right];

		if (key === config.Right && (!left || right.at > left.at)) {
			this.input(Inputs.Right);
		} else if (key === config.Left && (!right || left.at > right.at)) {
			this.input(Inputs.Left);
		}
	},

	keyPress: function (key) {
		if (key === this.Config.Pause) {
			this.pause();
			return false;
		}

		return !this.inputSource.acceptMoves(key, ["RotateCW", "RotateCCW", "RotateCCWAlt", "Hold", "HardDrop"]);
	},

	// IRS
	endSpawnNext: function () {
		var game = this.game,
		    config = game.Config;

		if ($.keys[config.RotateCW]) {
			game.input(Inputs.RotateCW);
		} else if ($.keys[config.RotateCCW] || $.keys[config.RotateCCWAlt]) {
			game.input(Inputs.RotateCCW);
		}
	},

	refresh: function (elapsed) {
		var game = this.game,
		    config = game.Config;

		if ($.keys[config.SoftDrop] && !($.keys[config.Right] || $.keys[config.Left])) {
			game.input(Inputs.SoftDrop);
		}
	},

	acceptMoves: function (key, moves) {
		var game = this.game,
		    config = game.Config,
		    handledMove = false;

		moves.forEach(function (move) {
			if (key === config[move]) {
				game.input(Inputs[move]);
				handledMove = true;
			}
		});

		return handledMove;
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

	gameOver: function () {
		AI.gameOver();
	},

	start: function (game) {
		InputSource.Base.start.call(this, game);
		AI.init(game);
	}
});

InputSource.Replay = $.inherit(InputSource.Base, {
	elapsed: 0,
	recorded: 0,
	stateIndex: 0,
	stateList: null,

	readHeader: function (str, offset, size) {
		return JSON.parse(str.substr(offset, size));
	},

	loadHeader: function (header) {
		var game = this.game;

		game.queueSource.setSeed(header.queueSeed);
	},

	headerSize: function (str) {
		return ((str.charCodeAt(0) << 8) & 255) | (str.charCodeAt(1) & 255);
	},

	loadReplay: function (str) {
		var headerSize = this.headerSize(str),
		    headerOffset = 2,
		    header = this.readHeader(str, headerOffset, headerSize),
		    state,
		    stateList,
		    i, len;

		this.stateIndex = 0;
		stateList = this.stateList = [];

		this.loadHeader(header);

		for (i = headerOffset + headerSize, len = str.length; i < len; i += 1) {
			state = $.inherit(InputSink.State);
			state.unserialize(str, i);
			stateList.push(state);
		}

		return this;
	},

	keyPress: function (key) {
		if (key === Game.Config.Pause) {
			this.pause();
		}
	},

	refresh: function (elapsed) {
		var state = this.stateList[this.stateIndex];

		if (state) {
			this.game.input(state.input);
			this.stateIndex++;
		}
	}
});
