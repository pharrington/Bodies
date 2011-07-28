var Modes = {
	newGame: function (level, score, queue) {
		var game = $.inherit(Game);

		game.levels = LevelSystem[level];
		game.score = Score[score];
		game.setQueueSource(QueueSource[queue]);

		game.setInputSource(InputSource.Player);
		game.effects = FX.Fireworks;
		game.dropFX = FX.Streak;
		game.gameStatus = GameStatus.Score;

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
	ws: null,

	createSocket: function () {
		var ws = new WebSocket(this.server);
	},

	States: {
		
	}
};
