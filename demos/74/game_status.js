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
		fontSize: 44, // setFont mutates this
		labelSize: 28,
		valueSize: 44,
		fontFamily: "ProFontWindows",
		fieldRelativeOffset: { x: 20, y: 420 },

		draw: $.noop,

		start: function (game) {
			this.game = game;
		},

		setFont: function (size, family) {
			var ctx = $.context;

			size = size;
			family = family || this.fontFamily;

			ctx.font = size + "px " + family;
			this.fontSize = size;
		},

		offset: function () {
			var o = this.fieldRelativeOffset,
			    fo = this.game.field.offset;

			return {
				x: o.x + fo.x,
				y: o.y + fo.y
			};
		},

		drawText: function (text, x, y, dirty) {
			var offset = this.offset(),
			    ox = offset.x, oy = offset.y,
			    ctx = $.context;

			x += ox;
			y += oy;

			ctx.fillStyle = "#eee";
			ctx.fillText(text, x, y);

			if (dirty) {
				$.DirtyRects.add(ctx, x, y - this.fontSize, ctx.measureText(text).width, this.fontSize);
			}
		}
	}
};

GameStatus.Score = $.inherit(GameStatus.Base, {
	draw: function () {
		var game = this.game,
		    fo = game.field.offset;

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

	fieldRelativeOffset: { x: 360, y: 220 },
	textColor: "#fff",

	start: function () {
		var offset;

		GameStatus.Base.start.apply(this, argsArray(arguments));

		offset = this.offset();

		RankText.x = offset.x + 20;
		RankText.y = offset.y + 150;
		RankText.createGradient($.context);
		RankText.text = this.rank;
	},

	drawLabels: function () {
		var ctx = $.context;

		ctx.save();
		ctx.textAlign = "left";

		this.setFont(this.labelSize, "ProFontWindows");
		this.drawText("Rank", 10, 10 + this.labelSize);
		this.drawText("Level", 0, 170 + this.labelSize);
		this.drawText("Time", 0, 240 + this.labelSize);

		ctx.restore();
	},

	draw: function () {
		var game = this.game,
		    newRank = this.displayMap[game.score.grade],
		    valueOffset = this.labelSize + this.valueSize;

		$.context.save();

		$.context.textAlign = "left";

		/*
		this.setFont(150);
		RankText.text = newRank;
		RankText.draw($.context);
		*/

		this.setFont(this.valueSize);
		this.drawText(game.levels.level, 0, 170 + valueOffset, true);
		this.drawText(elapsedToString(game.score.elapsed), 0, 240 + valueOffset, true);

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
