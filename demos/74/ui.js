var SecretMove = {
	buffer: null,

	codes: [["72,65,67,57,48,48,48", function () {
		UI.events.standard[1] = function () {
			UI.startGame("DemoAI");
		};
	}]],

	init: function () {
		if (!this.keyDown) {
			this.keyDown = this._keyDown.bind(this);
		}

		this.buffer = [];
		document.documentElement.addEventListener("keydown", this.keyDown, false);
	},

	remove: function () {
		document.documentElement.removeEventListener("keydown", this.keyDown, false);
	},

	keyDown: null,
	_keyDown: function (e) {
		this.buffer.unshift(e.keyCode);
		this.codes.forEach(function (code) {
			if (this.buffer.join().indexOf(code[0]) !== -1) {
				code[1]();
				this.buffer = [];
			}
		}, this);
	}
};

var HighScoresMenu = {
	init: function () {
		var container = document.getElementById("high_scores_menu").querySelector("table"),
		    list = HighScores.byScore().map(this.scoreToNode.partial(container)).forEach(function (node) {
			if (!node) { return; }
			container.appendChild(node);
		});
	},

	scoreToNode: function (container, score) {
		var date = score.date,
		    dateStr = date.getDate() + "-" + date.getMonth() + "-" + date.getFullYear(),
		    node = document.createElement("tr"),
		    dateNode = UI.createNode("td", dateStr),
		    scoreNode = UI.createNode("td", score.score),
		    replayNode = UI.createNode("td", "Play Replay");

		if (container.querySelector("._" + dateStr)) { return null };
		replayNode.className = "replay";

		replayNode.addEventListener("click", function () {
			var game = Modes.Master.newGame(),
			    replayStr,
			    idx,
			    r = InputSource.Replay;

			idx = localStorage[score.key].indexOf("_") + 1;
			replayStr = localStorage[score.key].substr(idx);
			game.setInputSource(r);
			if (!r.loadReplay(atob(replayStr))) {
				replayNode.firstChild.nodeValue = "Incompatible Replay";
				replayNode.className = "no_replay";
				return;
			}

			game.start();
			UI.showOnly("field");
			$.refresh(game.countdown.bind(game));
		}, false);

		node.className = "_" + dateStr;
		node.appendChild(dateNode);
		node.appendChild(scoreNode);
		node.appendChild(replayNode);

		return node;
	}
};

var ConfigMenu = {
	options: {
		"Left": ["Left"],
		"Right": ["Right"],
		"Soft Drop": ["SoftDrop"],
		"Hard Drop": ["HardDrop"],
		"Rotate Left": ["RotateCCW"],
		"Rotate Right": ["RotateCW"],
		"Hold Piece": ["Hold"],
		"Pause": ["Pause"]
	},

	convertValue: function (v) {
		var map = {
			9:  "Tab",
			16: "Shift",
			17: "Ctrl",
			19: "Pause",
			20: "Caps Lock",
			27: "Esc",
			32: "Space",
			33: "Page Up",
			34: "Page Down",
			35: "End",
			36: "Home",
			37: "Left",
			38: "Up",
			39: "Right",
			40: "Down",
			42: "Print Screen",
			45: "Insert",
			46: "Delete",
			144: "Num Lock",
			145: "Scroll Lock",
			192: "`"
		    };

		if (map[v]) {
			v = map[v];
		} else {
			v = String.fromCharCode(v);
		}

		return v;
	},

	initOptions: function () {
		var options = this.options,
		    option, tuple;

		for (option in options) {
			if (!options.hasOwnProperty(option)) { continue; }

			tuple = options[option];
			tuple[1] = Game.Config[tuple[0]];
		}
	},

	createControl: function (label, tuple, container) {
		var property = tuple[0],
		    li, labelElement, valueElement, valueText,
		    insertBefore = container.querySelector(".back_to_main"),
		    $this = this;

		/* do nothing if we've already created the appropriate control */
		if (container.querySelector("." + property)) { return; }

		li = document.createElement("li");
		li.className = property;

		labelElement = document.createElement("span");
		labelElement.appendChild(document.createTextNode(label));

		valueElement = document.createElement("span");
		valueElement.className = "value";

		valueText = document.createTextNode(this.convertValue(tuple[1]));
		valueElement.appendChild(valueText);

		li.appendChild(labelElement);
		li.appendChild(valueElement);
		container.insertBefore(li, insertBefore);

		li.addEventListener("click", function () {
			if ($this.activeControl) {
				$this.updateValue($this.activeControl);
				return;
			}

			valueText.nodeValue = "...";

			$this.activeControl = {
				valueText: valueText,
				value: tuple[1],
				property: property
			};

			$this.bindEvents();
		}, false);
	},

	keyDown: function (e) {
		var c = this.activeControl;

		c.value = e.keyCode;
		this.updateValue(c);
	},

	updateValue: function (control) {
		Game.Config[control.property] = control.value;
		control.valueText.nodeValue = this.convertValue(control.value);

		this.activeControl = null;
		document.documentElement.removeEventListener("keydown", this.keyDown, false);
	},

	bindEvents: function () {
		document.documentElement.addEventListener("keydown", this.keyDown, false);
	},

	init: function () {
		var i, len,
		    options = this.options,
		    option,
		    control,
		    container = document.querySelector("#controls_menu ul");

		this.initOptions();
		this.keyDown = this.keyDown.bind(this);

		for (option in options) {
			if (!options.hasOwnProperty(option)) { continue; }

			this.createControl(option, options[option], container);
		}
	}
};
var UI = {
	events: {
		standard: ["click", function () {
			UI.startGame("Master");
		}],

		controls: ["click", function () {
			ConfigMenu.init();
			UI.showOnly("controls_menu");
			SecretMove.remove();
		}],

		high_scores: ["click", function () {
			HighScoresMenu.init();
			UI.showOnly("high_scores_menu");
			SecretMove.remove();
		}],
	},

	createNode: function (type, text) {
		var node = document.createElement(type),
		    textNode = document.createTextNode(text);

		node.appendChild(textNode);
		return node;
	},

	show: function (id) {
		document.getElementById(id).style.display = "block";
	},

	showOnly: function (id) {
		var elements = ["main_menu", "controls_menu", "high_scores_menu", "field"];

		elements.forEach(function (e) {
			e = document.getElementById(e);
			if (!e) { return; }

			e.style.display = e.id === id ? "block" : "none";
		});
	},

	mainMenu: function () {
		UI.showOnly("main_menu");
		UI.events.standard[1] = function () {
			UI.startGame("Master");
		};

		SecretMove.init();
	},

	startGame: function (mode) {
		var game = Modes[mode].newGame();

		game.start();

		UI.showOnly("field");
		$.refresh(game.countdown.bind(game));
	},

	bindEvents: function () {
		var id, events = this.events,
		    tuple;

		for (id in events) {
			if (!events.hasOwnProperty(id)) { continue; }

			tuple = events[id];
			document.getElementById(id).addEventListener(tuple[0], tuple[1], false);
		}

		document.documentElement.addEventListener("click", function (e) {
			if (e.target.className.match(/back_to_main/)) {
				UI.mainMenu();
			}
		}, true);
	}
};

function letterize(node) {
	var html = "",
	    text,
	    i, len;

	text = node.firstChild.nodeValue;

	for (i = 0, len = text.length; i < len; i++) {
		html += "<span>" + text[i] + "</span>";
	}

	node.innerHTML = html;

	return node.children;
}

document.addEventListener("DOMContentLoaded", function () {
	var selectors = ["#main_menu h1", "#controls_menu h1", "#high_scores_menu caption"],
	    colors = ["#db0b1e", "#e2950e", "#e2da0e", "#0bdb15", "#0b48db", "#590ee2"],
	    i, len;


	selectors.forEach(function (s) {
		var letters = letterize(document.querySelector(s));

		for (i = 0, len = letters.length; i < len; i++) {
			letters[i].style.color = cycle(colors, i);
		}
	});


	UI.bindEvents();
}, false);
