var GameStatus = {
	Base: {
		game: null,
		fontSize: 36,
		fontFamily: "Orbitron",
		width: 180,
		height: 175,
		offset: { x: 350, y: 420 },

		draw: $.noop,

		start: function (game) {
			var canctx;

			canctx = $.createCanvas(this.width, this.height);
			this.canvas = canctx[0];
			this.context = canctx[1];
			this.context.textAlign = "right";
			this.setFont();
			this.game = game;
		},

		clear: function () {
			var ctx = this.context;

			ctx.fillStyle = "#fff";
			ctx.fillRect(0, 0, this.width, this.height);
		},

		setFont: function (size, family) {
			size = size || this.fontSize;
			family = family || this.fontFamily;

			this.context.font = size + "px " + family;
		},

		drawValue: function (label, value, x, y) {
			var game = this.game,
			    ctx = this.context;

			ctx.fillStyle = "#000";
			ctx.fillText(label, x, y);
			ctx.fillText(value, x, y + this.fontSize + 2);
		}
	}
};

GameStatus.Score = $.inherit(GameStatus.Base, {
	draw: function () {
		var game = this.game,
		    fo = game.field.offset;

		this.clear();
		this.drawValue("Level", game.levels.level, this.width, this.fontSize);
		this.drawValue("Score", game.score.score, this.width, this.fontSize + 67);

		$.context.drawImage(this.canvas, this.offset.x + fo.x, this.offset.y + fo.y);
	}
});

GameStatus.Timer = $.inherit(GameStatus.Base, {
	elapsedToString: function (e) {
		var ms, s, m;

		m = ~~(e / 60000);
		e -= m * 60000;

		s = ~~(e / 1000);
		e -= s * 1000;

		return pad00(m) + ":" + pad00(s) + ":" + pad00(~~(e / 10));
	},

	draw: function () {
		var game = this.game,
		    ctx = this.context,
		    fo = game.field.offset;
		
		this.clear();

		this.setFont(28);
		ctx.fillStyle = "#000";
		ctx.fillText("Lines Left", this.width, 28);

		this.setFont();
		ctx.fillText(game.score.linesRemaining, this.width, 70);

		this.setFont(28);
		ctx.fillText(this.elapsedToString(game.score.elapsed), this.width, 70 + this.fontSize);

		$.context.drawImage(this.canvas, this.offset.x + fo.x, this.offset.y + fo.y);
	}
});
