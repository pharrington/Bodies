(function (exports) {

var Shapes = {
	PieceList: ["I", "T", "O", "Z", "S", "L", "J"],
	I: $.inherit(Piece, {
		initialPosition: {x: 3, y: 0},
		image: "orange",
		shapes: [
				[[0, 0, 0, 0],
				 [1, 1, 1, 1],
				 [0, 0, 0, 0],
				 [0, 0, 0, 0]],
				[[0, 0, 1, 0],
				 [0, 0, 1, 0],
				 [0, 0, 1, 0],
				 [0, 0, 1, 0]]
			]
	}),

	T: $.inherit(Piece, {
		initialPosition: {x: 3, y: 0},
		image: "blue",
		shapes: [
				[[0, 0, 0],
				 [1, 1, 1],
				 [0, 1, 0]],
				[[0, 1, 0],
				 [1, 1, 0],
				 [0, 1, 0]],
				[[0, 0, 0],
				 [0, 1, 0],
				 [1, 1, 1]],
				[[0, 1, 0],
				 [0, 1, 1],
				 [0, 1, 0]]
			]
	}),

	O: $.inherit(Piece, {
		initialPosition: {x: 4, y: 1},
		image: "yellow",
		shapes: [
				[[1, 1],
				 [1, 1]]
			]
	}),

	Z: $.inherit(Piece, {
		initialPosition: {x: 3, y: 0},
		image: "red",
		shapes: [
				[[0, 0, 0],
				 [1, 1, 0],
				 [0, 1, 1]],
				[[0, 0, 1],
				 [0, 1, 1],
				 [0, 1, 0]]
			]
	}),

	S: $.inherit(Piece, {
		initialPosition: {x: 3, y: 0},
		image: "cyan",
		shapes: [
				[[0, 0, 0],
				 [0, 1, 1],
				 [1, 1, 0]],
				[[1, 0, 0],
				 [1, 1, 0],
				 [0, 1, 0]]
		]
	}),

	L: $.inherit(Piece, {
		initialPosition: {x: 3, y: 0},
		image: "green",
		shapes: [
				[[0, 0, 0],
				 [1, 1, 1],
				 [1, 0, 0]],
				[[1, 1, 0],
				 [0, 1, 0],
				 [0, 1, 0]],
				[[0, 0, 0],
				 [0, 0, 1],
				 [1, 1, 1]],
				[[0, 1, 0],
				 [0, 1, 0],
				 [0, 1, 1]]
			]
	}),

	J: $.inherit(Piece, {
		initialPosition: {x: 3, y: 0},
		image: "purple",
		shapes: [
				[[0, 0, 0],
				 [1, 1, 1],
				 [0, 0, 1]],
				[[0, 1, 0],
				 [0, 1, 0],
				 [1, 1, 0]],
				[[0, 0, 0],
				 [1, 0, 0],
				 [1, 1, 1]],
				[[0, 1, 1],
				 [0, 1, 0],
				 [0, 1, 0]]
			]
	})
};

function tryRotation(rotation) {
	var field = this.field,
	    piece = this.currentPiece;

	if (!piece) { return; }

	piece.rotate(rotation);

	/* try to eject the piece if a rotation collides with the field */
	if (field.collision(piece)) {
		piece.moveLeft();

		if (field.collision(piece)) {
			piece.moveRight();
			piece.moveRight();

			if (field.collision(piece)) {
				piece.moveLeft();
				rotation === Piece.Rotation.CW ? piece.rotateCCW() : piece.rotateCW();
			}
		}
	}
}

(function setShapeCodes() {
	var i, len,
	    shape,
	    list = Shapes.PieceList;

	for (i = 0, len = list.length; i < len; i++) {
		shape = Shapes[list[i]];
		if (shape) { shape.code = i; }
	}
})();

exports.RotationSystems.TGM = {
	shapes: Shapes,
	tryRotation: tryRotation
};

})(window);
