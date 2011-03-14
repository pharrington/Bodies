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

	step: function (percent, dt) {
		var ctx = $.context;
		this.animate(dt);

		ctx.clearRect(0, 0, $.width, $.height);
		this.field.draw();
		Game.drawPiecePreview();
		ctx.save();
		ctx.globalAlpha = 1 - percent;
		ctx.drawImage(this.canvas, 0, 0);
		ctx.drawImage(this.canvas, 0, 1);
		ctx.drawImage(this.canvas, 1, 0);
		ctx.drawImage(this.canvas, 1, 1);
		ctx.restore();
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

var Streak = {
	piece: null,

	init: function () {
	}
};
