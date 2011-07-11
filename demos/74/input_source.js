var SPEED = 1;
$.inherit = function (proto, attrs) {
	var maker = function () {},
	    o;

	maker.prototype = proto;
	o = new maker;
	typeof attrs === "object" && $.extend(o, attrs);

	return o;
};

var Inputs = {
	Left: 0x01,
	Right: 0x02,
	RotateCW: 0x04,
	RotateCCW: 0x08,
	HardDrop: 0x10,
	SoftDrop: 0x20,
	Hold: 0x40
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
		if (this.spawnTimer) { return; }

		this.inputSource.acceptMoves(key, ["Left", "Right"]);
	},

	keyPress: function (key) {
		if (key === this.Config.Pause) {
			this.pause();
			return;
		}

		this.inputSource.acceptMoves(key, ["RotateCW", "RotateCCW", "Hold", "HardDrop"]);
	},

	refresh: function (elapsed) {
		if ($.keys[this.game.Config.SoftDrop]) {
			this.game.input(Inputs.SoftDrop);
		}
	},

	acceptMoves: function (key, moves) {
		var game = this.game,
		    config = game.Config;

		moves.forEach(function (move) {
			if (key === config[move]) {
				game.input(Inputs[move]);
			}
		});
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

InputSource.Replay = $.inherit(InputSource.Base, {
	elapsed: 0,
	recorded: 0,
	stateIndex: 0,
	stateList: null,

	readHeader: function (str, offset, size) {
		return JSON.parse(str.substr(offset, size));
	},

	loadHeader: function (header) {
		var game = Game;

		InputSink.SavedProperties.forEach(function (p) {
			game[p] = header[p];
		});

		game.queueSource.seed = header.queueSeed;
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
	},

	keyPress: function (key) {
		if (key === Game.Config.Pause) {
			this.pause();
		}
	},

	refresh: function (elapsed) {
		this.game.input(this.stateList[this.stateIndex++].input);
	}
});
