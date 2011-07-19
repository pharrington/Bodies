var UI = {
	events: {
		standard: ["click", function () {
			UI.startGame("Master");
		}]
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
	var header = letterize(document.querySelector("#main_menu h1")),
	    colors = ["#db0b1e", "#e2950e", "#e2da0e", "#0bdb15", "#0b48db", "#590ee2"],
	    i, len;

	for (i = 0, len = header.length; i < len; i++) {
		header[i].style.color = cycle(colors, i);
	}

	UI.bindEvents();
}, false);
