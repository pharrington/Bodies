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

/*
 * draw the tiled image to the back buffer, than draw that to the display canvas 
 */
$.TiledBackground.prototype.draw = function () {
	var c = this.bContext,
	    img = this.canvas,
	    l = this.left,
	    t = this.top;

	$.context.drawImage(img, -l, -t);
};
