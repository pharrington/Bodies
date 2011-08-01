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

	States: {
		Search: {
			onmessage: function (msg) {
				var data = msg.data;

				if (data.connect) {
					Modes.Versus.transition("Match", data);
				}
			}
		},

		Match: {
			onmessage: function (msg) {
				var data = msg.data;

				if (data.tick) {
					Modes.Versus.input(data.input);
				}
			}
		}
	},

	createSocket: function () {
		var ws = new WebSocket(this.server);
	},

	transition: function (state, data) {
		var ws = this.ws;

		ws.onmessage = state.onmessage;
	},

	send: function (input) {
		this.ws.send(input);
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

		this.players = [p1, p2];

		this.transition("Search");
	},
};
