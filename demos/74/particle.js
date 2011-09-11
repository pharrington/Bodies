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

	draw: $.noop,

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

	drawCircle: function (ctx) {
		if (this.delay > 0) { return; }

		var p = this.position,
		    percent = this.active / this.duration;

		ctx.fillStyle = this.color;
		ctx.globalAlpha = 1 - (percent * percent);

		ctx.beginPath();
		ctx.arc(~~p.x, ~~p.y, this.radius, Math.PI * 2, 0, false);
		ctx.fill();
	},

	drawGlow: function (ctx) {
		if (this.delay > 0) { return; }

		var p = this.position,
		    percent = this.active / this.duration;

		ctx.shadowBlur = this.radius;
		ctx.shadowColor = this.color;
		ctx.fillStyle = this.color;
		ctx.globalAlpha = 1 - (percent * percent);

		ctx.beginPath();
		ctx.arc(~~p.x, ~~p.y, this.radius, Math.PI * 2, 0);
		ctx.fill();

		ctx.shadowBlur = this.radius / 2;
		ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
		ctx.beginPath();
		ctx.arc(~~p.x, ~~p.y, this.radius / 2, Math.PI * 2, 0);
		ctx.fill();
	},

	createGradient: function (ctx) {
		var gradient = ctx.createRadialGradient(0, 0, 1, 0, 0, this.radius);
	},

	drawGradient: function (ctx) {
		if (this.delay > 0) { return; }

		var p = this.position,
		    x = ~~p.x, y = ~~p.y,
		    radius = this.radius,
		    percent = this.active / this.duration,
		    gradient = ctx.createRadialGradient(x, y, radius / 2, x, y, radius);

		gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
		gradient.addColorStop(1, this.color);

		ctx.fillStyle = gradient;
		ctx.globalAlpha = 1 - (percent * percent);

		ctx.beginPath();
		ctx.arc(x, y, radius, Math.PI * 2, 0);
		ctx.fill();
	},

	update: function (dt) {
		var pos = this.position,
		    tempVelocity = this._nVelocity;

		if (this.active === null) { return; }

		if (this.delay > 0) {
			this.delay -= dt;
			if (this.delay > 0) { return; }
		}

		this.active += dt;
		if (this.active >= this.duration) {
			this.reset();
			return;
		}

		this.velocity.iadd(this.acceleration);
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
		    length = distance.length();

		distance.idiv(length * length / this.power);
		particle.acceleration.iadd(distance);
	}
});

function ParticleSystem(preset) {
	var canctx;

	this.inactiveParticles = [];
	this.activeParticles = [];
	this._preallocate(1200);
	this.setPreset(preset);
}

ParticleSystem.Presets = {
	blur: {
		fillColor: "rgba(200, 200, 200, 0.6)",
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
		var canctx;

		this.width = w;
		this.height = h;

		canctx = $.createCanvas(this.width, this.height);
		this.canvas = canctx[0];
		this.context = canctx[1];
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
		var particle = this.inactiveParticles.shift(),
		    draw = navigator.userAgent.match(/Chrome/) ? "drawGlow" : "drawCircle";

		if (!particle) {
			particle = new Particle;
		}

		this.activeParticles.push(particle);
		particle.active = 0;
		particle.draw = Particle.prototype[draw];

		return particle;
	},

	update: function (dt, context) {
		var particles = this.activeParticles,
		    particle,
		    offset = this.offset,
		    buffer = this.context,
		    i = particles.length;

		if (!i) { return; }

		buffer.save();
		buffer.shadowBlur = 0;
		buffer.globalCompositeOperation = this.composite;
		buffer.fillColor = this.fillColor;
		buffer[this.clearOp](0, 0, this.width, this.height);
		buffer.restore();

		while (i--) {
			particle = particles[i];
			particle.update(dt);

			if (particle.active === null) {
				this.inactiveParticles.push(particle);
				particles.splice(i, 1);
				continue;
			}

			particle.draw(buffer);
		}
		context.drawImage(this.canvas, offset.x, offset.y);
	}
});
