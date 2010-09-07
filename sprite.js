$.Sprite = function (imageName, height, options) {;
	if (imageName === undefined) { return; }
	var image,
	    width,
	    maxLength;

	this.canvas = document.createElement("canvas");
	this.context = this.canvas.getContext("2d");
	this.oCanvas = document.createElement("canvas");
	this.oContext = this.oCanvas.getContext("2d");

	if (typeof imageName === "number" && typeof height === "number") {
		width = imageName;
	} else {
		image = $.resource(imageName);
		options = height;
		width = image.width;
		height = image.height;
		this.resource = image;
		this.resourceName = imageName;
		this.steps = 150;
	}

	this.precompute = options.precompute;
	this.foreign = options.foreign;
	this.resize(width, height);
};

$.Sprite.precomputed = {};
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
		resource.canvas = document.createElement("canvas");
		resource.oCanvas = sprite.oCanvas;
		resource.width = resource.canvas.width = sprite.width;
		resource.halfWidth = sprite.halfWidth;
		resource.halfBaseWidth = sprite.halfBaseWidth;
		resource.height = resource.canvas.height = sprite.height;
		resource.halfHeight = sprite.halfHeight;
		resource.halfBaseHeight = sprite.halfBaseHeight;
		resource.context = resource.canvas.getContext("2d");
		$.Sprite.prototype.rotateTo.call(resource, rotation);
		delete resource.context;
		delete resource.imageData;
	}
	sprite.canvas = group[0].canvas;
	sprite.pixels = group[0].pixels;
}

function copyPixels() {
	this.context.clearRect(0, 0, this.width, this.height);
	this.context.drawImage(this.oCanvas, this.dx, this.dy);
	if (!this.foreign) {
		this.imageData = this.context.getImageData(0, 0, this.width, this.height);
		this.pixels = this.imageData.data;
	}
}


$.Sprite.prototype.x = null;
$.Sprite.prototype.y = null;
$.Sprite.prototype.left = null;
$.Sprite.prototype.top = null;
$.Sprite.prototype.right = null;
$.Sprite.prototype.bottom = null;
$.Sprite.prototype.width = null;
$.Sprite.prototype.height = null;
$.Sprite.prototype.rotation = 0;
$.Sprite.prototype.dx = 0;
$.Sprite.prototype.dy = 0;
$.Sprite.prototype.vx = 0;
$.Sprite.prototype.vy = 0;
$.Sprite.prototype.imageOffsetX = 0;
$.Sprite.prototype.imageOffsetY = 0;

$.Sprite.prototype.copyPixels = copyPixels;

$.Sprite.prototype.resize = function (width, height) {
	var maxLength,
	    image = this.resource;

	this.oWidth = width;
	this.oHeight = height;
	this.oCanvas.width = this.oWidth;
	this.oCanvas.height = this.oHeight;
	this.halfBaseWidth = this.oWidth / 2;
	this.halfBaseHeight = this.oHeight / 2;

	// the actual image canvas will be larger, to handle rotations
	maxLength = Math.sqrt(Math.pow(this.oWidth, 2) + Math.pow(this.oHeight, 2));
	this.width = this.height = this.imageWidth = this.imageHeight = Math.floor(maxLength);
	this.scanWidth = this.width * 4;
	this.halfWidth = maxLength / 2;
	this.halfHeight = maxLength / 2;
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.dx = Math.floor(this.width / 2 - this.halfBaseWidth);
	this.dy = Math.floor(this.height / 2 - this.halfBaseHeight);
	this.wall = false;

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
	this.left = Math.floor(x);
	this.top = Math.floor(y);
	this.right = this.left + this.width;
	this.bottom = this.top + this.height;
	return this;
};

$.Sprite.prototype.rotateTo = function (angle) {
	var width = this.width, height = this.height,
	    context = this.context,
	    increment,
	    rotated;

	if (this.precompute) {
		increment = Math.PI * 2 / this.steps;
		if (angle < 0) { angle += Math.PI * 2; }
		rotated = $.Sprite.precomputed[this.resourceName][Math.floor(angle / increment) * increment];
		this.canvas = rotated.canvas;
		this.pixels = rotated.pixels;
		return;
	}


	this.rotation = angle;

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

$.Sprite.prototype.draw = function () {
	$.context.drawImage(this.canvas, this.x - this.dx, this.y - this.dy);
};

$.Sprite.prototype.update = function (dt) {
	this.moveTo(this.x + this.vx * dt, this.y + this.vy * dt);
};
