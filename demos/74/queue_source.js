var QueueSource = {
	Base: {
		queueSize: 1,
		queue: null,
		game: null,

		generatePiece: $.noop,

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

			this.game = game;

			for (i = 0; i < size; i++) {
				piece = this.generatePiece();
				piece && q.push(piece);
			}
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
			shape = random();
			if (queue.indexOf(shape) === -1) { inQueue = false; }
			i++;
		}

		return shape;
	}
});

QueueSource.Naive = $.inherit(QueueSource.Base, {
	generatePiece: function () {
		return Game.shapes[~~(Math.random() * 7)];
	}
});

QueueSource.Replay = $.inherit(QueueSource.Base, {
	replay: null,

	loadReplay: function(replay) {
		var q = this.queue = [],
		    states = replay.stateList,
		    current, prev,
		    i, len;

		prev = states[0];
		q.push(Game.shapes[prev.code]);

		for (i = 1, len = states.length; i < len; i++) {
			current = states[i];

			if (current.pieceY < prev.pieceY) {
				q.push(Game.shapes[current.code]);
			}

			prev = current;
		}
	},

	start: function (game) {
		this.game = game;
	}
});
