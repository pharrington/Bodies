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
		callback.call(obj, progress);
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
		context.fillStyle = "#000";

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
	fillColor: "#888",
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
		    size = Piece.blockSize,
		    spacing = Piece.spacing;

		canvas.width = this.width = 10 * size + spacing;
		canvas.height = this.height = 20 * size + spacing;
		this.context = canvas.getContext("2d");
		this.context.fillStyle = this.fillColor;
		this.context.fillRect(0, 0, this.width, this.height);
		this.canvas = canvas;
	},

	filled: function (block) { return block; },

	clearRows: function () {
		var row,
		    i, len,
		    cleared = [],
		    grid = this.grid;

		for (i = 0, len = grid.length; i < len; i++) {
			row = grid[i];
			if (row.every(Field.filled)) {
				grid[i] = null;
				cleared.push(i);
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

		cleared.length && this.animate(cleared);
		return cleared.length;
	},

	animate: function (rows) {
		Game.clearSpawnTimer();
		Dissolve.field = this;
		Dissolve.rows = rows;
		$.register(Dissolve);
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
		    block;

		this.context.fillRect(0, 0, this.width, this.height);
		this.context.fillStyle = "#000";

		for (y = 0; y < 20; y++) {
			for (x = 0; x < 10; x++) {
				block = this.grid[y][x];
				block && this.drawBlock(block, x, y);
			}
		}

		this.context.fillStyle = this.fillColor;
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

	merge: function (piece) {
		this.context.fillStyle = "#000";
		this.applyPiece(piece, function (shape, grid, sx, sy, gx, gy) {
			if (gy >= 0 && shape[sy][sx]) {
				grid[gy][gx] = piece.block;
				this.drawBlock(piece.block, gx, gy);
			}
		});
		this.context.fillStyle = this.fillColor;
	}
};

var Dissolve = {
	elapsed: 0,
	duration: 500,
	refreshInterval: 17,

	keyPress: $.noop,
	keyHold: $.noop,

	refresh: function (elapsed) {

		$.timed(this, elapsed, this.step, this.complete);

		this.field.draw();
	},

	step: function (progress) {
		var context = this.field.context,
		    rows = this.rows,
		    i, len;

		for (i = 0, len = rows.length; i < len; i++) {
			this.dissolve(rows[i], progress, context);
		}
	},

	complete: function () {
		$.register(Game);
		Game.spawnNext();
		this.field.redraw();
		Game.drawPiecePreview();
	},

	dissolve: function (row, percent, context) {
		var size = Piece.blockSize,
		    spacing = Piece.spacing,
		    data = context.getImageData(0, row * size, 10 * size + spacing, size),
		    pixels = data.data,
		    i, len;

		// len is block size^2 * tetris grid columns * 4 ints per pixel
		for (i = 0, len = (size * 10 + spacing) * size * 4; i < len; i += 4) {
			if (percent * percent >= Math.random()) {
				pixels[i] = 128;
				pixels[i + 1] = 128;
				pixels[i + 2] = 128;
				pixels[i + 3] = 255;
			}
		}

		context.putImageData(data, 0, row * size);
	}
};

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
	keyHoldDelay: 200,
	keyHoldInterval: 20,
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

	checkShapeQueue: function () {
		var queue = this.shapeQueue || [],
		    i;

		if (!queue.length) {
			for (i = 0; i < 4; i++) {
				queue.push(this.randomShape());
			}
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

		this.checkShapeQueue();
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
		this.velocity += 0.25 / 1000;
		this.groundedTimer = null;
		this.field.merge(this.currentPiece);
		if (!this.checkGameOver()) {
			!this.field.clearRows() && this.spawnNext();
		}
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
		piece.draw();
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
		this.checkShapeQueue();
		this.drawPiecePreview();
		this.nextPiece();
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
