/*
 * Viewport is the Canvas window into a larger world.
 */
$.Viewport = function (width, height, worldWidth, worldHeight) {
	this.width = width;
	this.height = height;
	this.boundaryx = Math.floor(width / 4);
	this.boundaryy = Math.floor(height / 4);
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
	    oy = this.top,
	    bx = this.boundaryx,
	    by = this.boundaryy;

	if (x <= bx) { this.left = 0; }
	else if (x + bx > this.worldWidth) { this.left = this.worldWidth - this.width; }
	else if (x < ox + bx) { this.left = x - bx; }
	else if (x > ox + this.width - bx) { this.left = x + bx - this.width; }

	if (y <= by) { this.top = 0; }
	else if (y + by > this.worldHeight) { this.top = this.worldHeight - this.height; }
	else if (y < oy + by) { this.top = y - by; }
	else if (y > oy + this.height - by) { this.top = y + by - this.height; }

	return {x: this.left - ox, y: this.top - oy};
};
