(function (window, undefined) {

var Field = {
	rowOffset: 1,
	rows: 21,
	columns: 10,
	frameWidth: 10,
	canvas: null,
	context: null,
	fillColor: new Color(0, 0, 0),
	mergeAlpha: 0.7,
	blockSize: null,
	spacing: null,
	offset: {x: 10, y: 10},
	game: null,
	grid: null,
	width: null,
	height: null,
	fade: false,

	init: function (game) {
		this.clearGrid();

		this.game = game;
		if (game.offset) {
			this.offset = game.offset;
		}

		this.background = new Background($.resource("background"), this.offset);
		this.initCanvas();
		this.drawFrame();
	},

	clearGrid: function () {
		var row, i, j;

		this.grid = [];

		for (i = 0; i < this.rows; i++) {
			row = [];
			for (j = 0; j < this.columns; j++) {
				row.push(false);
			}
			this.grid[i] = row;
		}
	},

	copy: function (other) {
		var x, y,
		    grid = this.grid,
		    ogrid = other.grid;

		for (y = 0; y < this.rows; y++) {
			for (x = 0; x < this.columns; x++) {
				grid[y][x] = ogrid[y][x];
			}
		}
	},

	initCanvas: function () {
		var canvas = document.createElement("canvas"),
		    size = this.blockSize = Piece.blockSize,
		    spacing = this.spacing = Piece.spacing;

		canvas.width = this.width = this.columns * Piece.blockSize + Piece.spacing;
		canvas.height = this.height = (this.rows - this.rowOffset) * Piece.blockSize + Piece.spacing;
		this.context = canvas.getContext("2d");
		this.context.globalAlpha = this.mergeAlpha;
		this.clear();
		this.canvas = canvas;
	},

	filled: function (block) { return block; },

	clearRows: function (unanimated) {
		var row,
		    i, len,
		    cleared = [],
		    outline = this.game.outline,
		    grid = this.grid;

		for (i = 0, len = grid.length; i < len; i++) {
			row = grid[i];
			if (row.every(Field.filled)) {
				grid[i] = null;
				cleared.push({index: i, blocks: row});
			}
		}

		if (!unanimated) {
			this.eraseRows(cleared);
			outline.refresh = $.noop;
			outline.rebuild(grid);
			outline.refresh = outline.draw;
			outline.refresh();
		}

		grid.compact();

		while (grid.length !== this.rows) {
			row = [];
			for (i = 0; i < this.columns; i++) {
				row.push(false);
			}
			grid.unshift(row);
		}

		!unanimated && cleared.length && this.animate(cleared);
		return cleared;
	},

	animate: function (rows) {
		var game = this.game,
		    effects = game.effects;

		game.setLineClearTimer();

		effects.start(rows);
	},

	eraseRows: function (rows) {
		rows.forEach(function (row) {
			this.eraseRow(row.index);
		}, this);
	},

	eraseRow: function (index) {
		var size = Piece.blockSize,
		    x = this.offset.x,
		    y = this.offset.y + (index - this.rowOffset) * size,
		    spacing = Piece.spacing,
		    columns = this.columns;

		$.context.clearRect(x, y, size * columns + spacing, size + spacing);
	},
	
	drawFrame: function () {
		var x, y,
		    width, height,
		    thickness = this.frameWidth,
		    from = new Color(0, 0, 0),
		    to = new Color(255, 255, 255),
		    ctx = $.context,
		    color,
		    i,
		    blend;

		blend = function (from, to, percent) {
			var r = from.r + (to.r - from.r) * percent,
			    g = from.g + (to.g - from.g) * percent,
			    b = from.b + (to.b - from.b) * percent;

			return new Color(~~r, ~~g, ~~b);
		};

		x = this.offset.x - thickness / 2;
		y = this.offset.y - thickness / 2;
		width = this.width + thickness;
		height = this.height + thickness;


		ctx.save();
		ctx.lineJoin = "round";

		for (i = thickness; i >= 1; i--) {
			ctx.lineWidth = i;
			color = blend(from, to, Math.pow((thickness - i + 1) / thickness, 0.25)).toString();
			ctx.strokeStyle = color;
			ctx.strokeRect(x, y, width, height);
		}
		ctx.restore();
	},

	drawBlock: function (block, x, y, opacity) {
		var size = Piece.blockSize,
		    spacing = Piece.spacing,
		    offset = this.offset,
		    ctx = $.context,
		    dx, dy;

		y -= this.rowOffset;

		dx = x * size + offset.x;
		dy = y * size + offset.y;

		if (!this.fade || opacity === undefined) {
			ctx.drawImage(block, dx + spacing, dy + spacing);
			return;
		}

		if (opacity < 1) {
			ctx.clearRect(dx, dy, size + spacing, size + spacing);
			ctx.globalAlpha = Math.max(0, opacity);
		}

		if (opacity > 0) {
			ctx.drawImage(block, dx + spacing, dy + spacing);
		}
	},

	fadeBlocks: function () {
		var x, y,
		    rows = this.rows,
		    cols = this.columns,
		    grid = this.grid,
		    step = this.mergeAlpha / 5,
		    block;

		if (!this.fade) { return; }

		$.context.save();

		for (y = 0; y < rows; y++) {
			for (x = 0; x < cols; x++) {
				block = grid[y][x];

				if (!block) { continue; }

				if (block.fadeDelay) { block.fadeDelay--; }

				if (block.fadeDelay === 0 && block.opacity >= 0) {
					block.opacity -= step;
					this.drawBlock(block.image, x, y, block.opacity);
				}
			}
		}

		$.context.restore();
	},

	draw: function () {
		this.fadeBlocks();
	},

	redraw: function () {
		var x, y,
		    block,
		    offset = this.offset;

		this.clear();

		$.context.save();
		$.context.globalAlpha = this.mergeAlpha;

		for (y = this.rowOffset; y < this.rows; y++) {
			for (x = 0; x < this.columns; x++) {
				block = this.grid[y][x];
				block && this.drawBlock(block.image, x, y, block.opacity);
			}
		}

		$.context.restore();
	},

	clear: function () {
		$.context.clearRect(this.offset.x, this.offset.y, this.width, this.height);
	},

	applyPiece: function (piece, callback) {
		var x, y,
		    i, j,
		    shape = piece.shape,
		    len = shape.length,
		    grid = this.grid;

		outer:
		for (i = 0, y = piece.gridPosition.y; i < len; i++, y++) {
			for (j = 0, x = piece.gridPosition.x; j < len; j++, x++) {
				if (callback.call(this, shape, grid, j, i, x, y) === false) {
					break outer;
				}
			}
		}
	},

	collision: function (piece) {
		var sx, sy,
		    gx, gy,
		    shape = piece.shape,
		    len = shape.length,
		    grid = this.grid,
		    rows = this.rows,
		    cols = this.columns;

		for (sy = 0, gy = piece.gridPosition.y; sy < len; sy++, gy++) {
			for (sx = 0, gx = piece.gridPosition.x; sx < len; sx++, gx++) {
				if (shape[sy][sx] && (gy >= rows || gx < 0 || gx >= cols || (gy >= 0 && grid[gy][gx]))) {
					return true;
				}
			}
		}

		return false;
	},

	oob: function (piece) {
		var sx, sy,
		    gx, gy,
		    shape = piece.shape,
		    len = shape.length,
		    grid = this.grid,
		    rows = this.rows,
		    cols = this.columns;

		for (sy = 0, y = piece.gridPosition.y; sy < len; sy++, y++) {
			for (sx = 0, x = piece.gridPosition.x; sx < len; sx++, x++) {
				if (shape[sy][sx] && (gy >= rows || gy <= -3 || gx < 0 || gx >= cols)) {
					return true;
				}
			}
		}

		return false;
	},

	merge: function (piece) {
		var context = $.context;

		context.save();

		context.globalAlpha = this.mergeAlpha;
		this.applyPiece(piece, function (shape, grid, sx, sy, gx, gy) {
			var block;

			if (gy >= 0 && shape[sy][sx]) {
				block = {image: piece.block, color: piece.image};

				if (this.fade) {
					block.fadeDelay = 300;
					block.opacity = this.mergeAlpha;
				}

				grid[gy][gx] = block;
				this.drawBlock(piece.block, gx, gy, block.opacity);
			}
		});

		context.restore();
	},

	moveToBottom: function (piece) {
		while (!this.collision(piece)) {
			piece.moveDown();
		}
		piece.moveUp();
	}
};

window.Field = Field;
})(this);
