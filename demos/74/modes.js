(function (window, undefined) {

var WS_STATE = {
	CONNECTING: 0,
	OPEN: 1,
	CLOSING: 2,
	CLOSED: 3
};

var Modes = {
	newGame: function (level, score, rotation, queue) {
		var game = $.inherit(Game);

		game.levels = $.inherit(LevelSystem[level]);
		game.score = $.inherit(Score[score]);
		game.setQueueSource($.inherit(QueueSource[queue]));

		game.setRotationSystem(RotationSystems[rotation]);
		game.addInputSink(InputSink.LocalStorage);
		game.setInputSource(InputSource.Player);
		game.effects = $.inherit(FX.Burst);
		game.dropFX = FX.Streak;
		game.gameStatus = $.inherit(GameStatus.Score);

		return game;
	},

	newReplay: function (mode, replayStr) {
		var game, replay;

		if (typeof mode === "object") {
			replayStr = mode.replayStr;
			mode = mode.mode;
		}

		replay = InputSource.Replay;

		game = Modes[mode].newGame();
		game.setInputSource(replay);

		if (!replay.loadReplay(atob(replayStr))) {
			return null;
		}

		game.endGameCallback = UI.highScoresMenu.bind(UI);
		game.replayEntry = {mode: mode, replayStr: replayStr};

		return game;
	}
};

Modes.Normal = {
	name: "Normal",
	newGame: function () {
		var game = Modes.newGame("Normal", "Points", "TGM", "TGM");

		game.mode = this;
		game.softLock = true;

		return game;
	}
};

Modes.Master = {
	name: "Master",
	newGame: function () {
		var game = Modes.newGame("Master", "Master", "TGM", "TGM");

		game.mode = this;
		game.gameStatus = GameStatus.Rank;
		game.softLock = true;
		game.holdPiece = $.noop;

		return game;
	}
};

Modes.Infinity = {
	name: "Infinity",
	newGame: function () {
		var game = Modes.newGame("Static", "Points", "SRS", "RandomGenerator");
		game.mode = this;
		game.hardLock = true;
		game.killOnLockAboveField = true;

		return game;
	}
};

Modes.TimeAttack = {
	name: "TimeAttack",
	newGame: function () {
		var game = Modes.newGame("Static", "TimeAttack", "TGM", "TGM");

		game.mode = this;
		game.gameStatus = GameStatus.Timer;
		game.hardLock = true;

		return game;
	}
};

Modes.DemoAI = {
	name: "AI",
	newGame: function () {
		var game = Modes.newGame("Normal", "Points", "TGM", "TGM");

		game.mode = this;
		game.hardLock = true;
		game.holdPiece = $.noop;
		game.setInputSource(InputSource.AI);
		game.endGameCallback = UI.mainMenu.bind(UI);

		return game;
	}
};

Modes.Death = {
	name: "Death",
	newGame: function () {
		var game = Modes.newGame("Death", "TimeAttack", "TGM", "TGM");

		game.mode = this;
		game.gameStatus = GameStatus.Timer;
		game.holdPiece = $.noop;
		game.softLock = true;

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
				UI.showOnly("multiplayer");
			}
		},

		Match: {
			onmessage: function (msg) {
				var data = JSON.parse(msg.data),
				    vs = Modes.Versus;

				if (data.tick) {
					vs.input(data.input);
				} else if (data.endGame) {
					UI.showOnly("multiplayer");
				}
			},

			transition: function (data) {
				var vs = Modes.Versus,
				    p1 = vs.players[0];

				UI.showOnly("field");

				$.register(p1);
				$.refresh(function (elapsed, now) {
					vs.players.forEach(function (p) {
						p.refresh(elapsed, now);
					});
				}, p1.refreshInterval);

				vs.players.forEach(function (p) {
					p.queueSource.setSeed(data.seed);
					p.start();
				});
			}
		}
	},

	createSocket: function () {
		var ws = this.ws;

		if (!ws || ws.readyState === WS_STATE.CLOSED || ws.readyState === WS_STATE.CLOSING) {
			this.ws = new WebSocket(this.server);
			this.players[0].setWS(this.ws);
		}
	},

	closeSocket: function () {
		this.ws && this.ws.close();
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
		    p2 = Modes.Master.newGame(),
		    net = $.inherit(InputSink.Network),
		    vs = this;

		p1.addInputSink(net);
		p1.setWS = function (ws) {
			net.ws = ws;
		};

		p2.ghostPiece = false;
		p2.setInputSource(InputSource.Base);
		p2.doFrame = p2.draw;
		p2.offset = {x: 450, y: 0};

		this.players = [p1, p2];
		this.players.forEach(function (p) {
			p.pause = $.noop;
			p.winCallback = p.loseCallback = function () {
				vs.ws.send(255);
				vs.endCallback.call(this);
			};
		});

		this.transition("Search");
	},

	endCallback: function () {
		this.field.clear();
		this.field.draw();
		$.refresh($.noop, 1000);
		UI.showOnly("multiplayer");
	}
};

InputSink.Network = $.inherit(InputSink.Base, {
	ws: null,
	buffer: null,
	bufferSize: 4,

	refresh: function (elapsed, moves) {
		this.ws.send(moves);
	}
});

window.Modes = Modes;

})(this);
