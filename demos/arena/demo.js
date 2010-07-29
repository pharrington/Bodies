function drawRect(rect) {
	var c = $.context;
	c.strokeStyle = "red";
	c.lineWidth = 1;
	c.strokeRect(rect.left - rect.dx, rect.top - rect.dy, rect.width, rect.height);
}

var ship,
    arena,
    bg,
    viewport,
    width = 900, height = 600,
    px = 0, py = 0,
    angle = 0,
    paused = false;


function redraw(context) {
	//context.clearRect(0, 0, width, height);
	bg.draw();
	viewport.draw(arena);
	viewport.draw(ship);
	/*
	arena.draw();
	ship.draw();
	*/
};

function contains(rect) {
	return ((rect.x >= this.left) &&
		(rect.right <= this.right) &&
		(rect.y >= this.top) &&
		(rect.bottom <= this.bottom));
}

addEventListener("load", function () {
	document.getElementById("pause").addEventListener("click", function () {
		paused = !paused;
	}, false);

	Bodies.init("field", width, height);
	Bodies.mouseMove(function (x, y) {
		px = x;
		py = y;
	});

	Bodies.loadImage("moth", "moth-small.png");
	Bodies.loadImage("ring", "outline.png");
	Bodies.loadImage("bg", "grid.png");
	Bodies.loaded(function () {
		ship = new Bodies.Sprite("moth");
		ship.moveTo(1000, 1000);
		ship.ax = 0;
		ship.ay = 0;
		ship.vx = 0;
		ship.vy = 0;
		ship.vMax = 250;
		ship.rotateTo(angle + Math.PI / 2);

		arena = new Bodies.World("ring", 20);
		bg = new Bodies.TiledBackground("bg", width, height);
		arena.insert(ship);
		viewport = new Bodies.Viewport(width, height, arena.width, arena.height);
	});

	Bodies.refresh(function (elapsed) {
		var vx, vy,
		    accel = 25,
		    stopAccel = -100,
		    dt = elapsed / 1000;

		ship.ax = ship.ay = stopAccel;

		if (!paused) {

		if (Bodies.keys[65]) { // A, Left
			ship.ax = -accel;
		} else if (Bodies.keys[68]) { // D, Right
			ship.ax = accel;
		}
		if (Bodies.keys[87]) { // W, Up
			ship.ay = -accel;
		} else if (Bodies.keys[83]) { // S, Down
			ship.ay = accel;
		}
	
		ship.vx += ship.ax;
		ship.vy += ship.ay;

		if (ship.ax === stopAccel) { // no X axis movement
			if (ship.vx < 0) {
				ship.vx = 0;
			}
		} else {
			if (ship.vx > ship.vMax) {
				ship.vx = ship.vMax;
			}
			if (ship.vx < -ship.vMax) {
				ship.vx = -ship.vMax;
			}
		}

		if (ship.ay === stopAccel) { // no Y axis movement
			if (ship.vy < 0) {
				ship.vy = 0;
			}
		} else {
			if (ship.vy > ship.vMax) {
				ship.vy = ship.vMax;
			}
			if (ship.vy < -ship.vMax) {
				ship.vy = -ship.vMax;
			}
		}
		vx = ship.vx * dt;
		vy = ship.vy * dt;
		ship.moveTo(ship.x + vx, ship.y + vy);
		viewport.scrollTo(ship.x, ship.y);
		bg.moveTo(viewport.left, viewport.top);
		angle = Math.atan2(py - (ship.y - viewport.top + 12), px - (ship.x - viewport.left + 40));
		ship.rotateTo(angle + Math.PI / 2);
		arena.update();
		redraw($.context);
		} //pause
	}, 17);
}, false);
