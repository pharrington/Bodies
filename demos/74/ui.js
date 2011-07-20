var ConfigMenu = {
	options: {
		"Left": ["Left"],
		"Right": ["Right"],
		"Soft Drop": ["SoftDrop"],
		"Hard Drop": ["HardDrop"],
		"Rotate Left": ["RotateCCW"],
		"Rotate Right": ["RotateCW"],
		"Hold Piece": ["Hold"]
	},

	convertValue: function (v) {
		var map = {
			32: "Space",
			37: "Left",
			38: "Up",
			39: "Right",
			40: "Down",
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
		document.body.removeEventListener("keydown", this.keyDown, false);
	},

	bindEvents: function () {
		document.body.addEventListener("keydown", this.keyDown, false);
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
		}],
	},

	show: function (id) {
		document.getElementById(id).style.display = "block";
	},

	showOnly: function (id) {
		var elements = ["main_menu", "controls_menu", "field"];

		elements.forEach(function (e) {
			e = document.getElementById(e);
			e.style.display = e.id === id ? "block" : "none";
		});
	},

	startGame: function (mode) {
		var game = Modes[mode].newGame();

		game.start();

		UI.showGame();
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

		document.body.addEventListener("click", function (e) {
			if (e.target.className.match(/back_to_main/)) {
				UI.showOnly("main_menu");
			}
		}, true);
	},

	mainMenu: function () {
		document.getElementById("main_menu").style.display = "block";
		document.getElementById("field").style.display = "none";
	},

	showGame: function () {
		document.getElementById("main_menu").style.display = "none";
		document.getElementById("field").style.display = "block";
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
	var selectors = ["#main_menu h1", "#controls_menu h1"],
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
