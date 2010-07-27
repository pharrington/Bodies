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
	var items = this.items, i;
	for (i = 0; i < items.length; i++) {
		items[i].draw();
	}
};
