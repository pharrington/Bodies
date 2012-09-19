(function (window, undefined) {
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

var Game = {
	duration: 0,
	elapsed: 0,
	shapes: ["I", "T", "O", "Z", "S", "L", "J"],
	currentPiece: null,
	groundedTimer: null,
	spawnTimer: null,
	velocity: null,
	enableGhostPiece: true,
	killOnLockAboveField: false,
	invisible: false,
	fade: false,
	lastY: -10,

	groundedTimeout: 30,
	lineClearDelay: 10,
	spawnDelay: 6,
	lineClearSpawnDelay: 0,
	startVelocity: 0.012,
	timers: null,
	active: false,

	countdownDelay: ~~((1000 / 17) * 3),
	keyHoldDelay: 170, // DAS (Delayed Auto Shift)
	keyHoldInterval: 10, // ARR (Auto Repeat Rate)
	refreshInterval: 16,
	endGameDelay: 3500,
	wonEndGameDelay: 5000,
	gameOverFXDelay: 700,
	wonFXDelay: 500,
	locked: false,

	inputBuffer: 0,

	heldPiece: null,
	score: null,
	levels: null,
	queueSource: null,
	inputSource: null,
	inputSinks: null,
	rotationSystem: null,
	mode: null,
	softLock: false,
	hardLock: false,

	dropFX: null,
	effects: null,

	gameStatus: null,

	Config: {
		Left: 37,
		Right: 39,
		SoftDrop: 40,
		HardDrop: 38,
		Hold: 67,
		RotateCW: 88,
		RotateCCW: 90,
		RotateCCWAlt: 17,
		Pause: 27
	},

	tick: $.noop,
	mouseDown: $.noop,

	tryRotation: $.noop,

	setFade: function (fade) {
		if (fade) {
			this.outline.refresh = this.outline.draw = $.noop;
		} else {
			this.outline.refresh = Outline.draw;
		}

		this.fade = this.field.fade = fade;
	},

	checkGrounded: function () {
		var field = this.field,
		    piece = this.currentPiece,
		    dropped = this.locked;

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
			this.drawPiecePreview();
			this.currentPiece.update(0);
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

	winCallback: $.noop,

	loseCallback: function () {
		FX.DropColumns.end();
	},

	endGameCallback: function () {
		this.saveReplay();
	},

	gameOver: function () {
		var piece = this.currentPiece,
		    field = this.field;

		setTimeout(function () {
			field.merge(piece);
			FX.DropColumns.start(field);
			field.draw = $.noop;
			piece.draw = $.noop;
		}, this.gameOverFXDelay);

		this.endGame(this.loseCallback);
	},

	won: function () {
		var field = this.field;

		setTimeout(function () {
			var count = 10,
			    interval = 300,
			    i,
			    width = field.width,
			    height = field.height,
			    x, y;

			for (i = 0; i < count; i++) {
				x = Math.random() * (width * 0.8) + width * 0.2;
				y = Math.random() * (height * 0.5) + height * 0.1;

				FX.Fireworks.createParticles(x, y, interval * i);
			}
		
		}, this.wonFXDelay);

		this.endGame(this.winCallback, this.endGameCallback, this.wonEndGameDelay);
	},

	endGame: function (callback, endGameCallback, delay) {
		if (delay === undefined) {
			delay = this.endGameDelay;
		}

		$.keyPress($.noop);
		this.active = false;
		this.fade = false;
		this.field.fade = false;
		this.invisible = false;
		this.field.redraw();
		this.tick = this.draw;
		this.clearTimers();
		this.inputSource.gameOver();
		this.queueSource.gameOver();

		setTimeout(function () {
			this.field.clear();
			this.field.draw();
			$.refresh($.noop, 1000);
			callback.call(this);

			if (typeof endGameCallback === "function" ) {
				endGameCallback.call(this);
			} else {
				this.endGameCallback();
			}
		}.bind(this), delay);
	},

	nextPiece: function () {
		var shape = this.rotationSystem.shapes[this.queueSource.next()];

		if (shape) {
			this.currentPiece = $.inherit(shape, {
				gridPosition: $.inherit(shape.gridPosition),
				sprite: $.inherit(shape.sprite)
			});
			this.currentPiece.init(this);
			this.currentPiece.velocity = this.velocity;
			this.lastY = this.currentPiece.gridPosition.y;

		}

		this.inputSource.nextPiece();
	},

	spawnNext: function (are) {
		this.tick = this.draw;
		this.nextPiece();
		this.setSpawnTimer(are);
	},

	setSpawnTimer: function (are) {
		if (are === undefined) { are = this.spawnDelay; }

		this.spawnTimer = this.setTimeout(this.endSpawnNext.bind(this), are);
	},

	setLineClearTimer: function () {
		this.tick = this.draw;
		this.clearSpawnTimer();
		this.spawnTimer = this.setTimeout(this.endLineClear.bind(this), this.lineClearDelay);
	},

	endLineClear: function () {
		this.nextPiece();
		this.outline.rebuild(this.field.grid);
		this.field.redraw();
		this.outline.refresh();

		this.setSpawnTimer(this.lineClearSpawnDelay);
	},

	endSpawnNext: function () {
		this.spawnTimer = null;
		!this.locked && this.drawPiecePreview();
		this.tick = this.doFrame;
		this.levels.endSpawnNext();
		this.inputSource.endSpawnNext();
		this.checkGameOver() || this.currentPiece.update(1);
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
		    runTimers = true,
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

		// run all timers with a delay of 0 (we still want callbacks to run during the event loop)
		i = 0;
		while (runTimers && timers.length) {
			runTimers = false;
			timer = timers[i];

			if (timer.delay === 0) {
				timer.callback();
				timers.splice(i, 1);
				runTimers = true;
			} else {
				i++;
			}

			if (i === timers.length) {
				i = 0;
			}
		}
	},

	clearTimers: function () {
		this.spawnTimer = null;
		this.groundedTimer = null;
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

		if (this.killOnLockAboveField && this.currentPiece.gridPosition.y === this.currentPiece.initialPosition.y) {
			this.gameOver();
			return;
		}

		if (!numCleared) {
			FX.Piece.start(this.currentPiece);
			this.spawnNext();
			this.outline.refresh();
			this.levels.endPiece();
		} else {
			this.levels.clearLines(numCleared);
			ColorFlasher.start();
		}

		this.score.clearLines(numCleared);
	},

	holdPiece: function () {
		if (this.hasHeldPiece) { return; }

		var current = this.currentPiece;

		this.hasHeldPiece = true;

		this.inputSource.endPiece();

		if (!this.heldPiece) {
			this.spawnNext(0);
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

	drawField: function (piece) {
		var ctx = $.context,
		    field = this.field,
		    offset = field.offset;

		if (!this.invisible) {
			field.draw();
		}

		if (piece && !this.spawnTimer) {
			this.enableGhostPiece && this.active && this.drawGhost(piece);
			piece.draw();
		}
	},

	drawGhost: function (piece) {
		var ghost = $.inherit(piece, {
			gridPosition: $.inherit(piece.gridPosition),
			sprite: $.inherit(piece.sprite)
		    }),
		    context = Piece.context;

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

		ctx.strokeStyle = "#eee";
		ctx.lineWidth = 3;
		ctx.clearRect(x, y, w, h);
		Piece.context.clearRect(x, y, w, h);
		ctx.strokeRect(x, y, w, h);

		if (label) {
			var width, fontSize = 20;

			ctx.save();
			ctx.fillStyle = "#eee";
			ctx.font = fontSize + "px 'Press Start 2P'";
			width = ctx.measureText(label).width + 10;
			ctx.clearRect(x + 5, y - 3, width, fontSize);
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

		piece.draw(true);
	},

	drawPiecePreview: function () {
		var blockSize = Piece.blockSize,
		    size = ~~(blockSize * 5.5),
		    x = ~~(blockSize * 11.5),
		    y = 10,
		    piece,
		    offset;

		piece = $.inherit(this.rotationSystem.shapes[this.queueSource.queue[0]]);
		piece.init(this);

		offset = (5 - piece.shape.length) / 2 * blockSize;

		this.drawFrame(x, y, size, size, "Next");
		this.drawFramedShape(x + offset, y + offset, piece);
	},

	drawHoldPiece: function () {
		if (this.holdPiece === $.noop) { return; }

		var blockSize = Piece.blockSize,
		    size = ~~(blockSize * 5.5),
		    x = ~~(blockSize * 11.5),
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

	setRotationSystem: function (rs) {
		this.rotationSystem = rs;
		this.tryRotation = rs.tryRotation;
	},

	loaded: function () {
		var rs;

		for (rs in RotationSystems ) {
			if (!RotationSystems.hasOwnProperty(rs)) { continue; }

			Game.shapes.forEach(function (shape) {
				initBlock(RotationSystems[rs].shapes[shape]);
			});
		};
	},

	start: function () {
		this.currentPiece = null;
		this.active = false;
		this.timers = [];
		this.inputBuffer = 0;
		this.tick = this.countdown;

		this.velocity = this.startVelocity;
		this.field = $.inherit(Field);
		this.field.init(this);
		this.effects.init(this);
		FX.Fireworks.init();

		this.outline = $.inherit(Outline);
		this.outline.init(this.field);
		this.setFade(false);

		this.score.start(this);
		this.levels.start(this);

		this.gameStatus.start(this);
		this.gameStatus.drawLabels();

		this.eachSink(function (s) { s.start(this); }, this);
		this.inputSource.start(this);
		this.queueSource.start(this);

		this.heldPiece = null;
		this.drawPiecePreview();
		this.drawHoldPiece();

		FX.context(); // initialize the FX canvas if it hasn't been already
		this.effects.setOffset(this.field.offset);

		$.keyPress($.noop);
		this.setTimeout(this.endCountdown.bind(this), this.countdownDelay);
	},

	countdown: function (elapsed, now) {
		this.draw(elapsed);
		Countdown.tick(3);
	},

	endCountdown: function () {
		Countdown.end();
		$.keyPress(this.keyPress.bind(this));

		this.nextPiece();
		this.drawPiecePreview();
		this.tick = this.doFrame;
		this.active = true;
	},

	softDrop: function () {
		var piece = this.currentPiece;

		if (this.softLock) { this.locked = true; }

		piece.velocity += 1;
		this.score.softDrop(piece);
	},

	hardDrop: function () {
		var piece = this.currentPiece;

		piece.velocity = 20;
		if (this.hardLock) { this.locked = true; }

		this.dropFX.start(piece);
		this.score.hardDrop(piece);
	},

	input: function (input) {
		this.inputBuffer = this.inputBuffer | input;
	},

	clearInput: function (input) {
		this.inputBuffer = this.inputBuffer & ~input;
	},

	consumeInput: function () {
		var buffer = this.inputBuffer;

		if (this.spawnTimer) {
			return;
		}

		if (buffer & Inputs.RotateCW) {
			this.tryRotation(Piece.Rotation.CW);
		}

		if (buffer & Inputs.RotateCCW) {
			this.tryRotation(Piece.Rotation.CCW);
		}

		if (buffer & Inputs.Hold) {
			this.holdPiece();
		}

		if (buffer & Inputs.HardDrop) {
			this.hardDrop();
		}

		if (buffer & Inputs.Left) {
			this.tryMove(Piece.Direction.Left);
		}
		
		if (buffer & Inputs.Right) {
			this.tryMove(Piece.Direction.Right);
		}
		
		if (buffer & Inputs.SoftDrop) {
			this.softDrop();
		}

	},

	refresh: function (elapsed, now) {
		this.updateTimers();
		this.tick(elapsed, now);
	},

	doFrame: function (elapsed) {
		this.play(elapsed);
		this.draw(elapsed);
	},

	play: function (elapsed, now) {
		var currentPiece, gameElapsed = this.refreshInterval + 1;

		/* the current piece may change during input handling */
		this.inputSource.refresh(gameElapsed, now);
		this.eachSink(function (s) { s.refresh(gameElapsed, this.inputBuffer); }, this);
		this.consumeInput();
		this.slopeReset();

		currentPiece = this.currentPiece;
		this.dropFX.end(currentPiece);
		currentPiece.update(gameElapsed);

		this.checkGrounded();

		this.checkWon();
		this.locked = false;
	},

	slopeReset: function () {
		var y = this.currentPiece.gridPosition.y;

		if (this.lastY < y) {
			this.clearGroundedTimer();
		}

		this.lastY = y;
	},

	draw: function (elapsed) {
		if (this.active) {
			this.score.refresh(elapsed);
		}

		$.DirtyRects.update();
		this.dropFX.refresh(elapsed);
		this.drawField(this.currentPiece);
		FX.Piece.refresh(elapsed);
		FX.DropColumns.refresh(elapsed);
		this.gameStatus.draw(elapsed);
		this.effects.refresh(elapsed);
		FX.Fireworks.refresh(elapsed);
		this.inputBuffer = 0;
	},

	saveReplay: function () {
		if (this.inputSource !== InputSource.Player) {
			return;
		}

		ScoreEntry.show(this);
	},

	pause: function () {
		UI.PauseMenu.game = this;
		$.register(UI.PauseMenu);
	}
};

function loadImages() {
	["orange", "red", "yellow", "green", "cyan", "blue", "purple"].forEach(function (color) {
		$.loadImage(color, "assets/blocks/bubbly/" + color + ".png");
	});
	$.loadImage("background", "assets/backgrounds/space.jpg");
}

function initBlock(piece) {
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

window.Game = Game;

})(this);
