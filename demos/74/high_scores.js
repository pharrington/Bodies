(function (exports) {

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

function clamp(min, max, value) {
	return Math.max(Math.min(max, value), min);
}

function filterMode(mode, score) {
	return score.mode === mode;
}

function sortBy(attribute, a, b) {
	return b[attribute] - a[attribute];
}

function Paginator(source) {
	this.source = source;
	this.createEvents();
	this.createUI();
	this.setPage(1);
}

Paginator.prototype = {
	source: function () { return []; },
	page: null,
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
		this.page = clamp(1, this.pages(), page);
		this.update();
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
			} else {
				this.setPage(parseInt(page, 10));
			}
		}.bind(this));
	},

	createUI: function () {
		var ui = this.render(this.prevTemplate, {nav: this.navClass}),
		    i;

		for (i = 1; i <= Math.min(10, this.pages()); i++) {
			ui += this.render(this.pageTemplate, {page: i, nav: this.navClass});
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

var HighScores = {
	cached: null,
	prefix: "blocksonblastv2.",

	save: function (game) {
		var mode = game.mode,
		    entry = {
			mode: mode.name,
			replay: btoa(InputSink.LocalStorage.save())
		    };

		game.score.save.forEach(function (property) {
			entry[property] = game.score[property];
		});

		localStorage[this.prefix + "replay" + Date.now()] = JSON.stringify(entry);
		this.cached = null;
	},

	getLocal: function () {
		var key,
		    scores = [];

		if (this.cached) { return this.cached; }

		for (var i = 0, len = localStorage.length; i < len; i++) {
			key = localStorage.key(i);

			if (key.indexOf(this.prefix + "replay") !== 0) { continue; }

			scores.push(new HighScores.Score(key));
		}

		return this.cached = scores;
	}
};

HighScores.Score = function (key) {
	var date,
	    property,
	    decoded;

	date = key.match(/\d+$/)[0];
	if (date) {
		date = new Date(parseInt(date, 10));
	}

	decoded = JSON.parse(localStorage[key]);
	for (property in decoded) {
		if (!decoded.hasOwnProperty(property)) { continue; }
		this[property] = decoded[property];
	}

	this.key = key;
	this.date = date;
	this.displayScore = this.displays[this.mode];
};

HighScores.Score.prototype = {
	displayScore: $.noop,
	displays: {
		Master: function () {
			return gradeMap[this.grade];
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

			return pad00(m) + ":" + pad00(s);
		}
	}
};

HighScores.Menu = {
	scores: null,
	container: null,
	mode: "Master",

	scoreList: {
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

	init: function () {
		if (!this.scores) {
			this.scores = new Paginator(this.scoreList[this.mode]);
			this.scores.update = this.update.bind(this);
		}

		this.container = document.getElementById("high_scores_menu").querySelector("tbody");
		this.container.addEventListener("click", this.replay, true);
		this.update();
	},

	update: function () {
		this.container.innerHTML = "";
		this.scores.slice().map(this.scoreToNode.partial(this.container)).compact().forEach(function (node) {
			this.container.appendChild(node);
		}, this);
	},

	replay: function (e) {
		var game = Modes.Master.newGame(),
		    replayStr,
		    entry,
		    target = e.target,
		    key = HighScores.prefix + target.parentNode.className,
		    replay = InputSource.Replay;

		if (target.className === "no_replay") { return; }

		entry = JSON.parse(localStorage[key]);
		replayStr = entry.replay;

		game = Modes[entry.mode].newGame();
		game.setInputSource(replay);

		if (!replay.loadReplay(atob(replayStr))) {
			target.firstChild.nodeValue = "No Replay";
			target.className = "no_replay";
			return;
		}

		$.register(game);
		game.start();
		UI.showOnly("field");
	},

	scoreToNode: function (container, score) {
		var date,
		    dateStr,
		    node,
		    dateNode,
		    scoreNode,
		    replayNode,
		    className = score.key.replace(HighScores.prefix, "");

		if (container.querySelector("." + className)) { return null };

		date = score.date,
		dateStr = pad00(date.getMonth()) + "-" + pad00(date.getDate()) + "-" + date.getFullYear(),
		node = document.createElement("tr"),
		dateNode = UI.createNode("td", dateStr),
		scoreNode = UI.createNode("td", score.displayScore()),
		replayNode = UI.createNode("td", "Play Replay"),

		replayNode.className = "replay";
		node.className = className;

		node.appendChild(dateNode);
		node.appendChild(scoreNode);
		node.appendChild(replayNode);

		return node;
	}
};

exports.HighScores = HighScores;
})(window);
