$.DirtyRects = {
	list: [],

	add: function (ctx, left, top, width, height, intersect) {
		var last = this.list[this.list.length - 1];

		if (!intersect || !last || last.context !== ctx) {
			this.list.push({
				context: ctx,
				left: left,
				top: top,
				width: width,
				height: height,
			});
		} else {
			last.left = Math.min(last.left, left);
			last.top = Math.min(last.top, top);
			last.width = Math.max(left + width, last.left + last.width) - last.left;
			last.height = Math.max(top + height, last.top + last.height) - last.top;
		}
	},

	update: function (clearOp) {
		var list = this.list,
		    rect,
		    i, len;

		clearOp = clearOp || "clearRect";

		for (i = 0, len = list.length; i < len; i++) {
			rect = list[i];

			rect.context[clearOp](rect.left, rect.top, rect.width, rect.height);
		}

		this.list = [];
	}
};
