var BulletEmitter = {};

Array.prototype.flatten = function () {
	var result = [],
	    i,
	    len,
	    item;
	for (i = 0, len = this.length; i < len; i++) {
		item = this[i];
		if (Object.prototype.toString.call(item) === "[object Array]") {
			Array.prototype.push.apply(result, item.flatten());
		} else {
			result.push(item);
		}
	}
	return result;
}

BulletEmitter.define = function(name, specs) {
	var emitter;

	if (!specs) {
		specs = name;
		name = undefined;
	}
	emitter = new BulletEmitter.Emitter(specs);
	if (name) { BulletEmitter[name] = emitter; }
	return emitter;
};

BulletEmitter.Timer = function () {
	this.lastUpdate = 0;
	this.iteration = 0;
};

BulletEmitter.Timer.prototype.hasElapsed = function (delay, period, now) {
	if (!this.lastUpdate) { this.lastUpdate = now; }
	if (now - this.lastUpdate > this.iteration * period + delay) {
		this.lastUpdate = now;
		this.iteration = 1;
		return true;
	}
};

function makeAction(spec) {
	if (spec.bullet instanceof BulletEmitter.Emitter) {
		return spec.bullet.actions.map(function (action) {
			var newSpec = {};
			newSpec.period = spec.period;
			newSpec.delay = spec.delay;
			newSpec.action = action;
			return new BulletEmitter.Action(newSpec);
		});
	} else {
		return new BulletEmitter.Action(spec);
	}
}

BulletEmitter.Emitter = function (specs) {
	this.actions = specs.map(makeAction).flatten();
};

BulletEmitter.Emitter.prototype.update = function (source, now) {
	var bullets = [],
	    mover,
	    origin;

	this.actions.forEach(function (action) {
		if (!action.update(source.id(), now)) { return; }
		mover = action.mover;
		origin = action.origin(source);
		bullets.push(new BulletEmitter.Bullet(mover, origin));
	}, this);

	return bullets;
};

BulletEmitter.Action = function (spec) {
	var bullet = spec.bullet,
	    action = spec.action;
	this.delay = spec.delay || 0;
	this.period = spec.period || 0;
	if (action) {
		this.delay += action.delay;
		this.mover = action.mover;
	} else {
		this.mover = Movement.define([bullet]); // i don't want to check for arrays :(
	}
	this.timers = {};
};

/* TODO: fix this bullshit */
BulletEmitter.Action.prototype.origin = function (source) {
	return {x: source.x + source.halfWidth, y: source.y + source.halfHeight};
};

BulletEmitter.Action.prototype.timer = function (id) {
	var timers = this.timers;
	if (!timers[id]) { timers[id] = new BulletEmitter.Timer; }
	return timers[id];
};

BulletEmitter.Action.prototype.update = function (id, now) {
	var timer = this.timer(id);

	return timer.hasElapsed(this.delay, this.period, now);
};

BulletEmitter.Bullet = function (mover, origin) {
	$.Sprite.call(this, "enemybullet", {precompute: true});
	this.mover = mover;
	this._super.moveTo.call(this, origin.x, origin.y);
	this.wall = false;
};

BulletEmitter.Bullet.inherit($.Sprite);
BulletEmitter.Bullet.prototype.collisionType = CENEMY | CBULLET;
BulletEmitter.Bullet.prototype.alive = true;

BulletEmitter.Bullet.prototype.update = function (dt, now) {
	this.mover.update(this, now);
	this._super.update.call(this, dt);
};

BulletEmitter.Bullet.prototype.die = function() {
	this.alive = false;
	bullets.deleteItem(this);
	arena.deleteItem(this);
};

function Bullet(x, y, angle) {
	$.Sprite.call(this, "bullet", true);
	var v = this.velocity,
	    _super = this._super,
	    cos = Math.cos(angle),
	    sin = Math.sin(angle),
	    dx = -this.halfWidth;
	    dy = -this.oHeight;

	this.vx = cos * v;
	this.vy = sin * v;
	this.ship = null;
	_super.moveTo.call(this, x + dx, y + dy);
	_super.rotateTo.call(this, angle);
}

Bullet.inherit($.Sprite);
Bullet.interval = 100;
Bullet.prototype.alive = true;
Bullet.prototype.power = 1;
Bullet.prototype.velocity = 800;
Bullet.prototype.collisionType = CPLAYER | CBULLET;

Bullet.prototype.die = function () {
	this.alive = false;
	this.ship.killBullet(this);
	arena.deleteItem(this);
};

BulletEmitter.define("simple", [
	{period: 3500, bullet: {aim: {velocity: 300}}}
]);

(function () {
	var spec = [],
	    delay,
	    steps = 6,
	    span = 250,
	    velocity = 150;
	for (var i = 0; i < steps; i++) {
		delay = i * span / steps;
		spec.push({period: 2000, delay: delay, bullet: {aim: {velocity: velocity}}});
		velocity += 60;
	}
	BulletEmitter.define("streak", spec);
})();
(function () {
	var spec = [],
	    delay,
	    angle,
	    steps = 20;
	    span = 500;
	for (var i = 0; i < steps; i++) {
		delay = i * span / steps;
		angle = 2 * Math.PI / steps * i;
		spec.push({period: 10000, delay: delay, bullet: {aim: {velocity: 300, angle: angle}}});
	}
	BulletEmitter.define("spiral", spec);
})();

BulletEmitter.define("spiral2", [{period: 1500, delay: 0, bullet: BulletEmitter.spiral}]);
BulletEmitter.define("composite", [
	{period: 10000, delay: 0, bullet: BulletEmitter.streak},
	{period: 10000, delay: 2000, bullet: BulletEmitter.streak},
	{period: 10000, delay: 4000, bullet: BulletEmitter.streak},
	{period: 10000, delay: 6000, bullet: BulletEmitter.streak},
	{period: 10000, delay: 4000, bullet: BulletEmitter.spiral}
]);
