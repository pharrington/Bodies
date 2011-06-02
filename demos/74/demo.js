/* Note: ~~ (double bitwise invert) is used to round floats towards zero
 * its only trivially faster than Math.floor for positive numbers, but easier to type :\
 */

Array.prototype.last = function () {
	return this[this.length - 1];
};

Array.prototype.compact = function () {
	var i = 0,
	    val;

	while (i < this.length) {
		val = this[i];
		if (val === null || val === undefined) {
			this.splice(i, 1);
		} else {
			i++;
		}
	}

	return this;
};

$.extend = function (base, attrs) {
	var prop;

	for (prop in attrs) {
		if (attrs.hasOwnProperty(prop)) {
			base[prop] = attrs[prop];
		}
	}

	return base;
};

$.timed = function (obj, elapsed, callback, complete) {
	var progress;

	if (!obj.duration) {
		progress = 1;
	} else {
		obj.elapsed += elapsed;
		progress = obj.elapsed / obj.duration;
	}

	if (progress < 1) {
		callback.call(obj, progress, elapsed);
	} else {
		obj.elapsed = 0;
		complete.call(obj);
	}
};

function cycle(array, index) {
	var len = array.length;

	index %= len;
	if (index < 0) { index += len }

	return array[index];
}

var Piece = {
	Direction: { Left: -1, Right: 1},
	Rotation: { CCW: -2, CW: 2},
	shapeIndex: 0,
	spriteIndex: 0,
	sprites: null,
	shape: null,
	blockSize: 33,
	imageSize: 31,
	spacing: 2,
	spacingColor: "#444",
	shapeSize: null,
	offset: null,
	gridPosition: null,
	delta: 0,

	init: function () {
		var x = this.shapes[0].length === 2 ? 4 : 3,
		    y = this.shapes[0].length === 3 ? -1 : 0;

		this.gridPosition = {x: x, y: y};
	},

	initSprites: function () {
		this.sprites = [];
		this.shapes.forEach(this.createSprite, this);
		this.offset = Field.offset;
		this.setShape();
	},

	rotate: function (rotation) {
		switch (rotation) {
		case Piece.Rotation.CCW:
			this.shapeIndex--;
			break;
		case Piece.Rotation.CW:
			this.shapeIndex++;
			break;
		}

		this.shapeIndex %= this.shapes.length;
		this.setShape();
	},

	rotateCW: function () { this.rotate(Piece.Rotation.CW); },
	rotateCCW: function () { this.rotate(Piece.Rotation.CCW); },

	setShape: function () {
		var shapeIndex = this.shapeIndex;

		this.shape = cycle(this.shapes, shapeIndex);
		this.sprite = cycle(this.sprites, shapeIndex);
	},

	createSprite: function (shape) {
		var len = shape.length,
		    spacing = Piece.spacing,
		    fillSize = this.imageSize + spacing * 2,
		    width = this.imageSize * len + spacing * (len + 1),
		    height = width,
		    sprite,
		    context,
		    y, x,
		    i, j;

		this.shapeSize = len;

		sprite = new $.Sprite(width, height);
		context = sprite.oContext;
		context.fillStyle = this.spacingColor;

		for (i = 0; i < len; i++) {
			y = i * this.blockSize;
			for (j = 0; j < len; j++) {
				x = j * this.blockSize;
				if (shape[i][j]) {
					context.fillRect(x, y, fillSize, fillSize);
					context.drawImage(this.block, x + spacing, y + spacing);	
				}
			}
		}

		sprite.copyPixels();
		this.sprites.push(sprite);
	},

	moveDown: function () {
		this.gridPosition.y++;
	},

	moveUp: function () {
		this.gridPosition.y--;
		this.update(0);
	},

	move: function (direction) {
		switch (direction) {
		case Piece.Direction.Left:
			this.gridPosition.x--;
			break;
		case Piece.Direction.Right:
			this.gridPosition.x++;
			break;
		}
	},

	moveLeft: function () { this.move(Piece.Direction.Left); },
	moveRight: function () { this.move(Piece.Direction.Right); },

	update: function (dt) {
		var g = this.gridPosition,
		    offset = this.offset,
		    size = this.blockSize,
		    blocks,
		    x, y;

		if (dt) {
			this.delta += dt * this.velocity;
			blocks = ~~this.delta;

			this.delta -= blocks;

			while (!Game.field.collision(this) && blocks--) {
				g.y++;
			}

			if (Game.field.collision(this)) {
				g.y--;
			}
		}

		y = (g.y - Field.rowOffset) * size;
		x = g.x * size;

		this.velocity = Game.velocity;
		this.sprite.moveTo(x + offset.x, y + offset.y);
	},

	draw: function () {
		this.sprite.draw();
	}
};

var Shapes = {
	PieceList: ["I", "T", "O", "Z", "S", "L", "J"],
	I: $.inherit(Piece, {
		image: "orange",
		shapes: [
				[[0, 0, 0, 0],
				 [1, 1, 1, 1],
				 [0, 0, 0, 0],
				 [0, 0, 0, 0]],
				[[0, 0, 1, 0],
				 [0, 0, 1, 0],
				 [0, 0, 1, 0],
				 [0, 0, 1, 0]]
			]
	}),

	T: $.inherit(Piece, {
		image: "blue",
		shapes: [
				[[0, 0, 0],
				 [1, 1, 1],
				 [0, 1, 0]],
				[[0, 1, 0],
				 [1, 1, 0],
				 [0, 1, 0]],
				[[0, 0, 0],
				 [0, 1, 0],
				 [1, 1, 1]],
				[[0, 1, 0],
				 [0, 1, 1],
				 [0, 1, 0]]
			]
	}),

	O: $.inherit(Piece, {
		image: "yellow",
		shapes: [
				[[1, 1],
				 [1, 1]]
			]
	}),

	Z: $.inherit(Piece, {
		image: "red",
		shapes: [
				[[0, 0, 0],
				 [1, 1, 0],
				 [0, 1, 1]],
				[[0, 0, 1],
				 [0, 1, 1],
				 [0, 1, 0]]
			]
	}),

	S: $.inherit(Piece, {
		image: "cyan",
		shapes: [
				[[0, 0, 0],
				 [0, 1, 1],
				 [1, 1, 0]],
				[[1, 0, 0],
				 [1, 1, 0],
				 [0, 1, 0]]
		]
	}),

	L: $.inherit(Piece, {
		image: "green",
		shapes: [
				[[0, 0, 0],
				 [1, 1, 1],
				 [1, 0, 0]],
				[[1, 1, 0],
				 [0, 1, 0],
				 [0, 1, 0]],
				[[0, 0, 0],
				 [0, 0, 1],
				 [1, 1, 1]],
				[[0, 1, 0],
				 [0, 1, 0],
				 [0, 1, 1]]
			]
	}),

	J: $.inherit(Piece, {
		image: "purple",
		shapes: [
				[[0, 0, 0],
				 [1, 1, 1],
				 [0, 0, 1]],
				[[0, 1, 0],
				 [0, 1, 0],
				 [1, 1, 0]],
				[[0, 0, 0],
				 [1, 0, 0],
				 [1, 1, 1]],
				[[0, 1, 1],
				 [0, 1, 0],
				 [0, 1, 0]]
			]
	})
};

(function setShapeCodes() {
	var i, len,
	    shape,
	    list = Shapes.PieceList;

	for (i = 0, len = list.length; i < len; i++) {
		shape = Shapes[list[i]];
		if (shape) { shape.code = i; }
	}
})();

var Field = {
	rowOffset: 1,
	rows: 21,
	columns: 10,
	canvas: null,
	context: null,
	fillColor: new Color(10, 10, 10),
	mergeAlpha: 0.7,
	blockSize: null,
	spacing: null,
	width: null,
	height: null,
	offset: {x: 0, y: 0},
	grid: null,

	init: function () {
		var i, j,
		    row;

		this.grid = [];

		for (i = 0; i < this.rows; i++) {
			row = [];
			for (j = 0; j < this.columns; j++) {
				row.push(false);
			}
			this.grid[i] = row;
		}
		this.initCanvas();
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

		canvas.width = this.width = this.columns * size + spacing;
		canvas.height = this.height = (this.rows - this.rowOffset) * size + spacing;
		this.context = canvas.getContext("2d");
		this.context.fillStyle = this.fillColor.toString();
		this.context.fillRect(0, 0, this.width, this.height);
		this.canvas = canvas;
	},

	filled: function (block) { return block; },

	clearRows: function (unanimated) {
		var row,
		    i, len,
		    cleared = [],
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
			Game.outline.rebuild(grid);
			Game.outline.refresh();
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
		var game = Game,
		    effects = game.effects;

		game.setLineClearTimer();

		effects.field = this;
		effects.rows = rows;
		effects.init();
	},

	eraseRows: function (rows) {
		var $this = this;

		rows.forEach(function (row) {
			$this.eraseRow(row.index);
		});
	},

	eraseRow: function (index) {
		var size = Piece.blockSize,
		    y = (index - this.rowOffset) * size,
		    spacing = Piece.spacing,
		    columns = this.columns;

		this.context.fillRect(0, y + spacing, size * columns + spacing, size);
	},
	
	drawBlock: function (block, x, y) {
		var size = Piece.blockSize,
		    spacing = Piece.spacing;

		y -= this.rowOffset;
		this.context.fillRect(x * size, y * size, size + spacing, size + spacing);
		this.context.drawImage(block, x * size + spacing, y * size + spacing);
	},

	draw: function () {
		$.context.drawImage(this.canvas, this.offset.x, this.offset.y);
	},

	redraw: function () {
		var x, y,
		    block,
		    context = this.context;

		context.fillRect(0, 0, this.width, this.height);
		context.save();

		context.globalAlpha = this.mergeAlpha;
		context.fillStyle = "#000";

		for (y = this.rowOffset; y < this.rows; y++) {
			for (x = 0; x < this.columns; x++) {
				block = this.grid[y][x];
				block && this.drawBlock(block.image, x, y);
			}
		}

		context.restore();
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
		var context = this.context;

		context.save();

		context.fillStyle = "#000";
		context.globalAlpha = this.mergeAlpha;
		this.applyPiece(piece, function (shape, grid, sx, sy, gx, gy) {
			if (gy >= 0 && shape[sy][sx]) {
				grid[gy][gx] = {image: piece.block, color: piece.image};
				this.drawBlock(piece.block, gx, gy);
			}
		});

		context.restore();
	}
};

function setPixel(data, idx, color) {
	data[idx] = color.r;
	data[idx + 1] = color.g;
	data[idx + 2] = color.b;
	data[idx + 3] = 255;
}

var Outline = {
	outlineColor: "#eee",
	occupied: null,
	rows: null,
	columns: null,

	Cell: function () {},

	merge: function (piece) {
		var sx, sy,
		    shape = piece.shape,
		    gx = piece.gridPosition.x,
		    gy = piece.gridPosition.y,
		    x = gx, y = gy,
		    occupied = this.occupied,
		    adjacent,
		    cell;

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

	init: function (field) {
		var canvas = document.createElement("canvas"),
		    context,
		    x, y;

		canvas.width = this.width = field.width;
		canvas.height = this.height = field.height;

		context = canvas.getContext("2d");
		context.lineCap = "square";
		context.strokeStyle = this.outlineColor;
		context.lineWidth = this.spacing = field.spacing;

		this.rowOffset = field.rowOffset;
		this.rows = field.rows;
		this.columns = field.columns;
		this.blockSize = field.blockSize;
		this.offset = field.offset;
		this.canvas = canvas;
		this.context = context;

		this.occupied = [];

		for (y = 0; y < this.rows; y++) {
			this.occupied[y] = [];
			for (x = 0; x < this.columns; x++) {
				this.occupied[y][x] = new Outline.Cell;
			}
		}
	},

	refresh: function () {
		var x, y,
		    dx, dy,
		    rowOffset = this.rowOffset,
		    context = this.context,
		    occupied = this.occupied,
		    cell,
		    spacing = this.spacing,
		    size = this.blockSize,
		    hspacing = spacing / 2,
		    top, left, bottom, right;

		context.clearRect(0, 0, this.width, this.height);

		for (y = rowOffset, dy = 0; y < this.rows; y++, dy += size) {
			for (x = 0, dx = 0; x < this.columns; x++, dx += size) {
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
	},

	draw: function () {
		$.context.drawImage(this.canvas, this.offset.x, this.offset.y);
	}
};

$.extend(Outline.Cell.prototype, {top: false, right: false, bottom: false, left: false});

var Game = {
	elapsed: 0,
	shapes: ["I", "T", "O", "Z", "S", "L", "J"],
	currentPiece: null,
	groundedTimer: null,
	spawnTimer: null,
	velocity: null,

	groundedTimeout: 500,
	lineClearDelay: 200,
	spawnDelay: 100,
	startVelocity: 0.75 / 1000,
	velocityIncrement: 0.25 / 1000,
	/*
	spawnDelay: 0,
	velocityIncrement: 0,
	startVelocity: 0.75 / 1000 + .025,
	*/
	keyHoldDelay: 150, // DAS (Delayed Auto Shift)
	keyHoldInterval: 18, // ARR (Auto Repeat Rate)
	refreshInterval: 15,
	dropped: false,

	clearedRows: 0,
	level: 0,

	queueSource: null,
	inputSource: null,
	stateSinks: null,

	effects: null,

	Config: {
		Left: 65,
		Right: 68,
		SoftDrop: 83,
		HardDrop: 87,
		RotateCW: 74,
		RotateCCW: 72,
		Pause: 27
	},

	mouseDown: $.noop,

	checkGrounded: function () {
		var field = this.field,
		    piece = this.currentPiece,
		    dropped = this.dropped;

		piece.moveDown();
		if (field.collision(piece)) {
			if (dropped) {
				this.clearGroundedTimer();
				piece.moveUp();
				this.endPiece();

				return;

			} else if (!this.groundedTimer) {
				this.groundedTimer = setTimeout(this.endPiece.bind(this), this.groundedTimeout);
			}
		} else {
			this.clearGroundedTimer();
		}
		piece.moveUp();
	},

	clearSpawnTimer: function () {
		this.spawnTimer && clearTimeout(this.spawnTimer);
		this.spawnTimer = null;
	},

	clearGroundedTimer: function () {
		this.groundedTimer && clearTimeout(this.groundedTimer);
		this.groundedTimer = null;
	},

	checkGameOver: function () {
		var gameover = false;

		if (this.field.collision(this.currentPiece)) {
			gameover = true;
			$.refresh(this.gameOver.bind(this));
		}
		return gameover;
	},

	ejectUp: function (piece) {
		var field = this.field;

		while (field.collision(piece) && piece.gridPosition.y >= -2) {
			piece.moveUp();
		}
	},

	nextPiece: function () {
		var gameOver,
		    shape;

		shape = Shapes[this.queueSource.next()];
		if (shape) {
			this.currentPiece = $.inherit(shape);
			this.currentPiece.init();
			this.currentPiece.velocity = this.velocity;
			gameOver = this.checkGameOver();
		} else {
			gameOver = true;
		}

		if (!gameOver) {
			this.inputSource.nextPiece();
		}

		this.stateSinks && this.stateSinks.forEach(function (s) {
			s.nextPiece();
		});

		return gameOver;
	},

	gameOver: function () {
		setTimeout(function () {
			$.register(ConfigMenu);
		}, 2000);
	},

	spawnNext: function () {
		$.keyHold($.noop);
		$.refresh($.noop, this.refreshInterval);

		if (!this.nextPiece()) {
			this.setSpawnTimer();
		}
	},

	setSpawnTimer: function () {
		this.spawnTimer = setTimeout(this.endSpawnNext.bind(this), this.spawnDelay);
	},

	setLineClearTimer: function () {
		this.currentPiece = null;
		this.clearSpawnTimer();
		this.spawnTimer = setTimeout(this.endLineClear.bind(this), this.lineClearDelay);
	},

	endLineClear: function () {
		this.spawnNext();
		this.outline.rebuild(this.field.grid);
		this.outline.refresh();
		this.field.redraw();
		this.endSpawnNext();
	},

	endSpawnNext: function () {
		this.spawnTimer = null;
		!this.dropped && this.drawPiecePreview();
		$.register(this);
	},

	endPiece: function () {
		var cleared;

		this.velocity += this.velocityIncrement;
		this.groundedTimer = null;

		this.outline.merge(this.currentPiece);
		this.field.merge(this.currentPiece);

		cleared = this.field.clearRows();
		this.clearedRows += cleared.length;

		this.inputSource.endPiece();
		this.currentPiece && this.stateSinks && this.stateSinks.forEach(function (s) {
			s.endPiece();
		});

		if (!cleared.length) {
			this.spawnNext();
			this.outline.refresh();
		} else {
			//this.outline.rebuild(this.field.grid);
		}

	},

	hardDrop: function () {
		var piece = this.currentPiece;

		if (!piece) { return; }

		piece.velocity = 10;
		this.dropped = true;
	},

	tryMove: function (direction) {
		var field = this.field,
		    piece = this.currentPiece;

		if (!piece) { return; }

		piece.move(direction);
		if (field.collision(piece)) {
			direction === Piece.Direction.Left ? piece.moveRight() : piece.moveLeft();
		}
	},

	tryRotation: function (rotation) {
		var field = this.field,
		    piece = this.currentPiece;

		if (!piece) { return; }

		piece.rotate(rotation);

		/* try to eject the piece if a rotation collides with the field */
		if (field.collision(piece)) {
			piece.moveLeft();

			if (field.collision(piece)) {
				piece.moveRight();
				piece.moveRight();

				if (field.collision(piece)) {
					piece.moveLeft();
					rotation === Piece.Rotation.CW ? piece.rotateCCW() : piece.rotateCW();
				}
			}
		}
	},

	drawGame: function (piece) {
		this.field.draw();
		this.outline.draw();

		if (piece && !this.spawnTimer) {
			piece.draw();
		}
	},

	drawPiecePreview: function () {
		var blockSize = Piece.blockSize,
		    size = blockSize * 6,
		    x = blockSize * 11,
		    y = 5,
		    shape = this.queueSource.queue[0],
		    piece,
		    offset;

		if (!shape) { return; }

		piece = $.inherit(Shapes[this.queueSource.queue[0]]),
		offset = (6 - piece.shape.length) / 2 * blockSize;
		piece.sprite.moveTo(x + offset, y + offset);


		$.context.strokeStyle = "#000";
		$.context.lineWidth = 10;
		$.context.clearRect(x, y, size, size);
		$.context.strokeRect(x, y, size, size);
		piece.draw();
	},

	loaded: function () {
		Fireworks.particleSystem = new ParticleSystem();
		Game.shapes.forEach(initBlock);
		ConfigMenu.init();
	},

	resetScore: function () {
		this.clearedRows = 0;
		this.level = 0;
	},

	addStateSink: function (sink) {
		if (!this.stateSinks) {
			this.stateSinks = [];
		}

		this.stateSinks.push(sink);
	},

	setInputSource: function (is) {
		this.inputSource = is;
		is.game = this;
		this.keyHold = is.keyHold;
		this.keyPress = is.keyPress;
	},

	setQueueSource: function (qs) {
		this.queueSource = qs;
	},

	start: function () {
		var game = this;

		this.resetScore();
		this.velocity = this.startVelocity;
		this.field = $.inherit(Field);
		this.field.init();

		this.inputSource.start(this);
		this.queueSource.start(this);
		this.stateSinks && this.stateSinks.forEach(function (s) {
			s.start(game);
		});

		this.drawPiecePreview();
		this.nextPiece();

		this.outline = $.inherit(Outline);
		this.outline.init(this.field);
	},

	countdown: function (elapsed, now) {
		this.duration = 1000;

		$.timed(this, elapsed, function (progress) {
		}, function () {
			Game.drawPiecePreview();
			$.register(this);
		});
		this.field.draw();
	},

	dropPiece: function () {
		var piece = this.currentPiece;

		if (!piece) { return; }

		piece.velocity += .075;
	},

	refresh: function (elapsed, now) {
		var currentPiece = this.currentPiece;

		if (currentPiece) {
			this.inputSource.refresh(elapsed, now);

			currentPiece.update(elapsed);

			this.stateSinks && this.stateSinks.forEach(function (s) {
				s.refresh(elapsed, now);
			});
			this.checkGrounded();
		}

		this.drawGame(currentPiece);
		this.effects.refresh(elapsed);
		this.dropped = false;
	},

	pause: function () {
		$.register(PauseMenu);
	}
};

var PauseMenu = {
	refresh: $.noop,
	keyHold: $.noop,
	keyPress: function (key) {
		if (key === Game.Config.Pause) {
			$.register(Game);
		}
	}
};

var KeyUpdate = {
	refreshInterval: 100,

	keyHold: $.noop,

	keyPress: function (key) {
		var c = this.control;

		c.value(key);
		c.redraw();
		$.register(ConfigMenu);
	},

	refresh: $.noop
}

var Control = {
	init: function () {
		var sprite;

		sprite = this.sprite = new $.Sprite(this.width, this.height);
		sprite.oContext.font = this.font = "bold 25px courier";
		sprite.oContext.fillStyle = "#000";
		sprite.moveTo(this.x, this.y);
		this.redraw();
	},

	redraw: $.noop,

	clear: function () {
		this.sprite.oContext.clearRect(0, 0, this.width, this.height);
	},

	contains: function (x, y) {
		var left = this.x,
		    top = this.y,
		    right = left + this.width,
		    bottom = top + this.height;

		return  x >= left && x <= right &&
			y >= top && y <= bottom;
	},

	mouseDown: function () {
		this.trigger();
	},

	draw: function () {
		this.sprite.draw();
	}
};

var LabelControl = $.inherit(Control, {
	redraw: function () {
		this.clear();
		this.drawLabel();
	},

	drawLabel: function () {
		var sprite = this.sprite;

		sprite.oContext.fillText(this.label, 5, 25);
		sprite.copyPixels();
	}
});

var BindingControl = $.inherit(LabelControl, {
	value: function (v) {
		var o = this.object,
		    p = this.property;

		if (v === undefined) {
			return o[p];
		}

		o[p] = v;
		return v;
	},

	trigger: function () {
		KeyUpdate.control = this;
		$.register(KeyUpdate);
	},

	redraw: function () {
		LabelControl.redraw.call(this);
		this.drawValue();
	},

	drawValue: function () {
		var c = document.createElement("canvas"),
		    width,
		    v = this.convertValue(),
		    ctx = c.getContext("2d"),
		    sprite = this.sprite;

		ctx.font = this.font;
		width = ctx.measureText(v).width;
		sprite.oContext.fillText(v, this.width - width - 5, 25);
		sprite.copyPixels();
	},

	convertValue: function () {
		var v = this.value(),
		    map = {
			32: "Space",
			37: "Left",
			38: "Up",
			39: "Right",
			40: "Down",
			192: "`"
		    };

		if (map[v]) {
			v = map[v];
		} else {
			v = String.fromCharCode(v);
		}

		return v;
	},
});

var ConfigMenu = {
	refreshInterval: 100,
	options: [
		"Left", "Left",
		"Right", "Right",
		"Soft Drop", "SoftDrop",
		"Sonic Drop", "HardDrop",
		"Rotate Left", "RotateCCW",
		"Rotate Right", "RotateCW"
	],

	controls: [],

	init: function () {
		var i, len,
		    x = 20, y = 50,
		    width = 300, height = 30,
		    options = this.options,
		    controls = this.controls,
		    button,
		    control;

		for (i = 0, len = options.length; i < len; i += 2) {
			control = $.inherit(BindingControl, {
				label: options[i],
				property: options[i + 1],
				object: Game.Config,
				x: x,
				y: y,
				width: width,
				height: height
			});
			control.init();
			controls.push(control);

			y += height + 5;
		}

		button = $.inherit(LabelControl, {
			label: "Play game",
			x: x + 80,
			y: controls.last().y + 50,
			width: width,
			height: height,
			trigger: startGame
		});
		button.init();

		controls.push(button);
	},

	clear: function () {
		$.context.clearRect(0, 0, $.width, $.height);
	},

	refresh: function () {
		var i, len,
		    controls = this.controls,
		    control;

		this.clear();

		for (i = 0, len = controls.length; i < len; i++) {
			controls[i].draw();
		}
	},

	mouseDown: function (x, y) {
		var i, len,
		    controls = this.controls,
		    control;

		for (i = 0, len = controls.length; i < len; i++) {
			control = controls[i];

			if (control.contains(x, y)) {
				control.mouseDown();
				break;
			}
		}
	},

	keyHold: $.noop,

	keyPress: function (key) {
	}
};

function loadImages() {
	["orange", "red", "yellow", "green", "cyan", "blue", "purple"].forEach(function (color) {
		$.loadImage(color, color + ".gif");
	});
}

function initBlock(piece) {
	var piece = Shapes[piece];

	piece.block = document.createElement("canvas");
	piece.block.width = piece.block.height = Piece.blockSize;
	piece.context = piece.block.getContext("2d");
	piece.context.drawImage($.resource(piece.image), 0, 0);
	piece.initSprites();
}

function startGame() {
	Game.start();
	$.refresh(Game.countdown.bind(Game));
}

addEventListener("load", function () {
	$.init(600, 800);
	loadImages();
	$.loaded(Game.loaded);
	Game.setQueueSource(QueueSource.TGM);
	Game.setInputSource(InputSource.Player);
	Game.addStateSink(StateSink.Replay);
	Game.effects = Fireworks;
	$.start();
	$.register(ConfigMenu);
}, false);