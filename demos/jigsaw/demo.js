function random(low, high) {
	return Math.random(high - low) + low;
}

function hline(oy, width, cells) {
	var c = $.context;
	c.beginPath();
	calculateEdge(oy, width, cells, function (x, y, x2, y2, x3, y3, x4, y4, cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4) {
		c.moveTo(x, y);
		c.bezierCurveTo(cx1, cy1, cx1, cy1, x2, y2);
		c.bezierCurveTo(cx2, cy2, cx3, cy3, x3, y3);
		c.bezierCurveTo(cx4, cy4, cx4, cy4, x4, y4);
	});
	c.stroke();
}

function vline(ox, height, cells) {
	var c = $.context;
	c.beginPath();
	calculateEdge(ox, height, cells, function (y, x, y2, x2, y3, x3, y4, x4, cy1, cx1, cy2, cx2, cy3, cx3, cy4, cx4) {
		c.moveTo(x, y);
		c.bezierCurveTo(cx1, cy1, cx1, cy1, x2, y2);
		c.bezierCurveTo(cx2, cy2, cx3, cy3, x3, y3);
		c.bezierCurveTo(cx4, cy4, cx4, cy4, x4, y4);
	});
	c.stroke();
}

function calculateEdge(offset, length, cells, callback) {
	var y = offset,
	    cellWidth = length / cells,
	    holeWidth,
	    xm, x,
	    dy = cellWidth / 6,
	    rx, ry,
	    x2, y2, x3, y3, x4, y4,
	    cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4,
	    direction;

	for (var i = 0; i < cells; i++) {
		holeWidth = cellWidth / 4 + random(-5, 5);
		rx = random(5, 10);
		ry = random(-2.5, 2.5);
		if (i === cells) {
			x = x4;
			x4 = width - 1;
			y = y4;
		} else if (i === 0) {
			x = 0;
			x4 = x + cellWidth + random(-5, 5);
			y = Math.random() * 10 - 5 + offset;
		} else {
			x = x4;
			x4 = i * cellWidth + cellWidth + random(-5, 5);
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
		cx1 = x2 + rx + 5;
		cy1 = y + ry - 2;
		cx2 = x2;
		cy2 = y2 - dy;
		cx3 = x3;
		cy3 = cy2;
		cx4 = x3 - rx - 5;
		cy4 = cy1;
		callback(x, y, x2, y2, x3, y3, x4, y4,
			 cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4);
	}
}

window.addEventListener("load", function () {
	var width = 500,
	    height = 500,
	    cellSize = 100,
	    cx = Math.floor(width / cellSize),
	    cy = Math.floor(height / cellSize);
	$.init("board", 800, 500);
	for (var x = 1; x < cx; x++) {
		hline(cellSize * x, width, cy);
	}
	for (var y = 1; y < cy; y++) {
		vline(cellSize * y, height, cx);
	}
}, false);
