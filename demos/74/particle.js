$.extend = function (base, attrs) {
        var prop;

        for (prop in attrs) {
                if (attrs.hasOwnProperty(prop)) {
                        base[prop] = attrs[prop];
                }
        }

        return base;
};

function Pixel(r, g, b, a) {
	this.r = r;
	this.g = g;
	this.b = b;

	this.a = a === undefined ? 255 : a;
}

$.extend(Pixel, {
	fromString: function (str) {
		if (str[0] === "#") {
			str = str.substr(1);
		}

		return new Pixel(parseInt(str.substr(0, 2), 16),
				 parseInt(str.substr(2, 2), 16),
				 parseInt(str.substr(4, 2), 16),
				 255);
	},

	fromImageData: function (pixels, idx) {
		return new Pixel(pixels[idx], pixels[idx + 1], pixels[idx + 2], pixels[idx + 3]);
	}
});

$.extend(Pixel.prototype, {
	toString: function () {
		return "rgba(" +
			this.r + "," +
			this.g + "," +
			this.b + "," +
			this.a + ")";
	}
});

function Particle(p, v, a) {
	this.position = p;
	this.velocity = v || new Vector(0, 0);
	this.acceleration = a || new Vector(0, 0);

	this._nVelocity = new Vector(this.velocity.x, this.velocity.y);
}

$.extend(Particle.prototype, {
	color: null,

	draw: function (imageData, color) {
		var p = this.position,
		    c = color || this.color,
		    idx,
		    pixels = imageData.data;
		   
		if (p.x < 0 || p.y < 0 || p.x > imageData.width || p.y > imageData.height) { return; }
		idx = (Math.floor(p.y) * imageData.width + Math.floor(p.x)) * 4;

		pixels[idx] = c.r;
		pixels[idx + 1] = c.g;
		pixels[idx + 2] = c.b;
		pixels[idx + 3] = c.a;
	},

	update: function (dt) {
		this.velocity.iadd(this.acceleration);
		this._nVelocity.x = this.velocity.x;
		this._nVelocity.y = this.velocity.y;
		this._nVelocity.imul(dt);
		this.position.iadd(this._nVelocity);
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
