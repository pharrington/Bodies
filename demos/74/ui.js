var SecretMove = {
	buffer: null,

	codes: [
		["72,65,76,57,48,48,48", function () {
			UI.events.master[1] = function () {
				UI.startGame("DemoAI");
			};
		}],
		["86,69,82,83,85,83", function () {
			UI.events.master[1] = function () {
				Modes.Versus.newGame();
			};
		}],
		["83,72,73,78,66,76,79,67,75,72,69,65,68", function () {
			UI.events.master[1] = function () {
				UI.startGame("Death");
			};
		}]
	],

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
		this.buffer.push(e.keyCode);
		this.codes.forEach(function (code) {
			if (this.buffer.join().indexOf(code[0]) !== -1) {
				code[1]();
				this.buffer = [];
			}
		}, this);
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
		container.appendChild(li);

		li.addEventListener("click", function () {
			if ($this.activeControl) {
				$this.updateActive();
				return;
			}

			valueText.nodeValue = "...";

			$this.activeControl = {
				valueText: valueText,
				value: Game.Config[property],
				property: property,
				node: li
			};

			$this.bindEvents();
		}, false);
	},

	keyDown: function (e) {
		var c = this.activeControl;

		c.value = e.keyCode;
		this.updateValue(c);
		this.trigger(c.node.nextSibling);
	},

	trigger: function (node) {
		if (!node) { return; }

		var e;

		if (document.createEvent) {
			e = document.createEvent("MouseEvents");
			e.initEvent("click", true, true);
			node.dispatchEvent(e);
		} else {
			node.click();
		}
	},

	updateActive: function () {
		this.activeControl && this.updateValue(this.activeControl);
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
		master: ["click", function () {
			UI.startGame("Master");
		}],

		time_attack: ["click", function () {
			UI.startGame("TimeAttack");
		}],

		controls: ["click", function () {
			ConfigMenu.init();
			UI.showOnly("controls_menu");
		}],

		high_scores: ["click", function () {
			HighScores.Menu.init();
			UI.showOnly("high_scores_menu");
		}],

		resume: ["click", function () {
			PauseMenu.unpause();
		}],

		restart: ["click", function () {
			PauseMenu.restart();
		}],

		quit: ["click", function () {
			PauseMenu.quit();
		}]
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
		var elements = ["main_menu", "controls_menu", "high_scores_menu", "multiplayer", "field"];

		elements.forEach(function (e) {
			e = document.getElementById(e);
			if (!e) { return; }

			e.style.display = e.id === id ? "block" : "none";
		});

		SecretMove.remove();
	},

	mainMenu: function () {
		UI.showOnly("main_menu");
		UI.events.master[1] = function () {
			UI.startGame("Master");
		};

		Modes.Versus.closeSocket();
		SecretMove.init();
	},

	startGame: function (mode) {
		var game = Modes[mode].newGame();

		if (!game) { return; }


		UI.showOnly("field");
		$.register(game);
		game.start();
	},

	bindEvents: function () {
		var id, events = this.events,
		    tuple;

		for (id in events) {
			if (!events.hasOwnProperty(id)) { continue; }

			tuple = events[id];
			(function (t) {
				document.getElementById(id).addEventListener(t[0], function () {
					t[1]();
				}, false);
			}(tuple));
		}

		document.documentElement.addEventListener("click", function (e) {
			if (e.target.className.match(/back_to_main/)) {
				ConfigMenu.updateActive();
				UI.mainMenu();
			}
		}, true);

		SecretMove.init();
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
	var selectors = ["#main_menu h1", "#controls_menu h1", "#high_scores_menu h1"],
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
