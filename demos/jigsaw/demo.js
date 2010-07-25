function hline(oy, width, cells) {
	var y = oy,
	    cellWidth = width / cells,
	    holeWidth,
	    xm, x,
	    dy = 20,
	    rx, ry,
	    x2, y2, x3, y3, x4, y4,
	    cx1, cy1, cx2, cy2, cx3, cy3, cx4, cy4,
	    direction,
	    c = $.context;
	c.beginPath();
	for (var i = 0; i < cells; i++) {
		holeWidth = Math.floor(cellWidth / 4) + Math.floor(Math.random() * 10 - 5);
		rx = Math.random() * 5 + 5;
		ry = Math.random() * 5 - 2.5;
		if (i === cells) {
			x = x4;
			x4 = width - 1;
			y = y4;
		} else if (i === 0) {
			x = 0;
			x4 = x + cellWidth + Math.floor(Math.random() * 10 - 5);
			y = Math.floor(Math.random() * 10 - 5) + oy;
		} else {
			//x = Math.max(cellWidth * i + Math.floor(Math.random() * 10 - 5), 0);
			x = x4;
			x4 = i * cellWidth + cellWidth + Math.floor(Math.random() * 10 - 5);
			y = y4;
		}
		xm = x + cellWidth / 2;
		direction = Math.round(Math.random()) ? 1 : -1;
		dy *= direction;
		x2 = xm - cellWidth / 4;
		y2 = y - dy;
		x3 = xm + cellWidth / 4;
		y3 = y - dy;
		y4 = oy + ry;
		cx1 = x2 + rx + 5;
		cy1 = y + ry - 2;
		cx2 = x2;
		cy2 = y2 - dy;
		cx3 = x3;
		cy3 = cy2;
		cx4 = x3 - rx - 5;
		cy4 = cy1;
		c.moveTo(x, y);
		c.bezierCurveTo(cx1, cy1, cx1, cy1, x2, y2);
		c.bezierCurveTo(cx2, cy2, cx3, cy3, x3, y3);
		c.bezierCurveTo(cx4, cy4, cx4, cy4, x4, y4);
	}
	c.stroke();
}

window.addEventListener("load", function () {
	$.init("board", 800, 500);
	hline(50, 800, 10);
}, false);
