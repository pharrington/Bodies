$.Quadtree = function (x, y, r, b) {
	this.isPartitioned = false;
	this.nodes = null;
	this.maxItems = 10;
	this.maxDepth = 3;
	this.items = [];
	this.left = x;
	this.top = y;
	this.right = r;
	this.bottom = b;
};

$.Quadtree.prototype.insert = function (item, depth) {
	var items = this.items,
	    itemsLength = items.length;

	// lets bail

	if (!this.contains(item.x, item.y, item.right, item.bottom)) {
		return;
	}

	if (depth === undefined) {
		depth = 0;
	}

	// for our posterity
	if (this.isPartitioned &&
	    !this.stradlesNodes(item)) {
		for (var i = 0; i < 4; i++) {
			this.nodes[i].insert(item, depth + 1);
		}
		return;
	}

	// lets split
	if (!this.isPartitioned &&
	    (itemsLength >= this.maxItems)  &&
	    !this.stradlesNodes(item) &&
	    (depth < this.maxDepth)) {
		this.createNodes();
		for (var i = 0; i < 4; i++) {
			this.nodes[i].insert(item, depth + 1);
		}
		return;
	}

	// add the item to this node
	item.collisionNode = this;
	items[itemsLength] = item;
};

$.Quadtree.prototype.createNodes = function () {
	var cX = (this.left + this.right) / 2,
	    cY = (this.top + this.bottom) / 2,
	    nodes = [];

	nodes[0] = new $.Quadtree(this.left, this.top, cX, cY);
	nodes[1] = new $.Quadtree(cX, this.top, this.right, cY);
	nodes[2] = new $.Quadtree(this.left, cY, cX, this.bottom);
	nodes[3] = new $.Quadtree(cX, cY, this.right, this.bottom);
	this.nodes = nodes;
	this.redistribute();
	this.isPartitioned = true;
};

$.Quadtree.prototype.redistribute = function () {
	var i = 0,
	    item = this.items[i],
	    nodes = this.nodes;

	while (item) {
		if (!this.stradlesNodes(item)) {
			this.deleteItem(item);
			nodes[0].insert(item);
			nodes[1].insert(item);
			nodes[2].insert(item);
			nodes[3].insert(item);
		} else {
			i++;
		}
		item = this.items[i];
	}
};

$.Quadtree.prototype.stradlesNodes = function (item) {
	var cX = (this.left + this.right) / 2,
	    cY = (this.top + this.bottom) / 2;

	return (((item.x < cX) && (item.right > cX)) ||
		((item.y < cY) && (item.bottom > cY)));
};

$.Quadtree.prototype.queryNodes = function (rect, nodes) {
	var x = rect.x,
	    y = rect.y,
	    r = rect.right,
	    b = rect.bottom;

	if (this.touches(x, y, r, b)) {
		nodes[nodes.length] = this;
	}
	
	if (this.isPartitioned) {
		for (var i = 0; i < 4; i++) {
			this.nodes[i].queryNodes(rect, nodes);
		}
	}
};

$.Quadtree.prototype.queryItems = function (rect) {
	var nodes = [],
	    items = [];
	this.queryNodes(rect, nodes);
	for (var i = 0, l = nodes.length; i < l; ++i) {
		Array.prototype.push.apply(items, nodes[i].items);
	}
	return items;
};

$.Quadtree.prototype.contains = function (x, y, r, b) {
	return ((x >= this.left) &&
		(r <= this.right) &&
		(y >= this.top) &&
		(b <= this.bottom));
};

$.Quadtree.prototype.touches = function (x, y, r, b) {
	return !(x > this.right ||
		r < this.left ||
		y > this.bottom ||
		b < this.top);
};

$.Quadtree.prototype.deleteItem = function (item) {
	var index,
	    items = this.items;
	if ((index = items.indexOf(item)) === -1) {
		return;
	}
	items.splice(index, 1);
};
