var Movement = {};
Movement.Util = {};

/*
 * A Mover is responsible for the movement of a single object
 */
Movement.Mover = function (actions) {
	this.actions = actions;
	this.startTime = null;
};

Movement.Mover.prototype.update = function (receiver, now) {
	var skip = false;
	if (!this.startTime) { this.startTime = now; }
	for (var i = 0, len = this.actions.length; i < len && !skip; ++i) {
		skip = this.actions[i](receiver, this.startTime, now);
	}
};

Movement.createAction = function (spec) {
	var action,
	    runner;
	switch (typeof spec) {
	case "string":
		action =  new Movement.Action();
		runner = spec;
		break;
	case "object":
		for (a in spec) {
			action = new Movement.Action(spec[a]);
			runner = a;
		}
		break;
	}
	action.run = Movement.Action[runner];
	return action;
};

Movement.define = function (name, actions) {
	var processedActions = [],
	    mover;

	if (!actions) { actions = name, name = undefined; }

	actions = actions.map(function (a) { return Movement.createAction(a); }).
			  sort(function (a, b) { return a.properties.exclusive ? -1 : 1; });

	for (var i = 0, len = actions.length; i < len; ++i) {
		processedActions.push(actions[i].generate());
	}

	mover = new Movement.Mover(processedActions);
	if (name) { Movement[name] = mover; }
	return mover;
};

Movement.Action = function (properties) {
	var predicates = Movement.Action.predicates,
	    parameters = Movement.Action.parameters,
	    predicate,
	    value;

	this.predicates = [];
	this.properties = {};

	if (properties) {
		for (property in properties) {
			value = properties[property];
			if (predicate = predicates[property]) {
				this.predicates.push(predicate(value));
				delete properties[property];
			}
		}
		this.properties = properties;
	}
	if (!this.properties.delay) { this.properties.delay = 0; }
	this.properties.target = Movement.Util.player;
};

Movement.Action.prototype.generate = function () {
	var self = this;

	return function (receiver, startTime, now) {
		var properties = self.properties,
		    target = properties.target(),
		    distance = Movement.Util.distance(receiver, target);
		if (now - startTime < properties.delay) { return; }
		for (var i = 0, len = self.predicates.length; i < len; ++i) {
			if (self.predicates[i](receiver, target)) { return };
		}
		self.run.call(receiver, properties);
		return properties.exclusive;
	};
};

Movement.Action.predicates = {
	"if": function (cond) {
		cond = "return !(" + cond.replace("@distance", "Movement.Util.distance(receiver, target)") + ");";
		return Function("receiver, target", cond);
	}
};

Movement.Action.chase = function (params) {
	var target = params.target(),
	    velocity = params.velocity,
	    angle = params.angle;
	if (angle === undefined) {
		angle = Math.atan2(target.y + target.halfHeight - this.y, target.x + target.halfWidth- this.x);
	}
	this.vx = Math.cos(angle) * velocity;
	this.vy = Math.sin(angle) * velocity;
};

Movement.Action.flee = function (params) {
	var target = params.target(),
	    velocity = params.velocity,
	    angle = params.angle;
	if (angle === undefined) {
		angle = Math.atan2(this.y - target.y, this.x - target.x);
	}
	this.vx = Math.cos(angle) * velocity;
	this.vy = Math.sin(angle) * velocity;
};

Movement.Action.facePlayer = function (params) {
	var target = params.target();
	this.rotateTo(Math.atan2(target.y - this.y, target.x - this.x));
};

Movement.Action.aim = function (params, action) {
	var angle = params.angle,
	    velocity = params.velocity;
	if (this.aimed) { return; }

	this.eject = false;
	this.aimed = true;
	if (angle) {
		this.rotateTo(angle);
		this.vx = Math.cos(angle) * velocity;
		this.vy = Math.sin(angle) * velocity;
	} else {
		Movement.Action.facePlayer.call(this, params);
		Movement.Action.chase.call(this, params);
	}
};

Movement.Util.distance = function (p1, p2) {
	var dx = p2.x - p1.x,
	    dy = p2.y - p1.y;
	return Math.sqrt(dx * dx + dy * dy);
};

Movement.Util.player = function () {
	return ship;
};

Movement.define("stalker",
		[{chase: {"if": "@distance > 500", velocity: 50}},
		 {flee: {"if": "@distance < 300", velocity: 50}},
		 {aim: {delay: 6000, velocity: 500, exclusive: true}},
		 "facePlayer"]);
