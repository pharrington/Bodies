var
	SCORE_API_REPLAY_URL    = "http://amrita:4567/replay",
	SCORE_API_UPLOAD_URL    = "http://amrita:4567/score",
	SCORE_API_SHOW_URL      = "http://amrita:4567/scores",
	SCORE_API_DAILYBEST_URL = "http://amrita:4567/dailybest";

(function (window) {

var gradeMap = [
	"9", "8", "7", "6", "5",
	"4", "4+",
	"3", "3+",
	"2-", "2", "2+",
	"1-", "1", "1+",
	"S1-", "S1", "S1+",
	"S2",
	"S3",
	"S4-", "S4", "S4+",
	"S5", "S5+",
	"S6", "S6+",
	"S7", "S7+",
	"S8", "S8+",
	"S9",
	"M",
	"GM",
	"GM+"
];

var loadingIcon = Util.cacheNode("#squareloader");

function clamp(min, max, value) {
	return Math.max(Math.min(max, value), min);
}

function filterMode(mode, score) {
	return score.mode === mode;
}

function sortBy(attribute, a, b) {
	return b[attribute] - a[attribute];
}

function dailyBest(mode, callback) {
	remoteDailyBest(mode, callback);
}

function remoteDailyBest(mode, callback) {
	var request = new XMLHttpRequest;

	request.onreadystatechange = function () {
		if (request.readyState !== 4) { return; }

		var score = HighScores.Score.createFromObject(JSON.parse(request.responseText));
		callback(score);
	};

	request.open("GET", SCORE_API_DAILYBEST_URL);
	request.send();
}

function localDailyBest(mode, callback) {
	var hiscores = HighScores.Menu.scoreList[mode]().filter(function (score) {
		var today = new Date(),
		    date = score.getDate();

		return date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear();
	});

	callback(hiscores[0]);
}

function updateSavedName(name) {
	var savedName = localStorage[HighScores.prefix + "name"];

	if (savedName !== name) {
		localStorage[HighScores.prefix + "name"] = name;
	}
}

function defaultPlayerName(name) {
	var name = localStorage[HighScores.prefix + "name"];

	return name ? name : "Player 1";
}

function showLoadingAnim() {
	Util.show(loadingIcon());
	Fade.show();
}

function hideLoadingAnim() {
	setTimeout(function() {
		Fade.hide();
		Util.hide(loadingIcon());
	}, 200);
}

function Paginator(source, update) {
	this.source = source;
	this.update = update;
	this.createEvents();
	this.createUI();
	this.setPage(1);
}

Paginator.prototype = {
	source: function () { return []; },
	page: null,
	displayPages: false,
	perPage: 10,

	selector: "#scores_pagination",
	navClass: "nav",
	prevTemplate: "<a class='{nav} previous_page' data-page=prev>Back</a>",
	nextTemplate: "<a class='{nav} next_page' data-page=next>Next</a>",
	pageTemplate: "<a class='{nav}' data-page={page}>{page}</a>",

	update: $.noop,

	pages: function () {
		return Math.ceil(this.source().length / this.perPage);
	},

	next: function () {
		this.setPage(this.page + 1);
	},

	prev: function () {
		this.setPage(this.page - 1);
	},

	setPage: function (page) {
		this.page = page;
	},

	slice: function () {
		var offset = this.perPage * (this.page - 1);

		return this.source().slice(offset, offset + this.perPage);
	},

	_container: null,
	container: function () {
		if (this._container) { return this._container; }

		this._container = document.querySelector(this.selector);
		return this._container;
	},

	createEvents: function () {
		this.container().addEventListener("click", function (e) {
			if ((" " + e.target.className + " ").indexOf(" " + this.navClass + " ") === -1) { return; }

			var page = e.target.getAttribute("data-page");

			if (page === "next" || page === "prev") {
				this[page]();
				this.update();
			} else {
				this.setPage(parseInt(page, 10));
				this.update();
			}
		}.bind(this), true);
	},

	createUI: function () {
		var ui = this.render(this.prevTemplate, {nav: this.navClass}),
		    i;

		if (this.displayPages) {
			for (i = 1; i <= Math.min(10, this.pages()); i++) {
				ui += this.render(this.pageTemplate, {page: i, nav: this.navClass});
			}
		}

		ui += this.render(this.nextTemplate, {nav: this.navClass});
		this.container().innerHTML = ui;
	},

	render: function (template, values) {
		var interpolRegex = /{([^}]*)}/g;

		if (!values) { return template; }

		return template.replace(interpolRegex, function (match, key) {
			var replacement = "";

			if (match.indexOf("{{") === 0) {
				replacement = match.substr(1);
			} else if (values.hasOwnProperty(key)) {
				replacement = values[key];
			}

			return replacement;
		});
	}
};

function loadLocalReplay(key, callback) {
	var entry = localStorage[key];

	if (entry) {
		entry = JSON.parse(entry);
		callback(entry.mode, entry.replay);
	}
}

function loadRemoteReplay(key, callback) {
	var request = new XMLHttpRequest;

	request.onreadystatechange = function () {
		if (request.readyState !== 4) { return; }

		var replay, mode;

	        replay = request.responseText;
		mode = "Normal";

		callback(mode, replay);
	};

	request.open("GET", SCORE_API_REPLAY_URL + Util.buildQueryString({"key": key}));
	request.send();
}

var HighScores = {
	cached: null,
	prefix: "blocksonblastv2.replay",

	save: function (score) {
		localStorage[this.prefix + score.getDate().valueOf()] = JSON.stringify(score);
		this.cached = null;
	},

	getLocal: function () {
		var key,
		    scores = [];

		if (this.cached) { return this.cached; }

		for (var i = 0, len = localStorage.length; i < len; i++) {
			key = localStorage.key(i);

			if (key.indexOf(this.prefix) !== 0) { continue; }

			scores.push(HighScores.Score.createFromKey(key));
		}

		return this.cached = scores;
	}
};

var ScoreDisplays = {
	Normal: function () {
		return this.score;
	},

	Master: function () {
		return gradeMap[this.score];
	},

	Infinity: function () {
		return this.score;
	},

	TimeAttack: function () {
		var ms, s, m,
		    e = this.elapsed;

		m = ~~(e / 60000);
		e -= m * 60000;

		s = ~~(e / 1000);
		e -= s * 1000;

		return Util.pad00(m) + ":" + Util.pad00(s);
	}
};

HighScores.Score = $.extend(function () {}, {
	createFromObject: function (obj) {
		if (!obj) { return null; }

		var score, property;

		score = new HighScores.Score;

		for (property in obj) {
			if (!obj.hasOwnProperty(property)) { continue; }
			score[property] = obj[property];
		}

		score.displayScore = ScoreDisplays[score.mode];

		return score;
	},

	createFromKey: function (key) {
		var score, property, decoded;

		score = new HighScores.Score;

		try {
			decoded = JSON.parse(localStorage[key]);
			for (property in decoded) {
				if (!decoded.hasOwnProperty(property)) { continue; }
				score[property] = decoded[property];
			}

			score.key = key;
			score.displayScore = ScoreDisplays[score.mode];
		} catch (e) {
			if (e instanceof SyntaxError) {
				score = null;
			} else {
				throw e;
			}
		}

		return score;
	},

	createFromGame: function (game) {
		var mode, date, entry, scoreSystem;
	       
		scoreSystem = game.score;
		mode = game.mode;
		date = Date.now();
		entry = {
			mode: mode.name,
			date: date,
			replay: btoa(InputSink.LocalStorage.save())
		};

		if (scoreSystem.save) {
			entry.score = scoreSystem[scoreSystem.save];
		}

		entry.elapsed = scoreSystem.elapsed;

		return HighScores.Score.createFromObject(entry);
	},

});

HighScores.Score.prototype = {
	properties: ["key", "date", "player"],
	score: 0,
	elapsed: 0,
	key: null,
	date: null,
	player: null,

	displayScore: $.noop,
	save: $.noop,

	getDate: function () {
		return new Date(parseInt(this.date, 10));
	},

	getPlayer: function () {
		if (!this.player) {
			return defaultPlayerName();
		}

		else {
			return this.player;
		}
	},

	saveLocal: function () {
		var obj, property, properties;

		obj = {};

		for (property in this) {
			if (!this.hasOwnProperty(property)) { continue; }

			obj[property] = this[property];
		}

		this.properties.forEach(function (property) {
			obj[property] = this[property];
		}, this);

		localStorage[this.prefix + this.getDate().valueOf()] = JSON.stringify(obj);
	},

	saveRemote: function () {
		var formData, property, request;

		formData = new FormData;

		for (property in this) {
			if (!this.hasOwnProperty(property)) { continue; }

			formData.append(property, this[property]);
		}

		this.properties.forEach(function (property) {
			formData.append(property, this[property]);
		}, this);

		request = new XMLHttpRequest;
		request.open("POST", SCORE_API_UPLOAD_URL);
		request.send(formData);
	},

	
	toNode: function () {
		var date,
		    dateStr,
		    node,
		    dateNode,
		    scoreNode,
		    replayNode,
		    className = this.prefix + this.key;

		date = this.getDate();
		dateStr = Util.pad00(date.getMonth() + 1) + "-" + Util.pad00(date.getDate()) + "-" + date.getFullYear();
		node = document.createElement("tr");
		playerNode = UI.createNode("td", this.getPlayer());
		dateNode = UI.createNode("td", dateStr);
		scoreNode = UI.createNode("td", this.displayScore());
		replayNode = UI.createNode("td", "Play Replay");

		replayNode.className = "replay";
		node.className = className;

		node.appendChild(playerNode);
		node.appendChild(dateNode);
		node.appendChild(scoreNode);
		node.appendChild(replayNode);

		return node;
	}
};

HighScores.Menu = {
	scores: null,
	mode: "Normal",
	attached: false,
	container: Util.cacheNode("#high_scores_menu tbody"),

	scoreList: {
		Normal: function () {
			return HighScores.getLocal()
				.filter(filterMode.partial("Normal"))
				.sort(sortBy.partial("score"));
		},

		Master: function () {
			return HighScores.getLocal()
				.filter(filterMode.partial("Master"))
				.sort(sortBy.partial("grade"));
		},

		TimeAttack: function () {
			return HighScores.getLocal()
				.filter(filterMode.partial("TimeAttack"))
				.sort(sortBy.partial("elapsed"))
				.reverse();
		}
	},

	attachEvents: function () {
		if (this.attached) { return; }

		this.container().addEventListener("click", function (e) {
			var target, key;

			target = e.target;
			key = target.parentNode.className.replace(this.prefix, "");

			if (target.classNode === "no_replay") { return; }

			this.playReplay(key, function () {
				target.textContent = "No Replay";
				target.className = "no_replay";
			});
		}.bind(this), true);

		this.attached = true;
	},

	init: function () {
		if (!this.scores) {
			this.scores = new Paginator($.noop, this.updateRemote.bind(this));
		}

		this.attachEvents();
		this.scores.update();
	},

	updateLocal: function () {
		this.container().innerHTML = "";
		this.scores.slice().map(this.scoreToNode.partial(this.container())).compact().forEach(function (node) {
			this.container().appendChild(node);
		}, this);
	},

	updateRemote: function () {
		var request = new XMLHttpRequest,
			page, perPage;

		if (this.scores) {
			page = this.scores.page;
			perPage = this.scores.perPage;
		} else {
			page = 1;
			perPage = 10;
		}
			
		showLoadingAnim();

		request.onreadystatechange = function () {
			if (request.readyState !== 4) { return; }

			var container = this.container();

			JSON.parse(request.responseText)
				.forEach(function (record) {
					var score = HighScores.Score.createFromObject(record);

					if (!this.containsScore(score)) {
						container.appendChild(score.toNode());
					}
				}, this);

			hideLoadingAnim();
		}.bind(this);

		request.open("GET", SCORE_API_SHOW_URL + Util.buildQueryString({page: page, per_page: perPage}));
		request.send();
	},

	containsScore: function (score) {
		return !!this.container().querySelector("." + score.prefix + score.key);
	},

	playReplay: function (key, failure) {
		loadRemoteReplay(key, function (mode, replayStr) {
			var game;

			game = Modes.newReplay(mode, replayStr);

			if (!game) {
				failure();
				return;
			}

			UI.startGame(game);
		});

	}
};

HighScores.Banner = {
	showTimer: null,

	cancelShow: function () {
		window.clearTimeout(this.showTimer);
	},
	
	update: function () {
		var scoreNode = document.getElementById("high_scores_daily_banner_score"),
		    playerNode = document.getElementById("high_scores_daily_banner_player"),
		    container = document.getElementById("high_scores_daily_banner");

		this.showTimer = setTimeout(function () {
			dailyBest("Normal", function (score) {
				if (!score) { return; }

				Util.show(container);
				scoreNode.textContent = score.displayScore();
				playerNode.textContent = score.getPlayer();
				container.onclick = function () { HighScores.Menu.playReplay(score.key) };
			});
		}, 1000);
	}
};

var ScoreEntry = {
	node: Util.cacheNode("#score_entry"),
	scoreNode: Util.cacheNode("#score_entry_score"),
	nameNode: Util.cacheNode("#score_entry_name"),
	formNode: Util.cacheNode("#score_entry_form"),
	attached: false,
	score: null,

	attachEvents: function () {
		if (this.attached) { return; }

		this.formNode().addEventListener("submit", this.save.bind(this), false);
	},

	show: function (game) {
		var score, cl;

		score = HighScores.Score.createFromGame(game);
		this.scoreNode().textContent = score.displayScore();
		this.nameNode().value = score.getPlayer();
		this.score = score;
		Util.show(this.node());
		this.nameNode().focus();

		this.attachEvents();
	},

	hide: function () {
		Util.hide(this.node());
		UI.mainMenu();
	},

	save: function (e) {
		e.preventDefault();

		this.score.player = this.nameNode().value;
		updateSavedName(this.score.getPlayer());
		this.score.saveRemote();
		this.hide();
	}
}

window.HighScores = HighScores;
window.ScoreEntry = ScoreEntry;

})(window);
