(function (window, undefined) {
var Outline = {
	outlineColor: "#eee",
	clearColor: "#000",
	occupied: null,
	rows: null,
	columns: null,

	Cell: function () {},

	init: function (field) {
		var x, y;


		this.rowOffset = field.rowOffset;
		this.spacing = field.spacing;
		this.rows = field.rows;
		this.columns = field.columns;
		this.blockSize = field.blockSize;
		this.offset = field.offset;

		this.occupied = [];

		for (y = 0; y < this.rows; y++) {
			this.occupied[y] = [];
			for (x = 0; x < this.columns; x++) {
				this.occupied[y][x] = new Outline.Cell;
			}
		}
	},

	merge: function (piece) {
		var sx, sy,
		    shape = piece.shape,
		    gx = piece.gridPosition.x,
		    gy = piece.gridPosition.y,
		    x = gx, y = gy,
		    occupied = this.occupied,
		    adjacent,
		    cell;

		this.refresh(true);
		for (sy = 0; sy < 4 && y < this.rows; sy++, y++) {
			if (y < 0) { continue; }

			for (sx = 0, x = gx; sx < 4 && x < this.columns; sx++, x++) {
				if (!shape[sy] || !shape[sy][sx]) { continue; }

				cell = occupied[y][x];

				this._mergeTop(cell, x, y);
				this._mergeRight(cell, x, y);
				this._mergeBottom(cell, x, y);
				this._mergeLeft(cell, x, y);
			}
		}
	},

	rebuild: function (grid) {
		var x, y,
		    cell;

		this.refresh(true);

		for (y = 0; y < this.rows; y++) {
			for (x = 0; x < this.columns; x++) {
				cell = this.occupied[y][x];

				cell.bottom = cell.top = cell.left = cell.right = false;
			}
		}

		for (y = 0; y < this.rows; y++) {

			if (!grid[y]) { continue; }

			for (x = 0; x < this.columns; x++) {
				if (grid[y][x]) {
					cell = this.occupied[y][x];

					this._mergeTop(cell, x, y);
					this._mergeRight(cell, x, y);
					this._mergeBottom(cell, x, y);
					this._mergeLeft(cell, x, y);
				}
			}
		}
	},

	_mergeTop: function (cell, x, y) {
		var adjacent;

		if (y > 0) {
			adjacent = this.occupied[y - 1][x];
			if (adjacent.bottom) {
				adjacent.bottom = false;
			} else {
				cell.top = true;
			}
		}
	},

	_mergeRight: function (cell, x, y) {
		var adjacent;

		if (x < this.columns - 1) {
			adjacent = this.occupied[y][x + 1];
			if (adjacent.left) {
				adjacent.left = false;
			} else {
				cell.right = true;
			}
		}
	},

	_mergeBottom: function (cell, x, y) {
		var adjacent;

		if (y < this.rows - 1) {
			adjacent = this.occupied[y + 1][x];
			if (adjacent.top) {
				adjacent.top = false;
			} else {
				cell.bottom = true;
			}
		}
	},

	_mergeLeft: function (cell, x, y) {
		var adjacent;

		if (x > 0) {
			adjacent = this.occupied[y][x - 1];
			if (adjacent.right) {
				adjacent.right = false;
			} else {
				cell.left = true;
			}
		}
	},

	draw: function (clear) {
		var x, y,
		    dx, dy,
		    ox = this.offset.x,
		    oy = this.offset.y,
		    rowOffset = this.rowOffset,
		    occupied = this.occupied,
		    cell,
		    spacing = this.spacing,
		    size = this.blockSize,
		    hspacing = spacing / 2,
		    top, left, bottom, right,
		    context = $.context;

		context.save();

		context.lineCap = "square";
		context.lineWidth = spacing;

		if (clear) {
			context.strokeStyle = this.clearColor;
		} else {
			context.strokeStyle = this.outlineColor;
		}

		for (y = rowOffset, dy = oy; y < this.rows; y++, dy += size) {
			for (x = 0, dx = ox; x < this.columns; x++, dx += size) {
				cell = occupied[y][x];

				top = dy + hspacing;
				bottom = top + size;
				left = dx + hspacing;
				right = left + size;

				context.beginPath();

				if (cell.top) {
					context.moveTo(left, top);
					context.lineTo(right, top);
				}

				if (cell.right) {
					context.moveTo(right, top);
					context.lineTo(right, bottom);
				}

				if (cell.bottom) {
					context.moveTo(right, bottom);
					context.lineTo(left, bottom);
				}

				if (cell.left) {
					context.moveTo(left, bottom);
					context.lineTo(left, top);
				}

				context.closePath();
				context.stroke();
			}
		}

		context.restore();
	},

	refresh: $.noop
};

$.extend(Outline.Cell.prototype, {top: false, right: false, bottom: false, left: false});

window.Outline = Outline;
})(this);
