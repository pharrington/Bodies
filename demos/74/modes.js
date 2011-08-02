var WS_STATE = {
	CONNECTING: 0,
	OPEN: 1,
	CLOSING: 2,
	CLOSED: 3
};

var Modes = {
	newGame: function (level, score, queue) {
		var game = $.inherit(Game);

		game.levels = $.inherit(LevelSystem[level]);
		game.score = $.inherit(Score[score]);
		game.setQueueSource($.inherit(QueueSource[queue]));

		game.setInputSource(InputSource.Player);
		game.effects = FX.Fireworks;
		game.dropFX = FX.Streak;
		game.gameStatus = $.inherit(GameStatus.Score);

		return game;
	}
};

Modes.Master = {
	newGame: function () {
		var game = Modes.newGame("Master", "Master", "TGM");

		return game;
	}
};

Modes.TimeAttack = {
	newGame: function () {
		var game = Modes.newGame("Static", "TimeAttack", "TGM");

		game.gameStatus = GameStatus.Timer;

		return game;
	}
};

Modes.DemoAI = {
	newGame: function () {
		var game = Modes.newGame("Static", "Master", "TGM");

		game.setInputSource(InputSource.AI);

		return game;
	}
};

Modes.Versus = {
	server: "ws://127.0.0.1:8820",
	ws: null,
	players: null,

	States: {
		Search: {
			onmessage: function (msg) {
				var data = JSON.parse(msg.data);

				if (data.connect) {
					Modes.Versus.transition("Match", data);
				}
			},

			transition: function (data) {
				Modes.Versus.createSocket();
			}
		},

		Match: {
			onmessage: function (msg) {
				var data = JSON.parse(msg.data);

				if (data.tick) {
					Modes.Versus.input(data.input);
				}
			},

			transition: function (data) {
				var vs = Modes.Versus,
				    p1 = vs.players[0];

				UI.showOnly("field");

				vs.players.forEach(function (p) {
					p.start();
				});
				$.register(p1);
				$.refresh(function (elapsed, now) {
					vs.players.forEach(function (p) {
						p.refresh(elapsed, now);
					});
				}, p1.refreshInterval);
			}
		}
	},

	createSocket: function () {
		var ws = this.ws;

		if (!ws || ws.readyState === WS_STATE.CLOSED || ws.readyState === WS_STATE.CLOSING) {
			this.ws = new WebSocket(this.server);
		}
	},

	transition: function (state, data) {
		state = Modes.Versus.States[state];
		state.transition(data);

		this.ws.onmessage = state.onmessage;
	},

	input: function (input) {
		var p2 = this.players[1];

		p2.input(input);
		p2.play();
	},

	newGame: function () {
		var p1 = Modes.Master.newGame(),
		    p2 = Modes.Master.newGame();

		p2.setInputSource(InputSource.Base);
		p2.doFrame = p2.draw;
		//p2.field.offset = {x: 450, y: 0};

		this.players = [p1, p2];
		this.players.forEach(function (p) {
			p.pause = $.noop;
		});

		this.transition("Search");
	}
};

InputSink.Network = $.inherit(InputSink.Base, {
	ws: null,
	buffer: [],
	bufferSize: 4,

	refresh: function (elapsed, moves) {
		this.ws.send(moves);
	}
});
