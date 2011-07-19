var Modes = {
	newGame: function (level, score, queue) {
		var game = $.inherit(Game);

		game.levels = LevelSystem[level];
		game.score = Score[score];
		game.setQueueSource(QueueSource[queue]);

		game.setInputSource(InputSource.Player);
		game.effects = FX.Fireworks;
		game.dropFX = FX.Streak;
		game.gameStatus = GameStatus;

		return game;
	}
};

Modes.Master = {
	newGame: function () {
		var game = Modes.newGame("Master", "Master", "TGM");

		return game;
	}
};
