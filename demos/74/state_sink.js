var InputSink = {
	SavedProperties: [
		"groundedTimeout",
		"lineClearDelay",
		"spawnDelay",
		"velocityIncrement",
		"startVelocity"
	],

	Base: {
		game: null,
		inputs: null,

		start: function (game) {
			this.game = game;
			this.inputs = [];
		},

		refresh: function (elapsed, moves) {
			this.inputs.push($.inherit(InputSink.State, {
				input: moves,
				delay: elapsed
			}));
		}
	},

	State: {
		delay: null,
		input: null,

		serialize: function () {
			return String.fromCharCode(this.input & 255);
		},

		unserialize: function (str, offset) {
			offset = offset || 0;
			
			this.input = str.charCodeAt(offset) & 255;
		}
	}
};

InputSink.LocalStorage = $.inherit(InputSink.Base, {
	generateHeader: function () {
		var game = this.game,
		    header = {},
		    properties = InputSink.SavedProperties;

		properties.forEach(function (p) {
			header[p] = game[p];
		});

		header.queueSeed = game.queueSource.seed;

		return JSON.stringify(header);
	},

	save: function () {
		var header = this.generateHeader(),
		    len = header.length;
	       
		return String.fromCharCode((len >> 8) & 255) + String.fromCharCode(len & 255) +
			header +
			this.inputs.reduce(function (str, state) {
				return str + state.serialize();
			}, "");
	}
});

var StateSink = {
	Base: {
		game: null,
		refresh: $.noop,
		startPiece: $.noop,
		nextPiece: $.noop,
		endPiece: $.noop,

		start: function (game) {
			this.game = game;
		}
	},

	State: {
		headerSize: 1,
		intOffset: 2,
		delay: 0,
		pieceX: null,
		pieceY: null,
		pieceShape: null,
		code: null,
		terminate: false,
		hold: false,

		equals: function (s) {
			return this.pieceX === s.pieceX &&
				this.pieceY === s.pieceY &&
				this.pieceShape === s.pieceShape &&
				this.code === s.code;
		},

		compare: function (p) {
			var pos = p.gridPosition;

			return this.pieceX === pos.x &&
				this.pieceY === pos.y &&
				this.pieceShape === p.shapeIndex &&
				this.code === p.code;
		},

		fromPiece: function (piece) {
			return $.inherit(this, {
				pieceX: piece.gridPosition.x,
				pieceY: piece.gridPosition.y,
				pieceShape: piece.shapeIndex,
				code: piece.code
			});
		},

		syncPiece: function (piece) {
			piece.gridPosition.x = this.pieceX;
			piece.gridPosition.y = this.pieceY;
			piece.shapeIndex = this.pieceShape;
			piece.setShape();
		},

		createPiece: function () {
			var piece = $.inherit(Shapes[Shapes.PieceList[this.code]], {
				gridPosition: {
					x: this.pieceX,
					y: this.pieceY
				},
				shapeIndex: this.pieceShape
			});

			piece.setShape();
			return piece;
		},

		/*
		 * bits
		 * xshape
		 * 0     terminate
		 * 1 - 2 pieceShape
		 * 3 - 6 pieceX
		 * 7     hold
		 *
		 * ypiece
		 * 0 - 2 code
		 * 3 - 7 pieceY
		 */
		serialize: function () {
			var xshape = 0,
			    ypiece = 0,
			    delay = String(this.delay),
			    offset = this.intOffset,
			    bytes;

			xshape = ((this.hold & 1) << 7 |
				 ((this.pieceX + offset) & 15) << 3 |
				 (this.pieceShape & 3) << 1 |
				 this.terminate & 1);
			ypiece = ((this.pieceY + offset) & 31) << 3 |
				 (this.code & 7);

			bytes = String.fromCharCode(xshape) + String.fromCharCode(ypiece) + delay;
			return String.fromCharCode(bytes.length) + bytes;
		},

		unserialize: function (str, offset) {
			var offset = offset || 0,
			    len = str.charCodeAt(offset),
			    xshape = str.charCodeAt(offset + 1) & 255,
			    ypiece = str.charCodeAt(offset + 2) & 255,
			    io = this.intOffset;

			this.pieceX = ((xshape >> 3) & 15) - io;
			this.pieceY = (ypiece >> 3) - io;
			this.pieceShape = (xshape >> 1) & 3;
			this.terminate = xshape & 1;
			this.hold = xshape >> 7;
			this.code = Shapes[Shapes.PieceList[ypiece & 7]].code;
			this.delay = parseInt(str.substr(offset + 3, len - 2), 10);
			return len + this.headerSize;
		}
	}
};

StateSink.Replay = $.inherit(StateSink.Base, {
	currentState: null,
	elapsed: null,
	states: null,

	refresh: function (elapsed) {
		var prevState = this.currentState,
		    currentPiece = this.game.currentPiece;

		if (!(prevState && prevState.compare(currentPiece))) {
			prevState && this.states.push(prevState);

			this.currentState = StateSink.State.fromPiece(this.game.currentPiece);
			this.currentState.delay = this.elapsed;
			this.elapsed = 0;
		}

		this.elapsed += elapsed;
	},

	endPiece: function () {
		var states = this.states,
		    state = this.currentState;

		if (state.delay === this.elapsed) {
			state.terminate = true;
			states.push(state);
		} else {
			states.push(state);
			state = StateSink.State.fromPiece(this.game.currentPiece);
			state.hold = this.game.hasHeldPiece;
			state.terminate = true;
			state.delay = this.elapsed;
			states.push(state);
		}

		this.currentState = null;
		this.elapsed = 0;
	},

	start: function (game) {
		StateSink.Base.start.call(this, game);
		this.elapsed = 0;
		this.states = [];
	},

	save: function () {
		return this.states.map(function (s) {
			return s.serialize();
		}).join("");
	}
});
