var Movement = {};
Movement.Util = {};

Movement.Mover = function (actions) {
	this.actions = actions;
};

Movement.Mover.prototype.update = function (receiver) {
	for (var i = 0, len = this.actions.length; i < len; ++i) {
		this.actions[i](receiver);
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

	for (var i = 0, len = actions.length; i < len; ++i) {
		processedActions.push(Movement.createAction(actions[i]).compile());
	}
	mover = new Movement.Mover(processedActions);
	Movement[name] = mover;
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
	this.properties.target = Movement.Util.player;
};

Movement.Action.prototype.compile = function () {
	var self = this;

	return function (receiver) {
		var target = self.properties.target(),
		    distance = Movement.Util.distance(receiver, target);
		for (var i = 0, len = self.predicates.length; i < len; ++i) {
			if (self.predicates[i](receiver, target)) { return };
		}
		self.run.call(receiver, self.properties);
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
	    velocity = params.velocity;
	angle = Math.atan2(target.y - this.y, target.x - this.x);
	this.vx = Math.cos(angle) * velocity;
	this.vy = Math.sin(angle) * velocity;
};

Movement.Action.flee = function (params) {
	var target = params.target(),
	    velocity = params.velocity;
	angle = Math.atan2(this.y - target.y, this.x - target.x);
	this.vx = Math.cos(angle) * velocity;
	this.vy = Math.sin(angle) * velocity;
};

Movement.Action.facePlayer = function (params) {
	var target = params.target();
	this.rotateTo(Math.atan2(target.y - this.y, target.x - this.x));
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
		 "facePlayer"]);
