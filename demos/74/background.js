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
		var alpha = ctx.globalAlpha;

		ctx.globalAlpha = 1;
		ctx.drawImage(this.canvas,
			this.offset.x, this.offset.y,
			w, h,
			dx, dy,
			w, h);

		ctx.globalAlpha = alpha;
	},

	drawOffset: function (ctx, ox, oy, dx, dy, w, h) {
		var alpha = ctx.globalAlpha;

		if (ox < 0 || oy < 0) { return; }

		ctx.globalAlpha = 1;
		ctx.drawImage(this.canvas,
			ox, oy,
			w, h,
			dx, dy,
			w, h);

		ctx.globalAlpha = alpha;
	}
};

exports.Background = Background;
})(window);
