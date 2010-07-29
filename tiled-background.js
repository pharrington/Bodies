$.TiledBackground = function (resource, width, height) {
	var image = $.resource(resource),
	    rx = Math.floor(width / image.width),
	    ry = Math.floor(height / image.height);

	this.left = 0;
	this.top = 0;
	this.rw = width % image.width;
	this.rh = height % image.height;
	this.width = width - this.rw;
	this.height = height - this.rh;
	this.right = this.width;
	this.bottom = this.height;
	this.canvas = document.createElement("canvas");
	this.canvas.width = this.width;
	this.canvas.height = this.height;
	this.context = this.canvas.getContext("2d");
 
	this.context.fillStyle = "#000";
	this.context.fillRect(0, 0, this.width, this.height);
	for (var x = 0; x < rx; x++) {
		for (var y = 0; y < ry; y++) {
			this.context.drawImage(image, x * image.width, y * image.height);
		}
	}
};

$.TiledBackground.prototype.moveTo = function (x, y) {
	this.left = Math.floor(x % this.width);
	this.top = Math.floor(y % this.height);
	this.right = Math.floor(this.width - this.left);
	this.bottom = Math.floor(this.height - this.top);
};

$.TiledBackground.prototype.draw = function () {
	var c = $.context,
	    img = this.canvas,
	    l = this.left,
	    t = this.top,
	    r = this.right,
	    b = this.bottom,

	c.drawImage(img, -l, -t);
	if (l) { c.drawImage(img, r, -t); }
	if (t) { c.drawImage(img, -l, b); }
	if (l && t) { c.drawImage(img, r, b); }
};
