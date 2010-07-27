function random(low, high) {
	return Math.random(high - low) + low;
}

function distance(x1, y1, x2, y2) {
	var dx2 = (x1 - x2) * (x1 - x2),
	    dy2 = (y1 - y2) * (y1 - y2);
	return Math.sqrt(dx2 + dy2);
}

function Rect(left, top, right, bottom) {
	this.x = left;
	this.y = top;
	this.right = right;
	this.bottom = bottom;
};

function Jigsaw(width, height) {
	var cellSize = 100,
	    hSize, vSize,
	    cx = width / cellSize,
	    cy  = height / cellSize,
	    canvas = document.createElement("canvas");;

	/* Try to divide rows and columns evenly, as close to the given cell size as possible */
	hSize = width / Math.ceil(cx);
	vSize = height / Math.ceil(cy);
	this.columns = Math.ceil(width / hSize);
	this.rows = Math.ceil(height / vSize);

	canvas.width = width;
	canvas.height = height;
	this.width = width;
	this.height = height;
	this.px = [0];
	this.py = [0];
	this.context = canvas.getContext("2d");

	for (y = 1; y < cy; y++) {
		this.hline(vSize * y, width, this.columns);
	}
	for (x = 1; x < cx; x++) {
		this.vline(hSize * x, height, this.rows);
	}
	this.px.push(width);
	this.py.push(height);
	this.pixels = this.context.getImageData(0, 0, width, height).data;
}

Jigsaw.prototype.rows = 0;
Jigsaw.prototype.columns = 0;

Jigsaw.prototype.cutPiece = function (imageData, col, row) {
	var piece,
	    coords = [],
	    b;
	tx = Math.floor((this.px[col] + this.px[col+1]) / 2);
	ty = Math.floor((this.py[row] + this.py[row+1]) / 2);
	b = new Rect(tx, ty, tx, ty);

	this.floodFill(tx, ty, coords, b);
	piece = new Piece(imageData, b, coords);
	piece.edges = new Rect(this.px[col], this.py[row], this.px[col+1], this.py[row+1]);
	piece.column = col;
	piece.row = row;
	return piece;
};

Jigsaw.prototype.floodFill = function (x, y, coords, bounds) {
	if (this.oob(x, y) || !this.isClear(x, y)) { return; };
	if (x < bounds.x) { bounds.x = x; }
	else if (x > bounds.right) { bounds.right = x; }
	if (y < bounds.y) { bounds.y = y; }
	else if (y > bounds.bottom) { bounds.bottom = y; }
	this.set(x, y);
	coords.push({x: x, y: y});
	this.floodFill(x+1, y, coords, bounds);
	this.floodFill(x-1, y, coords, bounds);
	this.floodFill(x, y+1, coords, bounds);
	this.floodFill(x, y-1, coords, bounds);
};

Jigsaw.prototype.oob = function (x, y) {
	return (x < 0 || y < 0 || x >= this.width || y >= this.height);
};

Jigsaw.prototype.isClear = function (x, y) {
	return this.pixels[y * this.width * 4 + x * 4 + 3] === 0;
};

Jigsaw.prototype.set = function (x, y) {
	var i = y * this.width * 4 + x * 4;
	this.pixels[i] = 0;
	this.pixels[i+1] = 0;
	this.pixels[i+2] = 0;
	this.pixels[i+3] = 255;
};

Jigsaw.prototype.hline = function (oy, width, cells) {
	var c = this.context,
	    px = this.px;
	c.beginPath();
	calculateEdge(oy, width, cells, function (x, y, x2, y2, x3, y3, x4, y4, cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4) {
		if (px.length < cells) { px.push(x4) }
		c.moveTo(x, y);
		c.bezierCurveTo(cx1, cy1, cx1, cy1, x2, y2);
		c.bezierCurveTo(cx2, cy2, cx3, cy3, x3, y3);
		c.bezierCurveTo(cx4, cy4, cx4, cy4, x4, y4);
	});
	c.stroke();
};

Jigsaw.prototype.vline = function (ox, height, cells) {
	var c = this.context,
	    py = this.py;
	c.beginPath();
	calculateEdge(ox, height, cells, function (y, x, y2, x2, y3, x3, y4, x4, cy1, cx1, cy2, cx2, cy3, cx3, cy4, cx4) {
		if (py.length < cells) { py.push(y4) }
		c.moveTo(x, y);
		c.bezierCurveTo(cx1, cy1, cx1, cy1, x2, y2);
		c.bezierCurveTo(cx2, cy2, cx3, cy3, x3, y3);
		c.bezierCurveTo(cx4, cy4, cx4, cy4, x4, y4);
	});
	c.stroke();
};

function calculateEdge(offset, length, cells, callback) {
	var y = offset,
	    cellWidth = length / cells,
	    xm, x,
	    dy = cellWidth / 6,
	    range = cellWidth / 20, rx, ry, rx4,
	    x2, y2, x3, y3, x4, y4,
	    cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4,
	    direction;

	for (var i = 0; i < cells; i++) {
		rx = random(range, range * 2);
		ry = random(-range/2, range/2);
		rx4 = random(-range, range);
		if (i === cells - 1) {
			x = x4;
			x4 = length;
			y = y4;
		} else if (i === 0) {
			x = 0;
			x4 = x + cellWidth + rx4;
			y = Math.random() * 10 - 5 + offset;
		} else {
			x = x4;
			x4 = i * cellWidth + cellWidth + rx4;
			y = y4;
		}
		xm = x + cellWidth / 2;
		direction = Math.round(Math.random()) ? 1 : -1;
		dy *= direction;
		x2 = xm - cellWidth / 5;
		y2 = y - dy;
		x3 = xm + cellWidth / 5;
		y3 = y - dy;
		y4 = offset + ry;
		cx1 = x2 + rx + range;
		cy1 = y + ry - range / 2.5;
		cx2 = x2;
		cy2 = y2 - dy;
		cx3 = x3;
		cy3 = cy2;
		cx4 = x3 - rx - range;
		cy4 = cy1;
		callback(x, y, x2, y2, x3, y3, x4, y4,
			 cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4);
	}
}

function init(width, height, imageData) {
	var jigsaw = new Jigsaw(width, height),
	    pieces = [], piece;

	// cut image via jigsaws
	for (var y = 0; y < jigsaw.rows; y++) {
		for (var x = 0; x < jigsaw.columns; x++) {
			piece = jigsaw.cutPiece(imageData, x, y);
			piece.moveTo(120*x, 120*y);
			piece.draw();
			pieces.push(piece);
		}
	}

	return pieces;
}

function Piece(imageData, bounds, coords) {
	$.Sprite.call(this, bounds.right - bounds.x + 1, bounds.bottom - bounds.y + 1);
	$.Sprite.prototype.updatePixels.call(this, function (width, height, pixels) {
		var pieceOffset, imageOffset,
		    point;

		for (var i = 0; i < coords.length; i++) {
			point = coords[i];
			imageOffset = point.y * imageData.width * 4 + point.x * 4;
			pieceOffset = (point.y - bounds.y) * width * 4 + (point.x - bounds.x) * 4;
			for (var j = 0; j < 4; j++) {
				pixels[pieceOffset + j] = imageData.data[imageOffset + j];
			}
		}
	});
}

Piece.prototype = new $.Sprite;
Piece.prototype.constructor = Piece;

/* not really a stack, just a convenient way to draw the most recently selected pieces last */
function DrawStack() {
	this.items = [];
}

DrawStack.prototype.moveToTop = function (item) {
	var items = this.items,
	    index = items.indexOf(item);
	if (index === -1 || (index === items.length - 1)) { return; }
	items.splice(index, 1);
	items.push(item);
};

DrawStack.prototype.push = function (item) {
	this.items.push(item);
};

DrawStack.prototype.draw = function () {
	var items = this.items;
	for (var i = 0; i < items.length; i++) {
		items[i].draw();
	}
};

function redraw(stack) {
	$.context.clearRect(0, 0, $.width, $.height);
	stack.draw();
}

function snap(piece, others) {
	var pe = piece.edges, oe,
	    other,
	    threshold = 10;
	for (var i = 0, l = others.length; i < l; i++) {
		other = others[i];
		oe = other.edges;
		if (piece.row === other.row - 1) { // above
			if (distance(pe.left, pe.bottom, oe.left, oe.top) < threshold) {
			}
		} else if (piece.row === other.row + 1) { // below
			if (distance(pe.left, pe.top, oe.left, oe.bottom) < threshold) {
			}
		} else if (piece.column === other.column - 1) { // left
			if (distance(pe.right, pe.top, oe.left, oe.top) < threshold) {
			}
		} else if (piece.column === other.column + 1) { // right
			if (distance(pe.left, pe.top, oe.right, oe.top) < threshold) {
			}
		}
	}
}

window.addEventListener("load", function () {
	var pieces, ctree, selectedPiece,
	    stack = new DrawStack();

	$.init("board", 1000, 700);
	$.loadImage("puzzle", "padbury.gif");
	ctree = new $.Quadtree(-250, -250, 1250, 950);

	$.mouseDown(function (x, y) {
		var point = new Rect(x, y, x+1, y+1),
		    items;
		items = ctree.queryItems(point);
		items.sort(function (a, b) {
			var items = stack.items;
			return items.indexOf(a) > items.indexOf(b) ? -1 : 1
		});
		for (var j = 0; j < items.length; j++) {
			if ($.testPoint(point, items[j])) {
				// select this piece
				selectedPiece = items[j];
				selectedPiece.mx = x - selectedPiece.x;
				selectedPiece.my = y - selectedPiece.y;
				stack.moveToTop(selectedPiece);
				break;
			}
		}
	});

	$.mouseUp(function (x, y) {
		if (!selectedPiece) { return; }
		selectedPiece.mx = 0;
		selectedPiece.my = 0;
		selectedPiece = null;
	});

	$.mouseMove(function (x, y) {
		var node;

		if (!selectedPiece) { return; }
		node = selectedPiece.collisionNode;
		if (!node.contains(selectedPiece)) {
			node.deleteItem(selectedPiece);
			ctree.insert(selectedPiece);
		}
		selectedPiece.moveTo(x - selectedPiece.mx, y - selectedPiece.my);
		snap(selectedPiece, ctree.queryItems(selectedPiece));
		redraw(stack);
	});

	$.loaded(function () {
		var image = $.resource("puzzle"),
		    canvas = document.createElement("canvas"),
		    context = canvas.getContext("2d"),
		    data;
		canvas.width = image.width;
		canvas.height = image.height;
		context.drawImage(image, 0, 0);
		data = context.getImageData(0, 0, image.width, image.height);
		pieces = init(image.width, image.height, data);
		for (var i = 0; i < pieces.length; i++) {
			ctree.insert(pieces[i]);
			stack.push(pieces[i]);
		}
	});
}, false);
