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

function pad00(str) {
	str = "" + str;
	while (str.length < 2) {
		str = "0" + str;
	}

	return str;
}

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
	game: null,
	delta: 0,

	init: function (game) {
		var x = this.shapes[0].length === 2 ? 4 : 3,
		    y = this.shapes[0].length === 3 ? -1 : 0;

		this.gridPosition = {x: x, y: y};
		this.game = game;
		this.offset = game.field.offset;
	},

	reset: function () {
		this.init(this.game);
		this.shapeIndex = 0;
		this.setShape();
	},

	initSprites: function () {
		this.sprites = [];
		this.shapes.forEach(this.createSprite, this);
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
		    game = this.game,
		    field = game.field,
		    x, y;

		if (dt) {
			this.delta += this.velocity;
			blocks = ~~this.delta;

			this.delta -= blocks;

			while (!field.collision(this) && blocks--) {
				g.y++;
			}

			if (field.collision(this)) {
				g.y--;
			}
		}

		y = (g.y - field.rowOffset) * size;
		x = g.x * size;

		this.velocity = game.velocity;
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
	game: null,
	grid: null,

	init: function (game) {
		var i, j,
		    row;

		this.game = game;
		this.grid = [];

		for (i = 0; i < this.rows; i++) {
			row = [];
			for (j = 0; j < this.columns; j++) {
				row.push(false);
			}
			this.grid[i] = row;
		}

		if (game.offset) {
			this.offset = game.offset;
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
			outline.rebuild(grid);
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

		effects.play(rows);
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
		    offset = this.offset,
		    context = this.context;

		this.clear();
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

	clear: function () {
		this.context.fillRect(0, 0, this.width, this.height);
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
	},

	moveToBottom: function (piece) {
		while (!this.collision(piece)) {
			piece.moveDown();
		}
		piece.moveUp();
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
	duration: 0,
	elapsed: 0,
	shapes: ["I", "T", "O", "Z", "S", "L", "J"],
	currentPiece: null,
	groundedTimer: null,
	spawnTimer: null,
	velocity: null,
	ghostPiece: true,

	groundedTimeout: 30,
	lineClearDelay: 10,
	spawnDelay: 6,
	startVelocity: 0.012,
	timers: null,

	countdownDelay: ~~((1000 / 17) * 3),
	keyHoldDelay: 180, // DAS (Delayed Auto Shift)
	keyHoldInterval: 10, // ARR (Auto Repeat Rate)
	refreshInterval: 16,
	dropped: false,

	inputBuffer: 0,

	heldPiece: null,
	score: null,
	levels: null,
	queueSource: null,
	inputSource: null,
	inputSinks: null,

	dropFX: null,
	effects: null,

	gameStatus: null,

	Config: {
		Left: 65,
		Right: 68,
		SoftDrop: 83,
		HardDrop: 87,
		Hold: 32,
		RotateCW: 74,
		RotateCCW: 72,
		Pause: 27
	},

	tick: $.noop,
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
				this.groundedTimer = this.setTimeout(this.endPiece.bind(this), this.groundedTimeout);
			}
		} else {
			this.clearGroundedTimer();
		}
		piece.moveUp();
	},

	clearSpawnTimer: function () {
		this.spawnTimer && this.clearTimeout(this.spawnTimer);
		this.spawnTimer = null;
	},

	clearGroundedTimer: function () {
		this.groundedTimer && this.clearTimeout(this.groundedTimer);
		this.groundedTimer = null;
	},

	checkGameOver: function () {
		var gameover = false;

		if (this.field.collision(this.currentPiece)) {
			gameover = true;
			this.gameOver();
		}
		return gameover;
	},

	checkWon: function () {
		var won = false;

		if (this.score.won()) {
			won = true;
			this.won();
		}

		return won;
	},

	winCallback: function () {
		this.field.clear();
		this.field.draw();
		$.refresh($.noop, 1000);
		UI.mainMenu();
	},

	loseCallback: function () {
		this.field.clear();
		this.field.draw();
		$.refresh($.noop, 1000);
		UI.mainMenu();
	},

	gameOver: function () {
		this.endGame(this.loseCallback);
	},

	won: function () {
		this.endGame(this.winCallback);
	},

	endGame: function (callback, delay) {
		if (delay === undefined) {
			delay = 2000;
		}

		this.tick = this.draw;
		this.clearTimers();
		this.saveReplay();
		this.inputSource.gameOver();
		this.queueSource.gameOver();

		setTimeout(callback.bind(this), delay);
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
			this.currentPiece = $.inherit(shape, {
				gridPosition: $.inherit(shape.gridPosition),
				sprite: $.inherit(shape.sprite)
			});
			this.currentPiece.init(this);
			this.currentPiece.velocity = this.velocity;
			gameOver = this.checkGameOver();
		} else {
			gameOver = true;
		}

		if (!gameOver) {
			this.inputSource.nextPiece();
		}

		return gameOver;
	},

	spawnNext: function () {
		this.inputSource.disable();
		this.tick = this.draw;

		if (!this.nextPiece()) {
			this.setSpawnTimer();
		}
	},

	setSpawnTimer: function () {
		this.spawnTimer = this.setTimeout(this.endSpawnNext.bind(this), this.spawnDelay);
	},

	setLineClearTimer: function () {
		this.currentPiece = null;
		this.clearSpawnTimer();
		this.spawnTimer = this.setTimeout(this.endLineClear.bind(this), this.lineClearDelay);
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
		this.tick = this.doFrame;
		this.inputSource.enable();
	},


	clearTimeout: function (timer) {
		var timers = this.timers,
		    idx;

		idx = timers.indexOf(timer);
		if (idx > -1) {
			timers.splice(idx, 1);
		}
	},

	setTimeout: function (callback, delay) {
		var timers = this.timers,
		    timer;

		timer = {callback: callback, delay: delay};
		timers.push(timer);

		return timer;
	},

	updateTimers: function () {
		var timers = this.timers,
		    timer,
		    i = 0;

		while (i < timers.length) {
			timer = timers[i];
			if (timer.delay-- === 0) {
				timer.callback();
				timers.splice(i, 1);
			} else {
				i++;
			}
		}
	},

	clearTimers: function () {
		this.timers = [];
	},

	endPiece: function () {
		var cleared, numCleared;

		this.groundedTimer = null;
		this.hasHeldPiece = false;

		this.outline.merge(this.currentPiece);
		this.field.merge(this.currentPiece);

		cleared = this.field.clearRows();
		numCleared = cleared.length;

		this.inputSource.endPiece();
		this.score.clearLines(numCleared);

		if (!numCleared) {
			this.spawnNext();
			this.outline.refresh();
			this.levels.endPiece();
		} else {
			this.levels.clearLines(numCleared);
		}

	},

	holdPiece: function () {
		if (this.hasHeldPiece) { return; }

		var current = this.currentPiece;

		this.hasHeldPiece = true;

		this.inputSource.endPiece();

		if (!this.heldPiece) {
			this.spawnNext();
		} else {
			this.currentPiece = this.heldPiece;
		}

		current.reset();
		this.heldPiece = current;
		this.drawHoldPiece();
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

	drawField: function (piece) {
		this.field.draw();
		this.outline.draw();

		if (piece && !this.spawnTimer) {
			this.ghostPiece && this.drawGhost(piece);
			piece.draw();
		}
	},

	drawGhost: function (piece) {
		var ghost = $.inherit(piece, {
			gridPosition: $.inherit(piece.gridPosition),
			sprite: $.inherit(piece.sprite)
		    }),
		    context = $.context;

		this.field.moveToBottom(ghost);

		context.save();
		context.globalAlpha = 0.4;
		ghost.draw();
		context.restore();
	},

	drawFrame: function (x, y, w, h, label) {
		var ctx = $.context,
		    offset = this.field.offset;

		x += offset.x;
		y += offset.y;

		ctx.strokeStyle = "#000";
		ctx.lineWidth = 3;
		ctx.clearRect(x, y, w, h);
		ctx.strokeRect(x, y, w, h);

		if (label) {
			var width, fontSize = 28;

			ctx.save();
			ctx.fillStyle = "#000000";
			ctx.font = fontSize + "px Orbitron";
			width = ctx.measureText(label).width + 10;
			ctx.clearRect(x + 5, y-3, width, fontSize);
			ctx.fillText(label, x + 9, y+12);
			ctx.restore();
		}
	},

	drawFramedShape: function (x, y, piece) {
		var blockSize = Piece.blockSize,
		    size = blockSize * 6,
		    offset = this.field.offset;

		if (!piece) { return; }

		x += offset.x;
		y += offset.y;

		piece.sprite.moveTo(x, y);

		piece.draw();
	},

	drawPiecePreview: function () {
		var blockSize = Piece.blockSize,
		    size = ~~(blockSize * 5.5),
		    x = ~~(blockSize * 10.5),
		    y = 10,
		    piece,
		    offset;

		piece = $.inherit(Shapes[this.queueSource.queue[0]]);
		offset = (5 - piece.shape.length) / 2 * blockSize;

		this.drawFrame(x, y, size, size, "Next");
		this.drawFramedShape(x + offset, y + offset, piece);
	},

	drawHoldPiece: function () {
		var blockSize = Piece.blockSize,
		    size = ~~(blockSize * 5.5),
		    x = ~~(blockSize * 10.5),
		    y = 215,
		    offset,
		    piece = this.heldPiece;

		this.drawFrame(x, y, size, size, "Hold");

		if (!piece) { return; }

		offset = (5 - piece.shape.length) / 2 * blockSize;
		this.drawFramedShape(x + offset, y + offset, piece);
	},

	addInputSink: function (sink) {
		this.inputSinks = this.sinks || [];
		this.inputSinks.push(sink);
	},

	eachSink: function (callback, thisp) {
		this.inputSinks.forEach(callback, thisp);
	},

	setInputSource: function (is) {
		this.inputSource = is;
		is.game = this;
		this.keyHold = is.keyHold.bind(this);
		this.keyPress = is.keyPress;
	},

	setQueueSource: function (qs) {
		this.queueSource = qs;
	},

	loaded: function () {
		Game.shapes.forEach(initBlock);
	},

	start: function () {
		this.timers = [];
		this.inputBuffer = 0;
		this.tick = this.countdown;

		this.velocity = this.startVelocity;
		this.field = $.inherit(Field);
		this.field.init(this);
		this.effects.init(this);

		this.score.start(this);
		this.levels.start(this);

		this.gameStatus.start(this);
		this.gameStatus.draw();

		this.eachSink(function (s) { s.start(this); }, this);
		this.inputSource.start(this);
		this.queueSource.start(this);

		this.heldPiece = null;
		this.drawHoldPiece();
		this.drawPiecePreview();
		this.nextPiece();

		this.outline = $.inherit(Outline);
		this.outline.init(this.field);

		this.effects.setOffset(this.field.offset);

		this.setTimeout(this.endCountdown.partial(this.ghostPiece).bind(this), this.countdownDelay);
	},

	countdown: function (elapsed, now) {
		this.ghostPiece = false;
		this.draw(elapsed);
	},

	endCountdown: function (ghostPiece) {
		this.ghostPiece = ghostPiece;
		this.drawPiecePreview();
		this.tick = this.doFrame;
	},

	softDrop: function () {
		var piece = this.currentPiece;

		if (!piece) { return; }

		piece.velocity += 1.2;
		this.score.softDrop(piece);
	},

	hardDrop: function () {
		var piece = this.currentPiece;

		if (!piece) { return; }

		piece.velocity = 20;
		this.dropped = true;

		this.dropFX.start(piece);
		this.score.hardDrop(piece);
	},

	input: function (input) {
		this.inputBuffer = this.inputBuffer | input;
	},

	consumeInput: function () {
		var buffer = this.inputBuffer;

		if (buffer & Inputs.RotateCW) {
			this.tryRotation(Piece.Rotation.CW);
		}

		if (buffer & Inputs.RotateCCW) {
			this.tryRotation(Piece.Rotation.CCW);
		}

		if (buffer & Inputs.Left) {
			this.tryMove(Piece.Direction.Left);
		}

		if (buffer & Inputs.Right) {
			this.tryMove(Piece.Direction.Right);
		}

		if (buffer & Inputs.Hold) {
			this.holdPiece();
		}

		if (buffer & Inputs.HardDrop) {
			this.spawnTimer || this.hardDrop();
		}

		if (buffer & Inputs.SoftDrop) {
			this.softDrop();
		}

		this.inputBuffer = 0;
	},

	refresh: function (elapsed, now) {
		this.updateTimers();
		this.tick(elapsed, now);
	},

	doFrame: function (elapsed) {
		this.play();
		this.draw(elapsed);
	},

	play: function (elapsed, now) {
		var currentPiece = this.currentPiece,
		    gameElapsed = this.refreshInterval + 1;

		if (currentPiece) {
			this.inputSource.refresh(gameElapsed, now);

			this.eachSink(function (s) { s.refresh(gameElapsed, this.inputBuffer); }, this);
			this.consumeInput();

			this.dropFX.end(currentPiece);
			currentPiece.update(gameElapsed);

			this.checkGrounded();
		}

		this.score.refresh(elapsed);
		this.checkWon();
		this.dropped = false;
	},

	draw: function (elapsed) {
		this.dropFX.refresh(elapsed);
		this.drawField(this.currentPiece);
		this.gameStatus.draw();
		this.effects.refresh(elapsed);
	},

	saveReplay: function () {
		if (this.inputSource !== InputSource.Player) {
			return;
		}

		HighScores.save(this);
	},

	pause: function () {
		PauseMenu.game = this;
		$.register(PauseMenu);
	}
};

var PauseMenu = {
	game: null,

	refresh: $.noop,
	keyHold: $.noop,
	keyPress: function (key) {
		if (key === Game.Config.Pause) {
			$.register(this.game);
		}
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

addEventListener("load", function () {
	$.init(800, 700);
	loadImages();
	$.loaded(Game.loaded);
	$.start();
}, false);
