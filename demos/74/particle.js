$.extend = function (base, attrs) {
        var prop;

        for (prop in attrs) {
                if (attrs.hasOwnProperty(prop)) {
                        base[prop] = attrs[prop];
                }
        }

        return base;
};

function Color(r, g, b, a) {
	this.r = r;
	this.g = g;
	this.b = b;

	this.a = a === undefined ? 1 : a;
}

$.extend(Color, {
	fromString: function (str) {
		if (str[0] === "#") {
			str = str.substr(1);
		}

		return new Color(parseInt(str.substr(0, 2), 16),
				 parseInt(str.substr(2, 2), 16),
				 parseInt(str.substr(4, 2), 16),
				 1);
	},

	fromImageData: function (pixels, idx) {
		return new Color(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
	}
});

$.extend(Color.prototype, {
	toString: function () {
		return "rgba(" +
			this.r + "," +
			this.g + "," +
			this.b + "," +
			this.a + ")";
	}
});

function Particle() {
	this.position = new Vector(0, 0);
	this.velocity = new Vector(0, 0);
	this.acceleration = new Vector(0, 0);
	this.dirtyHistory = [];
}

$.extend(Particle.prototype, {
	color: null,
	image: null,
	gradient: null,
	delay: 0,
	duration: 0,
	radius: 3,
	position: new Vector(0, 0),
	velocity: new Vector(0, 0),
	acceleration: new Vector(0, 0),
	_nVelocity: new Vector(0, 0),
	active: null,
	dirtyHistory: null,
	dirtyHistoryLength: 0,

	setVelocity: function (x, y) {
		var v = this.velocity;

		v.x = x; v.y = y;
		this._nVelocity = v.copy();
	},

	setAcceleration: function (x, y) {
		var a = this.acceleration;

		a.x = x; a.y = y;
	},

	setPosition: function (x, y) {
		var p = this.position;

		p.x = x; p.y = y;
	},

	setColor: function (color) {
		this.color = color;
	},

	createCanvas: function (size) {
		var canctx = $.createCanvas(size, size);

		this.canvas = canctx[0];
		this.context = canctx[1];
	},

	drawCircle: function () {
		var ctx,
		    radius = this.radius;

		this.createCanvas(radius * 2);
		ctx = this.context;
		ctx.fillStyle = this.color.toString();

		ctx.beginPath();
		ctx.arc(radius, radius, radius, Math.PI * 2, 0);
		ctx.fill();

		return this.canvas;
	},

	drawGlow: function (ctx) {
		var ctx,
		    radius = this.radius;

		this.createCanvas(radius * 2);
		ctx = this.context;

		ctx.shadowBlur = radius;
		ctx.shadowColor = this.color.toString();
		ctx.fillStyle = this.color.toString();

		ctx.beginPath();
		ctx.arc(radius, radius, radius, Math.PI * 2, 0);
		ctx.fill();

		ctx.shadowBlur = radius / 2;
		ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
		ctx.beginPath();
		ctx.arc(radius, radius, radius / 2, Math.PI * 2, 0);
		ctx.fill();

		return this.canvas;
	},

	draw: function (ctx) {
		if (this.delay > 0) { return; }

		var p = this.position,
		    percent = this.percent,
		    alpha = ctx.globalAlpha,
		    x = p.x >>> 0,
		    y = p.y >>> 0,
		    size = this.radius * 2,
		    historyLength = this.dirtyHistoryLength,
		    dirtyRects = this.system.dirtyRects,
		    rect;

		ctx.globalAlpha = 1 - (percent * percent);
		ctx.drawImage(this.canvas, x, y);
		ctx.globalAlpha = alpha;

		if (historyLength === 0) {
			$.DirtyRects.add(ctx, x, y, size, size, true);
		} else {
			if (this.dirtyHistory.length === historyLength) {
				this.dirtyHistory.shift();
			}

			rect = {x: x, y: y, w: size, h: size};
			this.dirtyHistory.push(rect);

			while (--historyLength >= 0) {
				rect = this.dirtyHistory[historyLength];
				rect && dirtyRects.add(ctx, rect.x, rect.y, rect.w, rect.h, true);
			}

		}
	},

	update: function (dt) {
		var pos = this.position,
		    tempVelocity = this._nVelocity,
		    speed, scale;

		if (this.active === null) { return; }

		if (this.delay > 0) {
			this.delay -= dt;
			if (this.delay > 0) { return; }
		}

		this.active += dt;
		if (this.duration !== null && this.active >= this.duration) {
			this.reset();
			return;
		}

		this.velocity.iadd(this.acceleration);
		speed = this.velocity.length();
		if (speed > this.maxVelocity) {
			scale = this.maxVelocity / speed;
			this.velocity.imul(scale);
		}

		tempVelocity.x = this.velocity.x;
		tempVelocity.y = this.velocity.y;
		tempVelocity.imul(dt);
		pos.iadd(tempVelocity);
	},

	reset: function () {
		this.active = null;
		this.delay = 0;
	}
});

function Vector(x, y) {
	if (typeof x === "object" && "x" in x && "y" in x) {
		this.x = x.x;
		this.y = x.y;
	} else {
		this.x = x;
		this.y = y;
	}
}

$.extend(Vector.prototype, {
	iadd: function (v) {
		this.x += v.x;
		this.y += v.y;

		return this;
	},

	isub: function (v) {
		this.x -= v.x;
		this.y -= v.y;

		return this;
	},

	sub: function (v) {
		return new Vector(this).isub(v);
	},

	imul: function (factor) {
		this.x *= factor;
		this.y *= factor;

		return this;
	},

	mul: function (factor) {
		return new Vector(this).imul(factor);
	},

	idiv: function (factor) {
		this.x /= factor;
		this.y /= factor;

		return this;
	},

	floor: function () {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);

		return this;
	},

	zero: function () {
		this.x = 0;
		this.y = 0;

		return this;
	},

	length: function () {
		var x = this.x,
		    y = this.y;

		return Math.sqrt(x * x + y * y);
	},

	copy: function () {
		return new Vector(this.x, this.y);
	}
});

function Attractor(p, power) {
	this.position = new Vector(p);
	this.power = power;
}

$.extend(Attractor.prototype, {
	effect: function (particle) {
		var distance = this.position.sub(particle.position),
		    length = distance.length(),
		    accel, scale;

		distance.idiv(length * length / this.power);
		particle.acceleration.iadd(distance);

		accel = particle.acceleration.length();

		if (accel > particle.maxAcceleration) {
			scale = particle.maxAcceleration / accel;
			particle.acceleration.imul(scale);
		}
	}
});

function ParticleSystem(preset) {
	this.inactiveParticles = [];
	this.activeParticles = [];
	this._preallocate(1200);
	this.setPreset(preset);
	this.dirtyRects = Object.create($.DirtyRects, {
		list: {value: []}
	});
}

ParticleSystem.Presets = {
	blur: {
		fillColor: "rgba(100, 100, 100, 0.6)",
		composite: "source-in",
		clearOp: "fillRect"
	},

	clear: {
		fillColor: "rgba(0, 0, 0, 0)",
		composite: "source-over",
		clearOp: "clearRect"
	}
};

$.extend(ParticleSystem.prototype, {
	offset: {x: 0, y: 0},
	fillColor: "#000000",
	composite: "source-over",
	clearOp: "clearRect",
	inactiveParticles: null,
	activeParticles: null,
	width: null,
	height: null,

	_preallocate: function (count) {
		while (count--) {
			this.inactiveParticles.push(new Particle);
		}
	},

	createCanvas: function (w, h) {
		this.width = w;
		this.height = h;
	},

	setPreset: function (str) {
		var presets = ParticleSystem.Presets,
		    preset;

		if (!presets.hasOwnProperty(str)) { return; }

		preset = presets[str];
		for (key in preset) {
			if (!preset.hasOwnProperty(key)) { continue; }
			this[key] = preset[key];
		};
	},

	createParticle: function () {
		var particle = this.inactiveParticles.shift();

		if (!particle) {
			particle = new Particle;
		}

		this.activeParticles.push(particle);
		particle.active = 0;
		particle.system = this;

		return particle;
	},

	update: function (callback, dt, context) {
		var particles = this.activeParticles,
		    particle,
		    offset = this.offset,
		    i = particles.length;

		if (!i) { return; }

		context.save();
		context.globalCompositeOperation = this.composite;
		context.fillStyle = this.fillColor;
		this.dirtyRects.update(this.clearOp);
		context.globalCompositeOperation = "lighter";

		while (i--) {
			particle = particles[i];
			callback(particle);
			particle.update(dt);

			if (particle.active === null) {
				this.inactiveParticles.push(particle);
				particles.splice(i, 1);
				continue;
			}

			particle.draw(context);
		}

		context.restore();
	}
});
