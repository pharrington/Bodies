(function (window, undefined) {

var FX = {},
    canvas,
    context;

FX.context = function () {
	if (!context) {
		canvas = document.getElementById("field_effects");
		canvas.width = $.width;
		canvas.height = $.height;
		context = canvas.getContext("2d");
	}

	return context;
};

FX.clear = function () {
	FX.context().clearRect(0, 0, canvas.width, canvas.height);
};

FX.Burst = {
	duration: 600,

	gravity: 0.02,
	count: 13,
	speed: 0.43,

	colors: {
		cyan: ["#c0f8fc", "#0bd0df", "#012337", "#ffffff", "#ffffff", "#18e2f4", "#0382cb"],
		yellow: ["#faf0bc", "#f0e314", "#a4a01b",  "#a40214", "#be1f30", "#608b40", "#ffffff", "#ffffff"],
		red: ["#f03b51", "#f2164a", "#c90c03", "#d20c1f", "#ffffff", "#ffffff"],
		blue: ["#177cf4", "#0326cb", "#c0dcfc", "#91b1f1", "#062365", "#3125c1", "#4b468e", "#f2f136", "#ffffff", "#ffffff"],
		orange: ["#f59231", "#edb903", "#f6d6ac", "#8d5d09", "#7f50f3", "#522fa8", "#ffffff", "#ffffff"],
		purple: ["#ccaef8", "#6417f1", "#8203cb", "#e10bf9", "#1b0ada", "#0b37f9", "#ffffff", "#ffffff"],
		green: ["#d0fcbc", "#5bf418", "#08cb03", "#63f453", "#94dd0b", "#fafa0c", "#ffffff", "#ffffff"]
	},

	imageCache: {},

	init: function (game) {
		FX.clear();
		if (this.particleSystem) { return; }

		this.particleSystem = new ParticleSystem("blur");

		this.field = game.field;
		this.setDimensions(this.field.width, this.field.height);

		this.initImageCache();
	},

	initImageCache: function () {
		var color,
		    particle = new Particle;

		particle.radius = 4;
		for (color in this.colors) {
			if (!this.colors.hasOwnProperty(color)) { continue; }

			this.colors[color].forEach(function (shade) {
				particle.setColor(shade);
				this.imageCache[shade] = particle.drawGlow();
			}, this);
		}
	},

	addParticle: function (x, y, color) {
		var speed = Math.random() * this.speed,
		    vel,
		    angle,
		    particle,
		    colors,
		    color;

		colors = this.colors[color];
		color = colors[Math.floor(Math.random() * colors.length)];

		angle = Math.random() * Math.PI * 2;

		particle = this.particleSystem.createParticle();
		particle.duration = this.duration;
		particle.setPosition(x, y);
		particle.setVelocity(
			speed * Math.cos(angle),
			speed * Math.sin(angle) - 0.05);
		particle.setAcceleration(0, this.gravity);
		particle.setColor(color);
		particle.radius = 3;
		particle.dirtyHistoryLength = 5;

		if (Math.random() < 0.35) {
			particle.delay = Math.random() * 200;
		}

		particle.canvas = this.imageCache[color];
	},

	start: function (rows) {
		if (!this.duration) { return; }

		var x, y,
		    field = this.field,
		    blockSize = Piece.blockSize,
		    spacing = Piece.spacing,
		    row,
		    i, j;

		for (i = 0; i < rows.length; i++) {
			row = rows[i];

			y = row.index * blockSize + spacing
			for (x = 0; x < field.columns; x++) {
				for (j = 0; j < this.count; j++) {
					this.addParticle(blockSize / 2 + x * (blockSize + spacing),
							 y,
							 row.blocks[i].color);
				}
			}
		}
	},

	setDimensions: function (w, h) {
		this.particleSystem.createCanvas(w, h);
	},

	setOffset: function (o) {
		this.particleSystem.offset = o;
	},

	refresh: function (dt) {
		this.particleSystem.update($.noop, dt, FX.context());
	}
};

FX.Fireworks = {
	refreshInterval: 15,
	particleSystem: null,
	imageCache: null,
	count: 400,
	speed: 0.4,
	maxSpeed: 0.5,
	variance: 0.2,
	duration: 1000,
	gravity: 0.02,
	maxDelay: 150,
	size: 4,
	colors: ["#3030ED", "#EE2020", "#30ED30", "#C0C0C0"],

	init: function () {
		if (this.particleSysem) { return; }

		this.imageCache = [];

		this.colors.forEach(function (color) {
			var particle = new Particle;

			particle.radius = this.size;
			particle.setColor(color);
			this.imageCache.push(particle.drawCircle());
		}, this);

		this.particleSystem = new ParticleSystem("blur");
		this.particleSystem.fillColor = "rgba(200, 200, 200, 0.6)";
		this.particleSystem.createCanvas(500, 500);
	},

	createParticles: function (x, y, startDelay) {
		var i,
		    ps = this.particleSystem,
		    particle,
		    variance = this.variance,
		    speed = this.speed,
		    angle,
		    xVelocity, yVelocity,
		    canvas = this.imageCache[Math.floor(Math.random() * this.imageCache.length)];

		if (!startDelay) { startDelay = 0; }

		for (i = 0; i < this.count; i++) {
			angle = Math.random() * Math.PI * 2;
			xVelocity = Math.cos(angle) * (speed + (Math.random() * variance - variance / 2));
			yVelocity = Math.sin(angle) * (speed + (Math.random() * variance - variance / 2));

			particle = ps.createParticle();
			particle.delay = ~~(Math.pow(Math.random(), 3) * this.maxDelay + startDelay);
			particle.setVelocity(xVelocity, yVelocity);
			particle.duration = this.duration;
			particle.setPosition(x, y);
			particle.setAcceleration(-xVelocity / 50, this.gravity);
			particle.maxVelocity = new Vector(this.maxSpeed, this.maxSpeed);
			particle.canvas = canvas;
			particle.dirtyHistoryLength = 5;
			particle.radius = this.size;
		}
	},

	refresh: function (dt) {
		this.particleSystem.update(function (p) {
			if (Math.abs(p.velocity.x) < 0.01) {
				p.acceleration.x = 0;
				p.velocity.x = 0;
				p.setAcceleration(0, FX.Fireworks.gravity);
			}
		}, dt, FX.context());
	}
};

FX.Piece = {
	piece: null,
	count: 0,

	start: function (piece) {
		this.piece = piece;
		this.count = 6;
	},

	refresh: function (dt) {
		var piece = this.piece,
		    count = this.count,
		    context = Piece.context,
		    i;

		if (!piece) { return; }
		if (count === 2) {
			this.piece = null;
			return;
		}
	
		context.save();
		context.globalCompositeOperation = "lighter";
		for (i = 0; i < count; i++) {
			piece.draw();
		}

		context.restore();
		this.count--;
	}
};

FX.Streak = {
	start: function (piece) {
		
	},

	end: function (piece) {
	},

	refresh: function (dt) {
		
	}
};

FX.Dummy = {
	rows: null,
	field: null,

	setOffset: $.noop,
	init: $.noop,
	start: $.noop,
	refresh: $.noop
};

(function () {
var delayInterval = 300,
    velocity = 0.000085;

function xOffset(field, index) {
	return field.offset.x + index * Piece.blockSize + Piece.spacing;
}

function copyColumn(context, field, index) {
	context.drawImage($.canvas,
		xOffset(field, index), field.offset.y, Piece.blockSize, field.height,
		0, 0, Piece.blockSize, field.height);
}

function Column(field, index) {
	var canctx;

	canctx = $.createCanvas(Piece.blockSize, field.height);
	copyColumn(canctx[1], field, index);

	this.x = ~~(xOffset(field, index));
	this.y = this.startY = field.offset.y;
	this.width = Piece.blockSize;
	this.height = field.height;
	this.delay = Math.abs(Math.floor(field.columns / 2) - index - 1) * delayInterval;
	this.canvas = canctx[0];
}

Column.prototype = {
	x: 0,
	y: 0,
	width: 0,
	height: 0,
	startY: 0,
	elapsed: 0,
	delay: 0,
	canvas: null,

	update: function (dt) {
		if (this.delay > 0) {
			this.delay -= dt;
		}

		if (this.delay <= 0) {
			this.elapsed += dt;
			this.y = ~~(this.startY + Math.pow(this.elapsed, 2.3) * velocity);
		}
	},

	draw: function (context) {
		context.drawImage(this.canvas, this.x, this.y);
	}
};

FX.DropColumns = {
	active: false,
	columns: null,
	clippingRect: null,

	clear: $.noop,

	end: function () {
		this.active = false;
	},

	start: function (field) {
		var i,
		    columns = this.columns = [];

		for (i = 0; i < field.columns; i++) {
			columns.push(new Column(field, i));
		}

		this.clippingRect = {x: field.offset.x, y: field.offset.y, width: field.width, height: field.height};
		this.active = true;
		this.clear = field.clear.bind(field);
	},

	refresh: function (dt) {
		if (!this.active) { return; }

		var context = FX.context();

		this.clear();
		this.clear = $.noop;

		context.save();
		context.rect(this.clippingRect.x, this.clippingRect.y, this.clippingRect.width, this.clippingRect.height);
		context.clip();

		this.columns.forEach(function (column) {
			column.update(dt);
			column.draw(context);
			$.DirtyRects.add(context, column.x, column.y, column.width, column.height);
		});

		context.restore();
	}
};
})();

window.FX = FX;
})(window);
