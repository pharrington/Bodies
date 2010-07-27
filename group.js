$.Group = function () {
	this.items = [];
};

$.Group.prototype.insert = function (item) {
	this.items[this.items.length] = item;
};

$.Group.prototype.remove = function (item) {
	var index, items = this.items;
	if ((index = items.indexOf(item)) === -1) { return; }
	items.splice(index, 1);
};

$.Group.prototype.draw = function () {
	var items = this.items,
	    i = items.length;
	while (--i) {
		items[i].draw();
	}
	items[i].draw();
};
