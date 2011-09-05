(function (exports) {

var Shapes = {
	PieceList: ["I", "T", "O", "Z", "S", "L", "J"],
	I: $.inherit(Piece, {
		image: "orange",
		shapes: [
				[[0, 0, 0, 0, 0],
				 [0, 0, 0, 0, 0],
				 [0, 1, 1, 1, 1],
				 [0, 0, 0, 0, 0],
				 [0, 0, 0, 0, 0]],
				[[0, 0, 0, 0, 0],
				 [0, 0, 1, 0, 0],
				 [0, 0, 1, 0, 0],
				 [0, 0, 1, 0, 0],
				 [0, 0, 1, 0, 0]],
				[[0, 0, 0, 0, 0],
				 [0, 0, 0, 0, 0],
				 [1, 1, 1, 1, 0],
				 [0, 0, 0, 0, 0],
				 [0, 0, 0, 0, 0]],
				[[0, 0, 1, 0, 0],
				 [0, 0, 1, 0, 0],
				 [0, 0, 1, 0, 0],
				 [0, 0, 1, 0, 0],
				 [0, 0, 0, 0, 0]]
			]
	}),

	T: $.inherit(Piece, {
		image: "blue",
		shapes: [
				[[0, 1, 0],
				 [1, 1, 1],
				 [0, 0, 0]],
				[[0, 1, 0],
				 [0, 1, 1],
				 [0, 1, 0]],
				[[0, 0, 0],
				 [1, 1, 1],
				 [0, 1, 0]],
				[[0, 1, 0],
				 [1, 1, 0],
				 [0, 1, 0]]
			]
	}),

	O: $.inherit(Piece, {
		image: "yellow",
		shapes: [
				[[0, 1, 1],
				 [0, 1, 1],
				 [0, 0, 0]],
				[[0, 0, 0],
				 [0, 1, 1],
				 [0, 1, 1]],
				[[0, 0, 0],
				 [1, 1, 0],
				 [1, 1, 0]],
				[[1, 1, 0],
				 [1, 1, 0],
				 [0, 0, 0]]
			]
	}),

	Z: $.inherit(Piece, {
		image: "red",
		shapes: [
				[[1, 1, 0],
				 [0, 1, 1],
				 [0, 0, 0]],
				[[0, 0, 1],
				 [0, 1, 1],
				 [0, 1, 0]],
				[[0, 0, 0],
				 [1, 1, 0],
				 [0, 1, 1]],
				[[0, 1, 0],
				 [1, 1, 0],
				 [1, 0, 0]]
			]
	}),

	S: $.inherit(Piece, {
		image: "cyan",
		shapes: [
				[[0, 1, 1],
				 [1, 1, 0],
				 [0, 0, 0]],
				[[0, 1, 0],
				 [0, 1, 1],
				 [0, 0, 1]],
				[[0, 0, 0],
				 [0, 1, 1],
				 [1, 1, 0]],
				[[1, 0, 0],
				 [1, 1, 0],
				 [0, 1, 0]]
			]
	}),

	L: $.inherit(Piece, {
		image: "green",
		shapes: [
				[[1, 0, 0],
				 [1, 1, 1],
				 [0, 0, 0]],
				[[0, 1, 1],
				 [0, 1, 0],
				 [0, 1, 0]],
				[[0, 0, 0],
				 [1, 1, 1],
				 [0, 0, 1]],
				[[0, 1, 0],
				 [0, 1, 0],
				 [1, 1, 0]]
			]
	}),

	J: $.inherit(Piece, {
		image: "purple",
		shapes: [
				[[0, 0, 1],
				 [1, 1, 1],
				 [0, 0, 0]],
				[[0, 1, 0],
				 [0, 1, 0],
				 [0, 1, 1]],
				[[0, 0, 0],
				 [1, 1, 1],
				 [1, 0, 0]],
				[[1, 1, 0],
				 [0, 1, 0],
				 [0, 1, 0]]
			]
	})
};

var OffsetsJLSTZ = [
	[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	[[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
	[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
	[[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]]
];

var OffsetsI = [
	[[0, 0], [-1, 0], [2, 0], [-1, 0], [2, 0]],
	[[-1, 0], [0, 0], [0, 0], [0, 1], [0, -2]],
	[[-1, 1], [1, 1], [-2, 1], [1, 0], [-2, 0]],
	[[0, 1], [0, 1], [0, 1], [0, -1], [0, 2]]
];

var OffsetsO = [
	[[0, 0]],
	[[0, -1]],
	[[-1, -1]],
	[[-1, 0]]
];

function tryRotation(rotation) {
	var field = this.field,
	    piece = this.currentPiece,
	    position,
	    ox, oy,
	    dx, dy,
	    kicks,
	    from, to,
	    fromKick, toKick,
	    numKicks,
	    i;

	if (!piece) { return; }

	position = piece.gridPosition;
	ox = position.x;
	oy = position.y;

	kicks = piece.kickOffsets;

	from = piece.shapeIndex;
	piece.rotate(rotation);
	to = piece.shapeIndex;

	i = 0;
	numKicks = kicks[0].length;
	fromKick = kicks[from];
	toKick = kicks[to];

	/* try to eject the piece if a rotation collides with the field */
	do {
		dx = fromKick[i][0] - toKick[i][0];
		dy = fromKick[i][1] - toKick[i][1];

		position.x = ox + dx;
		position.y = oy - dy;
		i++;
	} while (i < numKicks && field.collision(piece));

	// rotation failed
	if (field.collision(piece)) {
		position.x = ox;
		position.y = oy;

		piece.shapeIndex = from;
		piece.setShape();
	}
}

(function setOffsets() {
	["J", "L", "S", "T", "Z"].forEach(function (shape) {
		Shapes[shape].kickOffsets = OffsetsJLSTZ;
	});

	Shapes.I.kickOffsets = OffsetsI;
	Shapes.O.kickOffsets = OffsetsO;
})();

(function setShapeCodes() {
	var i, len,
	    shape,
	    list = Shapes.PieceList;

	for (i = 0, len = list.length; i < len; i++) {
		shape = Shapes[list[i]];
		if (shape) { shape.code = i; }
	}
})();

var SRS = {
	shapes: Shapes,
	tryRotation: tryRotation,
	eachShape: function (callback) {
		callback(Shapes.I);
		callback(Shapes.O);
		callback(Shapes.J);
		callback(Shapes.L);
		callback(Shapes.S);
		callback(Shapes.Z);
		callback(Shapes.T);
	}
};

exports.RotationSystems = {
	SRS: SRS
};
})(window);
