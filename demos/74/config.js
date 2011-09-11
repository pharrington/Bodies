(function (exports) {

var ConfigMenu = {
	options: {
		"Left": ["Left"],
		"Right": ["Right"],
		"Soft Drop": ["SoftDrop"],
		"Hard Drop": ["HardDrop"],
		"Rotate Left": ["RotateCCW"],
		"Rotate Left Alt": ["RotateCCWAlt"],
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

			li.className += " " + "active";
			valueText.nodeValue = "...";

			$this.activeControl = {
				node: li,
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
		setKey(control.property, control.value);
		control.valueText.nodeValue = this.convertValue(control.value);

		control.node.className = control.node.className.replace(/ active ?/, "");
		this.activeControl = null;
		document.documentElement.removeEventListener("keydown", this.keyDown, false);

		save();
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

function setKey(property, value) {
	Game.Config[property] = value;
}

function load() {
	var serialized = localStorage["blocksonblast.keyconfig"];

	if (serialized) {
		objectEach(JSON.parse(serialized), setKey);
	}
}

function save() {
	localStorage["blocksonblast.keyconfig"] = JSON.stringify(Game.Config);
}

function objectEach(obj, callback) {
	var p;

	for (p in obj) {
		if (!obj.hasOwnProperty(p)) { continue; }

		callback.call(obj, p, obj[p]);
	}
}

window.addEventListener("load", load, false);

exports.ConfigMenu = ConfigMenu;
})(window);
