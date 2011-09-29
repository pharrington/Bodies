$.DirtyRects = {
	list: [],

	add: function (ctx, left, top, width, height) {
		this.list.push({
			context: ctx,
			left: left,
			top: top,
			width: width,
			height: height
		});
	},

	update: function () {
		var list = this.list,
		    rect,
		    i, len;

		for (i = 0, len = list.length; i < len; i++) {
			rect = list[i];

			rect.context.clearRect(rect.left, rect.top, rect.width, rect.height);
		}

		this.list = [];
	}
};
