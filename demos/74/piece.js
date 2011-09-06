(function (exports) {

var Piece = {
	Direction: { Left: -1, Right: 1},
	Rotation: { CCW: -2, CW: 2},
	shapeIndex: 0,
	spriteIndex: 0,
	sprites: null,
	shape: null,
	blockSize: 33,
	imageSize: 31,
	scale: 1,
	spacing: 2,
	spacingColor: "#444",
	shapeSize: null,
	offset: null,
	gridPosition: null,
	game: null,
	delta: 0,

	init: function (game) {
		var x = this.shapes[0].length === 2 ? 4 : 3,
		    y = this.shapes[0].length === 3 ? 0 : 0;

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
		if (this.shapeIndex < 0) {
			this.shapeIndex += this.shapes.length;
		}

		this.setShape();
	},

	rotateCW: function () { this.rotate(Piece.Rotation.CW); },
	rotateCCW: function () { this.rotate(Piece.Rotation.CCW); },

	setShape: function () {
		var shapeIndex = this.shapeIndex;

		this.shape = Util.cycle(this.shapes, shapeIndex);
		this.sprite = Util.cycle(this.sprites, shapeIndex);
	},

	createSprite: function (shape) {
		var len = shape.length,
		    scale = this.scale,
		    spacing = Piece.spacing,
		    fillSize = this.imageSize + spacing * 2,
		    width = (this.imageSize * len + spacing * (len + 1)) * scale,
		    height = width,
		    sprite,
		    context,
		    y, x,
		    i, j;

		this.shapeSize = len;

		sprite = new $.Sprite(width, height);
		context = sprite.oContext;
		context.fillStyle = this.spacingColor;
		context.scale(scale, scale);

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
		this.gridPosition.y += this.scale;
	},

	moveUp: function () {
		this.gridPosition.y -= this.scale;
		this.update(0);
	},

	move: function (direction) {
		switch (direction) {
		case Piece.Direction.Left:
			this.gridPosition.x -= this.scale;
			break;
		case Piece.Direction.Right:
			this.gridPosition.x += this.scale;
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
				g.y += this.scale;
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

exports.Piece = Piece;

})(window);
