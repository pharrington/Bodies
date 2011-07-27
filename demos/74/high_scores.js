var HighScores = {
	save: function (game) {
		localStorage["blocksonblast.replay" + Date.now()] = game.score.score + "_" + btoa(InputSink.LocalStorage.save());
	},

	getLocal: function () {
		var key,
		    date, score,
		    scores = [];

		for (key in localStorage) {
			if (!key.match(/^blocksonblast\.replay/)) { continue; }

			date = key.match(/\d+$/)[0];
			if (date) {
				date = new Date(parseInt(date, 10));
			}

			score = parseInt(localStorage[key].split("_")[0], 10);
			scores.push({key: key, score: score, date: date});
		}

		return scores;
	},

	byScore: function () {
		return this.getLocal().sort(function (a, b) {
			return b.score - a.score;
		});
	}
};
