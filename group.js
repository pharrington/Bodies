$.Group = function (pieces) {
	this.items = [];
	if (pieces !== undefined) {
		for (var i = 0; i < pieces.length; i++) {
			this.insert(pieces[i]);
		}
	}
};

$.Group.prototype.x = 0;
$.Group.prototype.y = 0;

$.Group.prototype.insert = function (item) {
	var items = this.items;
	if (items.indexOf(items) !== -1) { return; }
	item.group = this;
	items[items.length] = item;
};

$.Group.prototype.remove = function (item) {
	var index, items = this.items;
	if ((index = items.indexOf(item)) === -1) { return; }
	items.splice(index, 1);
};

$.Group.prototype.merge = function (other) {
	if (other === this) { return; }
	var item,
	    items = other.items;

	for (var i = 0; i < items.length; i++) {
		this.insert(items[i]);
	}
	items.length = 0;
};

$.Group.prototype.moveTo = function (x, y) {
	var dx = x - this.x,
	    dy = y - this.y,
	    items = this.items,
	    item;

	this.x = x;
	this.y = y;
	for (var i = 0; i < items.length; i++) {
		item = items[i];
		item.moveTo(item.x + dx, item.y + dy, true);
	}
};

$.Group.prototype.draw = function () {
	var items = this.items, i;
	for (i = 0; i < items.length; i++) {
		items[i].draw();
	}
};
