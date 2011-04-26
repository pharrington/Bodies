var QueueSource = {
	Base: {
		game: null,
		keyHold: $.noop,
		keyPress: $.noop,
		refresh: $.noop,

		start: function (game) {
			this.game = game;
		}
	}
};

QueueSource.Player = $.inherit(QueueSource.Base, {
});

QueueSource.AI = $.inherit(QueueSource.Base, {
});
