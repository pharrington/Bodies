var QueueSource = {
	Base: {
		queueSize: 1,
		queue: null,
		game: null,
		rng: null,
		seed: null,

		generatePiece: $.noop,

		initRNG: function () {
			if (!this.seed) {
				this.seed = Date.now();
			}

			this.rng = Alea(this.seed);
		},

		next: function () {
			var q = this.queue,
			    piece = this.generatePiece();

			piece && q.push(piece);
			return q.shift();
		},

		start: function (game) {
			var size = this.queueSize,
			    piece,
			    q = this.queue = [],
			    i;

			this.initRNG();
			this.game = game;

			for (i = 0; i < size; i++) {
				piece = this.generatePiece();
				piece && q.push(piece);
			}
		},

		gameOver: function () {
			this.seed = null;
		}
	}
};

QueueSource.TGM = $.inherit(QueueSource.Base, {	
	queueSize: 4,

	generatePiece: function () {
		var shape,
		    random = QueueSource.Naive.generatePiece,
		    queue = this.queue;
		    inQueue = true,
		    i = 0;

		while (inQueue && i < 4) {
			shape = random.call(this);
			if (queue.indexOf(shape) === -1) { inQueue = false; }
			i++;
		}

		return shape;
	}
});

QueueSource.Naive = $.inherit(QueueSource.Base, {
	generatePiece: function () {
		return Game.shapes[~~(this.rng() * 7)];
	}
});

QueueSource.Test = $.inherit(QueueSource.Base, {
	pieces: ["I", "T", "S", "O", "Z"],
	index: 0,

	generatePiece: function () {
		return this.pieces[this.index++ % 5];
	}
});

QueueSource.Replay = $.inherit(QueueSource.Base, {
	replay: null,

	loadReplay: function(replay) {
		var q = this.queue = [],
		    held = false,
		    states = replay.stateList;

		states.forEach(function (state) {
			if (state.terminate) {
				if (!(state.hold && held)) {
					q.push(Game.shapes[state.code]);
				}
			}

			if (state.hold) { held = true; }
		});
	},

	start: function (game) {
		this.game = game;
	}
});
