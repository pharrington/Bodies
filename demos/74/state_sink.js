(function (window, undefined) {

var InputSink = {
	Base: {
		game: null,
		inputs: null,

		start: function (game) {
			this.game = game;
			this.inputs = [];
		},

		refresh: function (elapsed, moves) {
			this.inputs.push($.inherit(InputSink.State, {
				input: moves,
				delay: elapsed
			}));
		}
	},

	State: {
		delay: null,
		input: null,

		serialize: function () {
			return String.fromCharCode(this.input & 255);
		},

		unserialize: function (str, offset) {
			offset = offset || 0;
			
			this.input = str.charCodeAt(offset) & 255;
		}
	}
};

InputSink.LocalStorage = $.inherit(InputSink.Base, {
	generateHeader: function () {
		var game = this.game,
		    header = {};

		header.queueSeed = game.queueSource.lastSeed;

		return JSON.stringify(header);
	},

	save: function () {
		var header = this.generateHeader(),
		    len = header.length;
	       
		return String.fromCharCode((len >> 8) & 255) + String.fromCharCode(len & 255) +
			header +
			this.inputs.reduce(function (str, state) {
				return str + state.serialize();
			}, "");
	}
});

window.InputSink = InputSink;
})(this);
