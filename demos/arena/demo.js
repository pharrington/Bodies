function Bullet(x, y, angle) {
	var v = this.velocity,
	    _super = this._super;

	this.vx = Math.cos(angle) * v;
	this.vy = Math.sin(angle) * v;
	$.Sprite.call(this, "bullet");
	_super.moveTo.call(this, x, y);
	_super.rotateTo.call(this, angle);
}

Bullet.prototype = new $.Sprite;
Bullet.prototype._super = $.Sprite.prototype;
Bullet.prototype.constructor = Bullet;
Bullet.prototype.velocity = 800;

Bullet.prototype.update = function (dt) {
	var vx = this.vx * dt,
	    vy = this.vy * dt;
	this._super.moveTo.call(this, this.x + vx, this.y + vy);
};

var ship,
    bullets = [],
    arena,
    bg,
    viewport,
    width = 900, height = 600,
    px = 0, py = 0,
    angle = 0,
    bulletInterval = 150,
    paused = false;

function redraw() {
	bg.draw();
	viewport.draw(arena);
	viewport.draw(ship);
	bullets.forEach(function (b) { viewport.draw(b); });
}

function hitWall(bullet) {
	var index = bullets.indexOf(bullet);
	arena.deleteItem(bullet);
	if (index !== -1) { bullets.splice(index, 1) };
}

function interested(a, b) {
	return a.wall || b.wall;
}

addEventListener("load", function () {
	var addBullet = false,
	    lastTimeAdded = 0;
	document.getElementById("pause").addEventListener("click", function () {
		paused = !paused;
	}, false);

	$.init("field", width, height);
	$.mouseMove(function (x, y) {
		px = x;
		py = y;
	});

	$.mouseDown(function () {
		addBullet = true;
	});

	$.mouseUp(function () {
		addBullet = false;
	});
	$.loadImage("moth", "moth-small2.png");
	$.loadImage("ring", "outline.png");
	$.loadImage("bg", "grid.png");
	$.loadImage("bullet", "bullet.png");
	$.loaded(function () {
		ship = new $.Sprite("moth");
		ship.moveTo(44, 3560);
		ship.eject = true;
		ship.ax = 0;
		ship.ay = 0;
		ship.vx = 0;
		ship.vy = 0;
		ship.vMax = 350;
		ship.rotateTo(angle + Math.PI / 2);

		arena = new $.World("ring", 20);
		bg = new $.TiledBackground("bg", width, height);
		arena.insert(ship);
		viewport = new $.Viewport(width, height, arena.width, arena.height);
	});

	$.refresh(function (elapsed, now) {
		var vx, vy,
		    accel = 25,
		    stopAccel = -100,
		    dt = elapsed / 1000;

		ship.ax = ship.ay = stopAccel;

		if (!paused) {

			if ($.keys[65]) { // A, Left
				ship.ax = -accel;
			} else if ($.keys[68]) { // D, Right
				ship.ax = accel;
			}
			if ($.keys[87]) { // W, Up
				ship.ay = -accel;
			} else if ($.keys[83]) { // S, Down
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
			bg.moveTo(viewport.left * 0.6, viewport.top * 0.6);
			angle = Math.atan2(py - (ship.y - viewport.top + 12), px - (ship.x - viewport.left + 40));
			ship.rotateTo(angle + Math.PI / 2);

			if (addBullet) {
				if (now - lastTimeAdded > bulletInterval) {
					b = new Bullet((ship.x + ship.right) / 2 , (ship.y + ship.bottom) / 2, angle);
					bullets.push(b);
					arena.insert(b);
					lastTimeAdded = now;
				}
			}
			bullets.forEach(function (b) { b.update(dt); });
			arena.update(hitWall, interested);
			redraw();
		} /* end if (!paused) */
	}, 20);
}, false);
