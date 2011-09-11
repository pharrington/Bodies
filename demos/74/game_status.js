(function () {

function argsArray(args) {
	return Array.prototype.slice.call(args);
}

function elapsedToString(e) {
		var ms, s, m;

		m = ~~(e / 60000);
		e -= m * 60000;

		s = ~~(e / 1000);
		e -= s * 1000;

		return pad00(m) + ":" + pad00(s) + ":" + pad00(~~(e / 10));
}

var RankText = {
	text: "",
	size: 120,
	face: "ProFontWindows",
	start: new Color(255, 255, 0),
	end: new Color(255, 255, 255),
	gradient: null,
	backGradient: null,
	offset: 5,
	x: 0,
	y: 0,

	createGradient: function (ctx) {
		var gradient, backGradient;
	       
		gradient = ctx.createLinearGradient(0, this.y - this.size, 0, this.y);

		gradient.addColorStop(0, this.start.toString());
		gradient.addColorStop(1, this.end.toString());

		backGradient = ctx.createLinearGradient(0, this.y - this.size + this.offset, 0, this.y + this.offset);
		backGradient.addColorStop(1, "rgb(255, 255, 255)");
		backGradient.addColorStop(0, "rgb(30, 30, 30)");

		this.gradient = gradient;
		this.backGradient = backGradient;
	},

	draw: function (ctx) {
		ctx.shadowColor = "#fff";
		ctx.shadowBlur = 8;
		ctx.fillStyle = this.backGradient;
		ctx.fillText(this.text, this.x + this.offset, this.y + this.offset);

		ctx.shadowBlur = 15;
		ctx.fillStyle = this.gradient;
		ctx.fillText(this.text, this.x, this.y);

		ctx.shadowBlur = 0;
	}
};
var GameStatus = {
	Base: {
		game: null,
		background: null,
		labelSize: 28,
		valueSize: 44,
		fontFamily: "ProFontWindows",
		width: 180,
		height: 150,
		offset: { x: 350, y: 420 },

		draw: $.noop,

		start: function (game) {
			var background;

			this.game = game;

			background = $.inherit(game.field.background);
			background.offset = {x: background.offset.x + this.offset.x, y: background.offset.y + this.offset.y};
			this.background = background;
		},

		clear: function () {
			var background = this.background;

			background.draw($.context, background.offset.x, background.offset.y, this.width, this.height);
		},

		setFont: function (size, family) {
			var ctx = $.context;

			size = size || this.fontSize;
			family = family || this.fontFamily;

			ctx.font = size + "px " + family;
		},

		drawValue: function (label, value, x, y) {
			var game = this.game,
			    fo = game.field.offset,
			    offset = this.offset,
			    ox = offset.x + fo.x,
			    oy = offset.y + fo.y + this.labelSize,
			    ctx = $.context;

			this.setFont(this.labelSize);
			ctx.fillStyle = "#eee";
			ctx.fillText(label, ox + x, oy + y);

			this.setFont(this.valueSize);
			ctx.fillText(value, ox + x, oy + y + this.labelSize + 2);
		}
	}
};

GameStatus.Score = $.inherit(GameStatus.Base, {
	draw: function () {
		var game = this.game,
		    fo = game.field.offset;

		this.clear();
		this.drawValue("Level", game.levels.level, 5, 0);
		this.drawValue("Score", game.score.score, 5, 70);
	}
});

GameStatus.Rank = $.inherit(GameStatus.Base, {
	displayMap: [
		"9", "8", "7", "6", "5",
		"4", "4",
		"3", "3",
		"2", "2", "2",
		"1", "1", "1",
		"S1", "S1", "S1",
		"S2",
		"S3",
		"S4", "S4", "S4",
		"S5", "S5",
		"S6", "S6",
		"S7", "S7",
		"S8", "S8",
		"S9",
		"M",
		"GM"
	],

	width: 180,
	height: 300,
	offset: { x: 360, y: 220 },
	elapsedOffset: {x: 0, y: 100},
	textColor: "#fff",

	rank: "",

	start: function () {
		var fo;

		GameStatus.Base.start.apply(this, argsArray(arguments));

		fo = this.game.field.offset;

		RankText.x = this.offset.x + fo.x + 20;
		RankText.y = this.offset.y + 150;
		RankText.createGradient($.context);
		RankText.text = this.rank;
	},

	draw: function () {
		var game = this.game,
		    newRank = this.displayMap[game.score.grade],
		    fo = game.field.offset,
		    ctx = $.context;

		this.clear();

		$.context.save();

		ctx.textAlign = "left";
		ctx.fillStyle = this.textColor;

		this.drawValue("Level", game.levels.level, 0, 170);
		this.drawValue("Time", elapsedToString(game.score.elapsed), 0, 240);

		this.setFont(this.labelSize);
		ctx.fillText("Rank", fo.x + this.offset.x + 10, fo.y + this.offset.y + this.labelSize + 10);

		this.rank = newRank;
		this.setFont(150);
		RankText.text = this.rank;
		RankText.draw($.context);

		$.context.restore();
	}
});

GameStatus.Timer = $.inherit(GameStatus.Base, {
	textColor: "#fff",

	draw: function () {
		var game = this.game,
		    ctx = $.context;
		
		this.clear();

		ctx.save();

		ctx.textAlign = "left";

		this.drawValue("Lines Left", game.score.linesLeft, 0, 0);
		this.drawValue("Time", elapsedToString(game.score.elapsed), 0, 70);

		ctx.restore();
	}
});

window.GameStatus = GameStatus;
})();
