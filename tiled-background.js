$.TiledBackground = function (resource, width, height) {
	var image = $.resource(resource),
	    rx = Math.floor(width / image.width) + 1,
	    ry = Math.floor(height / image.height) + 1;

	this.tileWidth = image.width;
	this.tileHeight = image.height;
	this.left = 0;
	this.top = 0;
	this.width = width;
	this.height = height;

	this.canvas = document.createElement("canvas");
	this.canvas.width = this.width + image.width;
	this.canvas.height = this.height + image.height;
	this.context = this.canvas.getContext("2d");
	this.context.fillStyle = "#000";
	this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

	for (var x = 0; x < rx; x++) {
		for (var y = 0; y < ry; y++) {
			this.context.drawImage(image, x * image.width, y * image.height);
		}
	}
};

$.TiledBackground.prototype.moveTo = function (x, y) {
	this.left = Math.floor(x % this.tileWidth);
	this.top = Math.floor(y % this.tileHeight);
};

$.TiledBackground.prototype.draw = function () {
	$.context.drawImage(this.canvas, -this.left, -this.top);
};
