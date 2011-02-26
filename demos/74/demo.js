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

	obj.elapsed += elapsed;
	progress = obj.elapsed / obj.duration;

	if (progress < 1) {
		callback.call(obj, progress, elapsed);
	} else {
		obj.elapsed = 0;
		complete.call(obj);
	}
};

$.inherit = function (proto, attrs) {
	var maker = function () {},
	    o;

	maker.prototype = proto;
	o = new maker;
	typeof attrs === "object" && $.extend(o, attrs);

	return o;
};

function cycle(array, index) {
	var len = array.length;

	index %= len;
	if (index < 0) { index += len }

	return array[index];
}

var Piece = {
	Direction: { Left: -1, Right: 1},
	Rotation: { CCW: -1, CW: 1},
	shapeIndex: 0,
	spriteIndex: 0,
	sprites: null,
	shape: null,
	blockSize: 32,
	imageSize: 30,
	spacing: 2,
	spacingColor: "#444",
	shapeSize: null,
	offset: null,
	delta: 0,

	init: function () {
		this.gridPosition = {x: 3, y: -2};
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
		}

		y = g.y * size;
		x = g.x * size;

		this.velocity = Game.velocity;
		this.sprite.moveTo(x + offset.x, y + offset.y);
	},

	draw: function () {
		this.sprite.draw();
	}
};

var Shapes = {
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

var Field = {
	canvas: null,
	context: null,
	fillColor: new Pixel(10, 10, 10),
	mergeAlpha: 0.7,
	blockSize: null,
	spacing: null,
	width: null,
	height: null,
	offset: {x: 0, y: 0},
	grid: new Array(20),

	init: function () {
		var i, j, len = this.grid.length,
		    row;

		for (i = 0; i < len; i++) {
			row = [];
			for (j = 0; j < 10; j++) {
				row.push(false);
			}
			this.grid[i] = row;
		}
		this.initCanvas();
	},

	initCanvas: function () {
		var canvas = document.createElement("canvas"),
		    size = this.blockSize = Piece.blockSize,
		    spacing = this.spacing = Piece.spacing;

		canvas.width = this.width = 10 * size + spacing;
		canvas.height = this.height = 20 * size + spacing;
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

		grid.compact();

		while (grid.length !== 20) {
			row = [];
			for (i = 0; i < 10; i++) {
				row.push(false);
			}
			grid.unshift(row);
		}

		!unanimated && cleared.length && this.animate(cleared);
		return cleared;
	},

	animate: function (rows) {
		Game.clearSpawnTimer();
		Fireworks.field = this;
		Fireworks.rows = rows;
		Fireworks.init();
		$.register(Fireworks);
	},

	
	drawBlock: function (block, x, y) {
		var size = Piece.blockSize,
		    spacing = Piece.spacing;

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

		for (y = 0; y < 20; y++) {
			for (x = 0; x < 10; x++) {
				block = this.grid[y][x];
				block && this.drawBlock(block.image, x, y);
			}
		}

		context.restore();
	},

	dead: function () {
		var row = this.grid[0];

		return row[4] || row[5];
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
		var collide = false;

		this.applyPiece(piece, function (shape, grid, sx, sy, gx, gy) {
			if (shape[sy][sx] && (gy >= 20 || gx < 0 || gx >= 10 || (gy >= 0 && grid[gy][gx]))) {
				collide = true;
				return false;
			}
		});
		return collide;
	},

	oob: function (piece) {
		var oob = false;

		this.applyPiece(piece, function (shape, grid, sx, sy, gx, gy) {
			if (shape[sy][sx] && (gy >= 20 || gx < 0 || gx >= 10)) {
				oob = true;
				return false;
			}
		});
		return oob;
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

var Fireworks = {
	elapsed: 0,
	duration: 750,
	refreshInterval: 30,

	keyPress: $.noop,
	keyHold: $.noop,

	particles: [],
	gravity: 0.05,
	count: 200,
	speed: 0.35,

	width: null,
	height: null,
	offset: null,

	bgColor: new Pixel(0, 0, 0, 0),
	imageData: null,

	colors: {
		cyan: ["#c0f8fc", "#0bd0df", "#012337", "#ffffff", "#18e2f4", "#0382cb"],
		yellow: ["#faf0bc", "#f0e314", "#a4a01b",  "#a40214", "#be1f30", "#608b40", "#ffffff"],
		red: ["#f08e9a", "#f2164a", "#c90c03", "#66060f", "#63f453", "#ffffff"],
		blue: ["#177cf4", "#0326cb", "#c0dcfc", "#91b1f1", "#062365", "#3125c1", "#4b468e", "#f2f136", "#ffffff"],
		orange: ["#f59231", "#edb903", "#f6d6ac", "#8d5d09", "#7f50f3", "#522fa8", "#ffffff"],
		purple: ["#ccaef8", "#6417f1", "#8203cb", "#330662", "#e10bf9", "#1b0ada", "#0b37f9", "#ffffff"],
		green: ["#d0fcbc", "#5bf418", "#08cb03", "#156206", "#94dd0b", "#fafa0c", "#ffffff"]
	},

	addParticle: function (x, y, color) {
		var accel = new Vector(0, this.gravity),
		    speed = Math.random() * this.speed,
		    vel,
		    angle,
		    particle,
		    colors,
		    color;

		colors = this.colors[color];
		color = colors[Math.floor(Math.random() * colors.length)];

		angle = Math.random() * Math.PI * 2;
		vel = new Vector(speed * Math.cos(angle), speed * Math.sin(angle));
		particle = new Particle(new Vector(x, y), vel, accel);
		particle.color = Pixel.fromString(color);
		this.particles.push(particle);
	},

	init: function () {
		var x, y,
		    offset,
		    blockSize = Piece.blockSize,
		    spacing = Piece.spacing,
		    row,
		    i, j;

		offset = new Vector(this.field.offset);
		this.particles = [];
		this.width = 400;
		this.height = $.height;
		this.initCanvas();

		this.clearRows(this.rows);

		for (i = 0; i < this.rows.length; i++) {
			row = this.rows[i];

			y = row.index * blockSize + spacing
			for (x = 0; x < 10; x++) {
				for (j = 0; j < this.count; j++) {
					this.addParticle(offset.x + blockSize / 2 + x * (blockSize + spacing),
							 offset.y + blockSize / 2 + y,
							 row.blocks[i].color);
				}
			}
		}
	},

	initCanvas: function () {
		var canvas;

		if (this.canvas) { return; }

		canvas = this.canvas = document.createElement("canvas");
		canvas.width = this.width;
		canvas.height = this.height;
		this.context = canvas.getContext("2d");
		this.imageData = this.context.createImageData(this.width, this.height);
	},

	clearRows: function (rows) {
		var i, len,
		    context = this.field.context;

		for (i = 0, len = rows.length; i < len; i++) {
			this.clearRow(rows[i].index, context);
		}

		this.field.draw();
	},

	clearRow: function (row, context) {
		var size = Piece.blockSize,
		    spacing = Piece.spacing,
		    data = context.getImageData(0, row * size, 10 * size + spacing, size + spacing),
		    pixels = data.data,
		    p, i, len,
		    fillColor = this.field.fillColor;

		// len is block size^2 * tetris grid columns * 4 ints per pixel
		for (i = 0, len = (size * 10 + spacing) * size * 4; i < len; i += 4) {
			setPixel(pixels, i, fillColor);
		}

		// clear the spacing line below if no blocks are below us
		p = i;

		for (i = 0, len = (size * 10 + spacing) * spacing * 4; i < len; i += 4, p += 4) {
			if (row === 19 || !this.field.grid[row + 1][Math.floor(((i / 4) % (size * 10 + spacing)) / size)]) {
				setPixel(pixels, p, fillColor);
			}
		}

		context.putImageData(data, 0, row * size);
	},

	refresh: function (elapsed) {
		$.timed(this, elapsed, this.step, this.complete);
	},

	step: function (_, dt) {
		this.animate(dt);

		$.context.clearRect(0, 0, $.width, $.height);
		this.field.draw();
		Game.drawPiecePreview();
		$.context.drawImage(this.canvas, 0, 0);
		$.context.drawImage(this.canvas, 0, 1);
		$.context.drawImage(this.canvas, 1, 0);
		$.context.drawImage(this.canvas, 1, 1);
	},

	clear: function () {
		var i,
		    pixels = this.imageData.data,
		    len = this.width * this.height * 4;

		for (i = 0; i < len; i++) {
			pixels[i] = 0;
		}
	},

	complete: function () {
		$.register(Game);
		Game.spawnNext();

		this.clear();
		$.context.clearRect(0, 0, $.width, $.height);

		this.field.redraw();
		this.field.draw();
		Game.drawPiecePreview();
	},

	animate: function (dt) {
		var particles = this.particles,
		    particle,
		    i, len;

		for (i = 0, len = particles.length; i < len; i++) {
			particle = particles[i];

			particle.draw(this.imageData, this.bgColor);
			particle.update(dt);
			particle.draw(this.imageData);
		}

		this.context.putImageData(this.imageData, 0, 0);
	}
};

var Outline = {
	outlineColor: "#eee",
	occupied: null,

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

		for (sy = 0; sy < 4 && y < 20; sy++, y++) {
			if (y < 0) { continue; }

			for (sx = 0, x = gx; sx < 4 && x < 10; sx++, x++) {
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

		for (y = 0; y < 20; y++) {
			for (x = 0; x < 10; x++) {
				cell = this.occupied[y][x];

				cell.bottom = cell.top = cell.left = cell.right = false;
			}
		}

		for (y = 0; y < 20; y++) {
			for (x = 0; x < 10; x++) {
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

		if (x < 9) {
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

		if (y < 19) {
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

		this.blockSize = field.blockSize;
		this.offset = field.offset;
		this.canvas = canvas;
		this.context = context;

		this.occupied = [];

		for (y = 0; y < 20; y++) {
			this.occupied[y] = [];
			for (x = 0; x < 10; x++) {
				this.occupied[y][x] = new Outline.Cell;
			}
		}
	},

	refresh: function () {
		var x, y,
		    dx, dy,
		    context = this.context,
		    occupied = this.occupied,
		    cell,
		    spacing = this.spacing,
		    size = this.blockSize,
		    hspacing = spacing / 2,
		    top, left, bottom, right;

		context.clearRect(0, 0, this.width, this.height);

		for (y = 0, dy = 0; y < 20; y++, dy += size) {
			for (x = 0, dx = 0; x < 10; x++, dx += size) {
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
	shapes: ["I", "T", "O", "S", "Z", "L", "J"],
	shapeQueue: [],
	currentPiece: null,
	groundedTimer: null,
	spawnTimer: null,
	velocity: null,

	groundedTimeout: 500,
	spawnDelay: 300,
	startVelocity: 0.75 / 1000,
	keyHoldDelay: 150,
	keyHoldInterval: 18,
	refreshInterval: 15,
	dropped: false,

	level: 0,

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

		this.ejectUp(piece);
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

		if (this.field.dead()) {
			gameover = true;
			$.refresh(this.gameOver.bind(this));
		}
		return gameover;
	},

	initShapeQueue: function () {
		var queue = this.shapeQueue = [],
		    i;

		for (i = 0; i < 4; i++) {
			queue.push(this.randomShape());
		}
	},

	ejectUp: function (piece) {
		var field = this.field;

		while (field.collision(piece)) {
			piece.moveUp();
		}
	},

	randomShape: function () {
		var shape,
		    random = function () { return Game.shapes[~~(Math.random() * 7)] },
		    queue = this.shapeQueue;
		    inQueue = true,
		    i = 0;

		while (inQueue && i < 4) {
			shape = random();
			if (queue.indexOf(shape) === -1) { inQueue = false; }
			i++;
		}

		return shape;
	},

	nextPiece: function () {
		var queue = this.shapeQueue;

		queue.push(this.randomShape());
		this.currentPiece = $.inherit(Shapes[queue.shift()]);
		this.currentPiece.init();
		this.currentPiece.velocity = this.velocity;
	},

	gameOver: function () {
		setTimeout(function () {
			$.register(ConfigMenu);
		}, 2000);
	},

	spawnNext: function () {
		$.keyHold($.noop);
		$.refresh($.noop, this.refreshInterval);
		this.nextPiece();
		this.spawnTimer = setTimeout(this.endSpawnNext.bind(this), this.spawnDelay);
	},

	endSpawnNext: function () {
		this.spawnTimer = null;
		!this.dropped && this.drawPiecePreview();
		$.register(this);
	},


	endPiece: function () {
		var cleared;

		this.velocity += 0.25 / 1000;
		this.groundedTimer = null;

		this.outline.merge(this.currentPiece);
		this.field.merge(this.currentPiece);

		cleared = this.field.clearRows();

		if (!cleared.length) {
			this.checkGameOver() || this.spawnNext();
		} else {
			this.outline.rebuild(this.field.grid);
		}

		this.outline.refresh();
	},

	tryMove: function (direction) {
		var field = this.field,
		    piece = this.currentPiece;

		piece.move(direction);
		if (field.collision(piece)) {
			direction === Piece.Direction.Left ? piece.moveRight() : piece.moveLeft();
		}
	},

	tryRotation: function (rotation) {
		var field = this.field,
		    piece = this.currentPiece;

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
		if (!this.spawnTimer) {
			piece.draw();
		}
	},

	drawPiecePreview: function () {
		var blockSize = Piece.blockSize,
		    size = blockSize * 6,
		    x = blockSize * 11,
		    y = 5,
		    piece = $.inherit(Shapes[this.shapeQueue[0]]),
		    offset;

		offset = (6 - piece.shape.length) / 2 * blockSize;
		piece.sprite.moveTo(x + offset, y + offset);


		$.context.strokeStyle = "#000";
		$.context.lineWidth = 10;
		$.context.clearRect(x, y, size, size);
		$.context.strokeRect(x, y, size, size);
		piece.draw();
	},

	loaded: function () {
		Game.shapes.forEach(initBlock);
		ConfigMenu.init();
	},

	start: function () {
		this.velocity = this.startVelocity;
		this.field = $.inherit(Field);
		this.field.init();
		this.initShapeQueue();
		this.drawPiecePreview();
		this.nextPiece();

		this.outline = $.inherit(Outline);
		this.outline.init(this.field);
	},

	keyHold: function (key) {
		if (!this.spawnTimer) {
			this.move(key);
		}
	},

	move: function (key) {
		var direction;

		if (key === Game.Config.Left) {
			direction = Piece.Direction.Left;
		} else if (key === Game.Config.Right) {
			direction = Piece.Direction.Right;
		}

		direction && this.tryMove(direction);
	},

	keyPress: function (key) {
		var rotation;

		if (key === Game.Config.RotateCW) {
			rotation = Piece.Rotation.CW;
		}

		if (key === Game.Config.RotateCCW) {
			rotation = Piece.Rotation.CCW;
		}

		if (!this.spawnTimer && key === Game.Config.HardDrop) {
			this.currentPiece.velocity = 10;
			//this.dropped = true;
		}

		if (key === Game.Config.Pause) {
			this.pause();
		}

		rotation && this.tryRotation(rotation);
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

	refresh: function (elapsed, now) {
		var currentPiece = this.currentPiece;

		if ($.keys[Game.Config.SoftDrop]) {
			currentPiece.velocity += .05;
			this.dropped = true;
		}

		currentPiece.update(elapsed);
		this.checkGrounded();
		this.drawGame(currentPiece);
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
		"Hard Drop", "HardDrop",
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
	$.start();
	$.register(ConfigMenu);
}, false);
