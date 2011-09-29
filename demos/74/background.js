(function (exports) {

function Background(resource, offset) {
	var canctx = $.createCanvas(resource.width, resource.height);

	this.canvas = document.getElementById("field_background");
	this.context = this.canvas.getContext("2d");

	this.canvas.width = resource.width;
	this.canvas.height = resource.height;
	this.context.drawImage(resource, 0, 0);
}

/*
 * Yeah this whole "background" concept needs some thought I guess
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
*/

exports.Background = Background;
})(window);
