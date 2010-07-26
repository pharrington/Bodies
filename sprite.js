$.Sprite = function (imageName, height) {
	var image,
	    maxLength;

	this.canvas = document.createElement("canvas");
	this.context = this.canvas.getContext("2d");
	this.oCanvas = document.createElement("canvas");
	this.oContext = this.oCanvas.getContext("2d");

	if (typeof imageName === "number" && typeof height === "number") {
		this.oWidth = imageName;
		this.oHeight = height;
	} else {
		image = $.resource(imageName);
		this.oWidth = image.width;
		this.oHeight = image.height;
	}

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

	if (image !== undefined) {
		this.oContext.drawImage(image, 0, 0);
		this.context.drawImage(image, this.dx, this.dy);
		this.imageData = this.context.getImageData(0, 0, this.width, this.height);
		this.pixels = this.imageData.data;
	}
};

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
$.Sprite.prototype.imageOffsetX = 0;
$.Sprite.prototype.imageOffsetY = 0;

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
	    context = this.context;

	this.rotation = angle;

	context.clearRect(0, 0, width, height);
	context.save();
	context.translate(this.halfWidth, this.halfHeight);
	context.rotate(angle);
	context.translate(-this.halfBaseWidth, -this.halfBaseHeight);
	context.drawImage(this.oCanvas, 0, 0);
	context.restore();

	// ImageData/CanvasPixelArray allocations get out of control with the next line.
	// The alternative would be to create and store a seperate collision mask for the sprite, and manually rotate that - MAD slow :(
	this.imageData = context.getImageData(0, 0, width, height);
	this.pixels = this.imageData.data;
};

$.Sprite.prototype.rotate = function (angle) {
	this.rotation += angle;
	this.rotateTo(this.rotation);
};

$.Sprite.prototype.draw = function () {
	$.context.drawImage(this.canvas, this.x - this.dx, this.y - this.dy);
};
