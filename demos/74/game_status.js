(function (window, undefined) {

var fontface = "\"Press Start 2P\"";

function argsArray(args) {
	return Array.prototype.slice.call(args);
}

function elapsedToString(e) {
		var ms, s, m;

		m = ~~(e / 60000);
		e -= m * 60000;

		s = ~~(e / 1000);
		e -= s * 1000;

		return Util.pad00(m) + ":" + Util.pad00(s) + ":" + Util.pad00(~~(e / 10));
}

var ColorFlasher = {
	duration: 500,
	color: "#eee",
	baseColor: "#eee",
	flashColor: "#00d",
	interval: 20,
	elapsed: 0,
	lastUpdate: 0,

	start: function () {
		this.elapsed = 0;
		this.lastUpdate = 0;
		this.color = this.baseColor;
	},

	update: function (elapsed) {
		if (this.elapsed >= this.duration) {
			this.color = this.baseColor;
			return;
		}

		this.elapsed += elapsed;

		if (this.elapsed - this.lastUpdate >= this.interval) {
			this.color = this.flashColor;
			this.lastUpdate = this.elapsed;
		} else {
			this.color = this.baseColor;
		}
	}
};

var GameStatus = {
	Base: {
		game: null,
		fontSize: 44, // setFont mutates this
		labelSize: 16,
		valueSize: 28,
		fontFamily: fontface,
		fieldRelativeOffset: { x: 20, y: 450 },

		draw: $.noop,
		drawLabels: $.noop,

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

		drawText: function (text, x, y, dirty, color) {
			var offset = this.offset(),
				ox = offset.x, oy = offset.y,
				ctx = $.context;

			if (!color) {
				color = "#eee";
			}

			x += ox;
			y += oy;

			ctx.fillStyle = color;
			ctx.fillText(text, x, y);

			if (dirty) {
				$.DirtyRects.add(ctx, x - 1, y - this.fontSize, ctx.measureText(text).width + 1, this.fontSize);
			}
		}
	}
};

GameStatus.Score = $.inherit(GameStatus.Base, {
	fieldRelativeOffset: { x: 360, y: 250 },
	drawLabels: function () {
		var ctx = $.context;

		ctx.save();
		ctx.textAlign = "left";

		this.setFont(this.labelSize, fontface);
		this.drawText("Level", 0, 170 + this.labelSize);
		this.drawText("Score", 0, 230 + this.labelSize);
		this.drawText("Goal", 0, 290 + this.labelSize);

		ctx.restore();
	},

	draw: function (elapsed) {
		var game = this.game,
		    valueOffset = this.labelSize + this.valueSize + 8,
		    levelSystem = game.levels;

		$.context.save();
		$.context.textAlign = "left";

		ColorFlasher.update(elapsed);

		this.setFont(this.valueSize);
		this.drawText(levelSystem.level, 0, 170 + valueOffset, true);
		this.drawText(game.score.score, 0, 230 + valueOffset, true, ColorFlasher.color);
		this.drawText(levelSystem.goal() - levelSystem.clearedLines, 0, 290 + valueOffset, true);

		$.context.restore();
	}
});

GameStatus.Timer = $.inherit(GameStatus.Base, {
	fieldRelativeOffset: { x: 360, y: 250 },

	drawLabels: function () {
		var ctx = $.context;

		ctx.save();
		ctx.textAlign = "left";

		this.setFont(this.labelSize, fontface);
		this.drawText("Goal", 0, 170 + this.labelSize);
		this.drawText("Time", 0, 230 + this.labelSize);

		ctx.restore();
	},

	draw: function (elapsed) {
		var game = this.game,
		    valueOffset = this.labelSize + this.valueSize + 8,
		    scoreSystem = game.score;

		$.context.save();
		$.context.textAlign = "left";

		ColorFlasher.update(elapsed);

		this.setFont(this.valueSize);
		this.drawText(scoreSystem.goal(), 0, 170 + valueOffset, true, ColorFlasher.color);
		this.drawText(elapsedToString(scoreSystem.elapsed), 0, 230 + valueOffset, true);

		$.context.restore();
	}
});

var RankText = {
	text: "",
	size: 120,
	face: fontface,
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

		this.setFont(this.labelSize, fontface);
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

window.GameStatus = GameStatus;
window.ColorFlasher = ColorFlasher;

})(this);
