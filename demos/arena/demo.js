var ship,
    arena,
    width = 900, height = 600,
    px = 0, py = 0,
    angle = 0,
    paused = false;


function redraw(context) {
	context.clearRect(0, 0, width, height);
	arena.draw();
	ship.draw();
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
	Bodies.loadImage("ring", "ring.png");
	Bodies.loaded(function () {
		ship = new Bodies.Sprite("moth");
		ship.moveTo(400, 300);
		ship.ax = 0;
		ship.ay = 0;
		ship.vx = 0;
		ship.vy = 0;
		ship.vMax = 350;
		ship.rotateTo(angle + Math.PI / 2);

		arena = new Bodies.World("ring");
		arena.insert(ship);
	});

	Bodies.refresh(function (elapsed) {
		var vx, vy,
		    accel = 12.5;

		ship.ax = ship.ay = -100;

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

		if (ship.ax === -2) { // no X axis movement
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

		if (ship.ay === -2) { // no Y axis movement
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
		ship.vx *= elapsed / 1000;
		ship.vy *= elapsed / 1000;
		ship.moveTo(ship.x + ship.vx, ship.y + ship.vy);
		angle = Math.atan2(py - (ship.y + ship.height / 2), px - (ship.x + ship.width / 2));
		ship.rotateTo(angle + Math.PI / 2);
		arena.update();
		redraw($.context);
		} //pause
	});
}, false);
