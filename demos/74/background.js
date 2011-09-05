(function (exports) {

function Background(resource, offset) {
	var canctx = $.createCanvas(resource.width, resource.height);
	this.canvas = canctx[0];
	this.context = canctx[1];
	this.context.drawImage(resource, 0, 0);
	this.offset = offset;
}

Background.prototype = {
	canvas: null,
	context: null,
	offset: null,

	draw: function (ctx, dx, dy, w, h) {
		ctx.drawImage(this.canvas,
			this.offset.x, this.offset.y,
			w, h,
			dx, dy,
			w, h);
	},

	drawOffset: function (ctx, ox, oy, dx, dy, w, h) {
		ctx.drawImage(this.canvas,
			ox, oy,
			w, h,
			dx, dy,
			w, h);
	}
};

exports.Background = Background;
})(window);
