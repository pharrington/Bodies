(function (window, undefined) {

var SecretMove = {
	buffer: null,

	// these are a secret between you and me.
	codes: [
		["72,65,76,57,48,48,48", function () {
			UI.events.normal[1] = function () {
				UI.startGame("DemoAI");
			};
		}],
		["86,69,82,83,85,83", function () {
			UI.events.normal[1] = function () {
				Modes.Versus.newGame();
			};
		}],
		["83,72,73,78,66,76,79,67,75,72,69,65,68", function () {
			UI.events.normal[1] = function () {
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

var UI = {
	events: {
		normal: ["click", function () {
			UI.startGame("Normal");
		}],

		time_attack: ["click", function () {
			UI.startGame("TimeAttack");
		}],

		controls: ["click", function () {
			ConfigMenu.init();
			UI.showOnly("controls_menu");
		}],

		high_scores: ["click", function () {
			UI.highScoresMenu();
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

	showOnly: function (ids) {
		var elements, id;
		
		elements = ["main_menu", "controls_menu", "high_scores_menu", "multiplayer", "field", "field_background", "field_piece", "field_effects", "high_scores_daily_banner"];


		if (!(ids instanceof Array)) {
			ids = [ids];
		}

		elements.forEach(function (id) {
			e = document.getElementById(id);
			if (!e) { return; }

			if (ids.indexOf(id) === -1) {
				Util.hide(e);
				if (id === "high_scores_daily_banner") {
					HighScores.Banner.cancelShow();
				}
			} else {
				Util.show(e);
			}
		});

		SecretMove.remove();
	},

	fadeTo: function (ids, callback) {
		var callbackDelay = 500,
		    duration = 1000,
		    steps = 40,
		    dt = ~~(duration / steps),
		    time = 0,
		    origOpacity = Fade.css.opacity,
		    fader;

		fader = function () {
			time += dt;
			Fade.css.opacity += 1 / steps;
			Fade.show();

			if (time >= duration) {
				window.setTimeout(function () {
					callback();
					UI.showOnly(ids);
					Fade.css.opacity = origOpacity;
					Fade.hide();
				}, callbackDelay);
			} else {
				window.setTimeout(fader, dt);
			}
		};

		Fade.css.opacity = 0;
		Fade.show();

		window.setTimeout(fader, dt);
	},

	mainMenu: function () {
		UI.showOnly("main_menu", "high_scores_daily_banner");
		UI.events.normal[1] = function () {
			UI.startGame("Normal");
		};

		Modes.Versus.closeSocket();
		HighScores.Banner.update();
		SecretMove.init();
	},

	highScoresMenu: function () {
		HighScores.Menu.init();
		UI.showOnly("high_scores_menu");
	},

	startGame: function (gameOrMode) {
		var game;
	       
		if (typeof gameOrMode === "string") {
			game = Modes[gameOrMode].newGame();
		} else {
			game = gameOrMode;
		}

		if (!game) { return; }

		UI.fadeTo(["field", "field_piece", "field_background", "field_effects"], function () {
			Piece.clear();
			FX.clear();
			$.context.clearRect(0, 0, $.width, $.height);
			$.register(game);
			game.start();
		});
	},

	bindEvents: function () {
		var id, events = this.events,
		    tuple;

		for (id in events) {
			if (!events.hasOwnProperty(id)) { continue; }

			(function (tuple) {
				document.getElementById(id).addEventListener(tuple[0], function () {
					tuple[1]();
				}, false);
			}(events[id]));
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

var PauseMenu = {
	game: null,

	_node: null,
	node: function () {
		var node = this._node;

		if (node) { return node; }

		node = document.getElementById("pause");
		this._node = node;

		return node;
	},

	register: function () {
		this.node().style.display = "block";
	},

	hide: function () {
		setTimeout(function () {
			this.node().style.display = "none";
		}.bind(this), 0);
	},

	unpause: function () {
		this.hide();
		$.register(this.game);
	},

	restart: function () {
		var game = this.game;

		this.unpause();

		game.endGame(function () {
			this.field.clear();
			this.field.draw();
		}, $.noop, 0);

		if (game.replayEntry) {
			game = Modes.newReplay(game.replayEntry);
		} else {
			game = game.mode.newGame();
		}

		setTimeout(function () {
			$.register(game);
			game.start();
		}, 0);

		this.game = null;
	},

	quit: function () {
		var game = this.game;

		this.unpause();

		if (!game.replayEntry) {
			game.endGame(game.loseCallback, UI.mainMenu.bind(UI), 0);
		} else {
			game.endGame(game.loseCallback, 0);
		}
	},

	keyHold: $.noop,
	refresh: $.noop,
	keyPress: function (key) {
		if (key === Game.Config.Pause) {
			this.unpause();
			return false;
		}
	}
};

UI.PauseMenu = PauseMenu;

document.addEventListener("DOMContentLoaded", function () {
	UI.bindEvents();
	HighScores.Banner.update();
}, false);

window.UI = UI;

})(this);
