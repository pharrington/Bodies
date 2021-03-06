$.Sprite = function (imageName, height, options) {;
	if (imageName === undefined) { return; }
	var image,
	    width;

	options = options || {};
	this.canvas = document.createElement("canvas");
	this.context = this.canvas.getContext("2d");
	this.oCanvas = document.createElement("canvas");
	this.oContext = this.oCanvas.getContext("2d");

	if (typeof imageName === "number" && typeof height === "number") {
		width = imageName;
	} else {
		image = $.resource(imageName);
		options = height || {};
		width = image.width;
		height = image.height;
		this.resource = image;
		this.resourceName = imageName;
		this.steps = 150;
	}

	this.isDirty = false;
	this.wall = false;
	this.precompute = options.precompute;
	this.foreign = options.foreign;
	this.resize(width, height);
};

$.Sprite.precomputed = {};

$.Sprite.prototype.x = null;
$.Sprite.prototype.y = null;
$.Sprite.prototype.left = null;
$.Sprite.prototype.top = null;
$.Sprite.prototype.right = null;
$.Sprite.prototype.bottom = null;
$.Sprite.prototype.width = null;
$.Sprite.prototype.height = null;
$.Sprite.prototype.rotation = 0;
$.Sprite.prototype.ox = 0;
$.Sprite.prototype.oy = 0;
$.Sprite.prototype.dx = 0;
$.Sprite.prototype.dy = 0;
$.Sprite.prototype.vx = 0;
$.Sprite.prototype.vy = 0;
$.Sprite.prototype.imageOffsetX = 0;
$.Sprite.prototype.imageOffsetY = 0;

$.Sprite.prototype.setDirty = function () {
	this.dirty = true;
};

$.Sprite.prototype.resize = function (width, height) {
	var image = this.resource;

	this.oCanvas.width = this.oWidth = width;
	this.oCanvas.height = this.oHeight = height;
	this.halfBaseWidth = this.oWidth / 2;
	this.halfBaseHeight = this.oHeight / 2;

	setRotatedDimensions.call(this);


	if (image !== undefined) {
		this.oContext.drawImage(image, 0, 0);
		if (this.precompute) {
			preRotate(this);
		}
		else {
			copyPixels.call(this);
		}
	}
};

$.Sprite.prototype.moveTo = function (x, y) {
	this.x = x;
	this.y = y;

	this.ox = x - this.dx;
	this.oy = y - this.dy;

	this.left = Math.floor(x);
	this.top = Math.floor(y);

	this.right = this.left + this.width;
	this.bottom = this.top + this.height;
	return this;
};

$.Sprite.prototype.rotateTo = function (angle) {
	var context = this.context,
	    increment,
	    rotated,
	    width = this.width,
	    height = this.height;

	if (this.precompute) {
		increment = Math.PI * 2 / this.steps;

		if (angle < 0) { angle += Math.PI * 2; }

		rotated = $.Sprite.precomputed[this.resourceName][Math.floor(angle / increment) * increment];
		copyCachedProperties(rotated, this);
		return;
	}


	this.rotation = angle;
	setRotatedDimensions.call(this);

	context.clearRect(0, 0, width, height);
	context.save();
	context.translate(this.halfWidth, this.halfHeight);
	context.rotate(angle);
	context.translate(-this.halfBaseWidth, -this.halfBaseHeight);
	context.drawImage(this.oCanvas, 0, 0);
	context.restore();

	if (!this.foreign) {
		this.imageData = context.getImageData(0, 0, width, height);
		this.pixels = this.imageData.data;
	}
};

$.Sprite.prototype.rotate = function (angle) {
	this.rotation += angle;
	this.rotateTo(this.rotation);
};

$.Sprite.prototype.updatePixels = function (update) {
	if (this.foreign) { return; }
	var context = this.oContext,
	    data = context.getImageData(0, 0, this.oWidth, this.oHeight),
	    pixels = data.data;
	update(this.oWidth, this.oHeight, pixels);
	context.putImageData(data, 0, 0);
	if (this.rotation) {
		this.rotateTo(this.rotation);
	} else {
		copyPixels.call(this);
	}
};

$.Sprite.prototype.readPixels = function (callback) {
	if (this.foreign) { throw "Cannot update pixels of foreign source"; }

	var context = this.oContext,
	    data = context.getImageData(0, 0, this.oWidth, this.oHeight),
	    pixels = data.data;

	callback(this.oWidth, this.oHeight, pixels);
};

$.Sprite.prototype.draw = function (ctx) {
	ctx = ctx || $.context;
	ctx.drawImage(this.canvas, this.left, this.top);

	if (this.dirty) {
		$.DirtyRects.add(ctx, this.left, this.top, this.width, this.height);
		this.dirty = false;
	}
};

$.Sprite.prototype.update = function (dt) {
	this.moveTo(this.x + this.vx * dt, this.y + this.vy * dt);
};

function copyCachedProperties(from, to) {
	var props = ["pixels", "canvas", "width", "height", "dx", "dy"],
	    prop,
	    i, len;

	for (i = 0, len = props.length; i < len; i++) {
		prop = props[i];
		to[prop] = from[prop];
	}
}

function preRotate(sprite) {
	var group = $.Sprite.precomputed[sprite.resourceName],
	    resource,
	    increment,
	    steps = sprite.steps,
	    rotation;

	if (group) {
		sprite.canvas = group[0].canvas;
		sprite.pixels = group[0].pixels;
		return;
	}
	group = $.Sprite.precomputed[sprite.resourceName] = {};
	increment = Math.PI * 2 / steps;
	for (var i = 0; i < steps; ++i) {
		rotation = i * increment;
		resource = group[rotation] = {};

		resource.rotation = rotation;
		resource.oWidth = sprite.oWidth;
		resource.oHeight = sprite.oHeight;
		resource.halfBaseWidth = sprite.halfBaseWidth;
		resource.halfBaseHeight = sprite.halfBaseHeight;


		resource.canvas = document.createElement("canvas");
		resource.oCanvas = sprite.oCanvas;

		/* this also sets the canvas resource dimensions */
		setRotatedDimensions.call(resource);
		resource.context = resource.canvas.getContext("2d");

		$.Sprite.prototype.rotateTo.call(resource, rotation);

		delete resource.context;
		delete resource.imageData;
	}
	sprite.canvas = group[0].canvas;
	sprite.pixels = group[0].pixels;
}

function setRotatedDimensions() {
	var angle = this.rotation,
	    ow = this.oWidth,
	    oh = this.oHeight,
	    sin = Math.sin(angle),
	    cos = Math.cos(angle);

	this.canvas.width = this.imageWidth = this.width = Math.floor(Math.abs(oh * sin) + Math.abs(ow * cos));
	this.canvas.height = this.imageHeight = this.height = Math.floor(Math.abs(oh * cos) + Math.abs(ow * sin));
	this.halfWidth = this.width / 2;
	this.halfHeight = this.height / 2;
	this.scanWidth = this.width * 4;

	this.dx = (ow - this.width) / 2;
	this.dy = (oh - this.height) / 2;
	this.x = this.ox + this.dx;
	this.y = this.oy + this.dy;
	this.left = Math.floor(this.x);
	this.top = Math.floor(this.y);
}

function copyPixels() {
	this.context.clearRect(0, 0, this.width, this.height);
	this.context.drawImage(this.oCanvas, 0, 0);
	if (!this.foreign) {
		this.imageData = this.context.getImageData(0, 0, this.width, this.height);
		this.pixels = this.imageData.data;
	}
}

$.Sprite.prototype.copyPixels = copyPixels;
