function clamp(min, max, value) {
	return Math.max(Math.min(max, value), min);
}

var HighScores = {
	cached: null,
	prefix: "blocksonblast.",

	save: function (game) {
		this.cached = null;
		localStorage[this.prefix + "replay" + Date.now()] = game.score.score + "_" + btoa(InputSink.LocalStorage.save());
	},

	getLocal: function () {
		var key,
		    date, score,
		    scores = [];

		if (this.cached) { return this.cached; }

		for (var i = 0, len = localStorage.length; i < len; i++) {
			key = localStorage.key(i);

			if (key.indexOf(this.prefix + "replay") !== 0) { continue; }

			date = key.match(/\d+$/)[0];
			if (date) {
				date = new Date(parseInt(date, 10));
			}

			score = parseInt(localStorage[key].split("_")[0], 10);
			scores.push({key: key, score: score, date: date});
		}

		return this.cached = scores;
	},

	byScore: function () {
		return this.getLocal().sort(function (a, b) {
			return b.score - a.score;
		});
	}
};

function Paginator(list) {
	this.list = list;
	this.createEvents();
	this.createUI();
	this.setPage(1);
}

Paginator.prototype = {
	list: null,
	page: null,
	perPage: 10,

	selector: "#scores_pagination",
	navClass: "nav",
	prevTemplate: "<a class='{nav} previous_page' data-page=prev>Back</a>",
	nextTemplate: "<a class='{nav} next_page' data-page=next>Next</a>",
	pageTemplate: "<a class='{nav}' data-page={page}>{page}</a>",

	update: $.noop,

	pages: function () {
		return Math.ceil(this.list.length / this.perPage);
	},

	next: function () {
		this.setPage(this.page + 1);
	},

	prev: function () {
		this.setPage(this.page - 1);
	},

	setPage: function (page) {
		this.page = clamp(1, this.pages(), page);
	},

	slice: function () {
		var offset = this.perPage * (this.page - 1);

		return this.list.slice(offset, offset + this.perPage);
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

			this.update();
		}.bind(this));
	},

	createUI: function () {
		var ui = this.render(this.prevTemplate, {nav: this.navClass}),
		    i;

		for (i = 1; i <= 10; i++) {
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

HighScores.Menu = {
	scores: null,
	container: null,

	init: function () {
		if (!this.scores) {
			this.scores = new Paginator(HighScores.byScore());
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
		    idx,
		    target = e.target,
		    key = HighScores.prefix + target.parentNode.className,
		    replay = InputSource.Replay;

		if (target.className === "no_replay") { return; }

		idx = localStorage[key].indexOf("_") + 1;
		replayStr = localStorage[key].substr(idx);
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
		scoreNode = UI.createNode("td", score.score),
		replayNode = UI.createNode("td", "Play Replay"),

		replayNode.className = "replay";
		node.className = className;

		node.appendChild(dateNode);
		node.appendChild(scoreNode);
		node.appendChild(replayNode);

		return node;
	}
};

