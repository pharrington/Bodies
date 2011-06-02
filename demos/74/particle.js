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
}

$.extend(Particle.prototype, {
	color: null,
	image: null,
	duration: 0,
	position: new Vector(0, 0),
	velocity: new Vector(0, 0),
	acceleration: new Vector(0, 0),
	_nVelocity: new Vector(0, 0),
	active: null,

	setVelocity: function (v) {
		this.velocity = v;
		this._nVelocity = v.copy();
	},

	setAcceleration: function (a) {
		this.acceleration = a;
	},

	setPosition: function (p) {
		this.position = p;
	},

	setColor: function (color) {
		this.color = Color.fromString(color);
	},

	draw: function (ctx) {
		var p = this.position;

		ctx.fillStyle = this.color.toString();
		ctx.beginPath();
		ctx.arc(p.x, p.y, 3, Math.PI * 2, 0);
		ctx.fill();
	},

	update: function (dt) {
		var pos = this.position,
		    percent,
		    tempVelocity = this._nVelocity;

		if (this.active === null) { return; }

		this.active += dt;
		if (this.active >= this.duration) {
			this.active = null;
			return;
		}

		percent = this.active / this.duration;
		this.color.a = 1 - (percent * percent);

		this.velocity.iadd(this.acceleration);
		tempVelocity.x = this.velocity.x;
		tempVelocity.y = this.velocity.y;
		tempVelocity.imul(dt);
		pos.iadd(tempVelocity);
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

function ParticleSystem() {
	var canctx;

	this.inactiveParticles = [];
	this.activeParticles = [];
	this._preallocate(1200);
	canctx = $.createCanvas(332, 662);
	this.canvas = canctx[0];
	this.context = canctx[1];
}

$.extend(ParticleSystem.prototype, {
	inactiveParticles: null,
	activeParticles: null,

	_preallocate: function (count) {
		while (count--) {
			this.inactiveParticles.push(new Particle);
		}
	},

	createParticle: function () {
		var particle = this.inactiveParticles.shift();

		if (!particle) {
			particle = new Particle;
		}

		this.activeParticles.push(particle);
		particle.active = 0;

		return particle;
	},

	update: function (dt, context) {
		var particles = this.activeParticles,
		    particle,
		    buffer = this.context,
		    i = particles.length;

		buffer.save();
		buffer.globalCompositeOperation = "source-in";
		buffer.fillColor = "rgba(20, 20, 20, 0.6)";
		buffer.fillRect(0, 0, 332, 662);
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
		context.drawImage(this.canvas, 0, 0);
	}
});
