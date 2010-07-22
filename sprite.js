$.Sprite = function (imageName) {
	var image = $.resource(imageName),
	    maxLength;

	this.x = null;
	this.y = null;
	this.left = null;
	this.top = null;
	this.right = null;
	this.bottom = null;
	this.rotation = 0;
	this.dx = this.dy = 0;
	this.imageOffsetX = 0;
	this.imageOffsetY = 0;

	this.canvas = document.createElement("canvas");
	this.context = this.canvas.getContext("2d");
	this.oCanvas = document.createElement("canvas");
	this.oContext = this.oCanvas.getContext("2d");
	this.oCanvas.width = this.oWidth = image.width;
	this.oCanvas.height = this.oHeight = image.height;
	this.halfBaseWidth = this.oWidth / 2;
	this.halfBaseHeight = this.oHeight / 2;


	// the actual image canvas will be larger, to handle rotations
	maxLength = Math.sqrt(Math.pow(image.width, 2) + Math.pow(image.height, 2));
	this.width = this.height = this.imageWidth = this.imageHeight = Math.floor(maxLength);
	this.halfWidth = maxLength / 2;
	this.halfHeight = maxLength / 2;
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.dx = Math.floor(this.width / 2 - this.halfBaseWidth);
	this.dy = Math.floor(this.height / 2 - this.halfBaseHeight);

	this.oContext.drawImage(image, 0, 0);
	this.context.drawImage(image, this.dx, this.dy);
	this.imageData = this.context.getImageData(0, 0, this.width, this.height);
	this.pixels = this.imageData.data;
	this.scanWidth = this.width * 4;
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
