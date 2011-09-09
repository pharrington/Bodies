(function (exports) {

var Shapes = {
	PieceList: ["I", "T", "O", "Z", "S", "L", "J"],
	I: $.inherit(Piece, {
		initialPosition: {x: 2, y: -2},
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
		initialPosition: {x: 3, y: -1},
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
		initialPosition: {x: 3, y: -1},
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
		initialPosition: {x: 3, y: -1},
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
		initialPosition: {x: 3, y: -1},
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
		initialPosition: {x: 3, y: -1},
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
		initialPosition: {x: 3, y: -1},
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

exports.RotationSystems.SRS = {
	shapes: Shapes,
	tryRotation: tryRotation
};

})(window);
