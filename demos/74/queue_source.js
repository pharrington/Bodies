(function (exports) {

function shuffle(ary, rng) {
	var i = ary.length,
	    r,
	    item,
	    temp,
	    shuffled = [].slice.call(ary);

	while (--i) {
		r = ~~(rng() * i);

		item = shuffled[i];
		temp = shuffled[r];
		shuffled[r] = item;
		shuffled[i] = temp;
	}

	return shuffled;
}

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

QueueSource.RandomGenerator = $.inherit(QueueSource.Base, {
	bagSize: 7,
	queueSize: 5,
	bag: null,
	bagIndex: 0,

	createBag: function () {
		this.bag = shuffle(Game.shapes, this.rng);
	},

	start: function (game) {
		this.bagIndex = 0;
		QueueSource.Base.start.call(this, game);
	},

	generatePiece: function () {
		var shape;

		if (this.bagIndex === 0) {
			this.createBag();
		}

		shape = this.bag[this.bagIndex];
		this.bagIndex = (this.bagIndex + 1) % this.bagSize;

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

exports.QueueSource = QueueSource;

})(window);
