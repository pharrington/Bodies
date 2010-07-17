var ship,
    width = 900, height = 600,
    px = 0; py = 0,
    angle = 0;

addEventListener("load", function () {
	Bodies(width, height);
	Bodies.mouseMove(function (x, y) {
		px = x;
		py = y;
	});

	Bodies.loadImage("moth", "moth-small.png");
	Bodies.loaded(function () {
		ship = new Bodies.Sprite("moth");
		ship.moveTo(400, 200);
		ship.ax = 0;
		ship.ay = 0;
		ship.vx = 0;
		ship.vy = 0;
		ship.vMax = 10;
	});

	Bodies.refresh(function (context) {
		var vx, vy,
		    accel = 0.25;

		ship.ax = ship.ay = -2;

		if (Bodies.Keys[65]) { // A, Left
			ship.ax = -accel;
		} else if (Bodies.Keys[68]) { // D, Right
			ship.ax = accel;
		}
		if (Bodies.Keys[87]) { // W, Up
			ship.ay = -accel;
		} else if (Bodies.Keys[83]) { // S, Down
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
		ship.moveTo(ship.x + ship.vx, ship.y + ship.vy);
		angle = Math.atan2(py - ship.y, px - ship.x);
		ship.rotateTo(angle + Math.PI / 2);
		context.clearRect(0, 0, width, height);
		ship.draw();
	});
}, false);