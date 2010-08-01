/*
 * Viewport is the Canvas window into a larger world.
 */
$.Viewport = function (width, height, worldWidth, worldHeight) {
	this.width = width;
	this.height = height;
	this.halfWidth = Math.floor(width / 2);
	this.halfHeight = Math.floor(height / 2);
	this.worldWidth = worldWidth;
	this.worldHeight = worldHeight;
	this.left = 0;
	this.top = 0;
};

$.Viewport.prototype.draw = function (image) {
	$.context.drawImage(image.canvas, image.left - this.left, image.top - this.top);
};

$.Viewport.prototype.scrollTo = function (x, y) {
	var ox = this.left,
	    oy = this.top;

	if (x <= this.halfWidth) { this.left = 0; }
	else if (x + this.halfWidth > this.worldWidth) { this.left = this.worldWidth - this.width; }
	else { this.left = x - this.halfWidth; }

	if (y <= this.halfHeight) { this.top = 0; }
	else if (y + this.halfHeight > this.worldHeight) { this.top = this.worldHeight - this.height; }
	else { this.top = y - this.halfHeight; }

	return {x: this.left - ox, y: this.top - oy};
};
