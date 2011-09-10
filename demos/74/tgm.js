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

var exceptions = {
	J: {
		0: [[1, 2], [1, 0]],
		2: [[1, 0], [1, 1]]
	},
	L: {
		0: [[1, 2], [1, 0]],
		2: [[1, 0], [1, 1]]
	},
	T: {
		0: [[1, 0]],
		2: [[1, 0]]
	}
};

function tryRotation(rotation) {
	var field = this.field,
	    piece = this.currentPiece,
	    allowKick = true,
	    x, y,
	    shape,
	    blocked,
	    from;

	if (!piece) { return; }

	from = piece.shapeIndex;
	piece.rotate(rotation);

	/* try to eject the piece if a rotation collides with the field
	 * move right, than move left
	 */ 
	if (field.collision(piece)) {
		// exceptions
		if (piece.code === Shapes.PieceList.indexOf("I")) {
			allowKick = false;
		}

		shape = Shapes.PieceList[piece.code];

		if (exceptions.hasOwnProperty(shape)) {
			blocked = exceptions[shape][from];
			x = piece.gridPosition.x;
			y = piece.gridPosition.y;

			blocked && blocked.forEach(function (test) {
				// we've found an exception to the exception
				if (allowKick === Piece.Rotation.CW || allowKick === Piece.Rotation.CCW) { return; }

				if (field.grid[y + test[1]][x + test[0]]) {
					allowKick = false;
				}

				if (!allowKick && from === 0 && test[1] === 2) {
					if (shape === "J" && field.grid[y][x]) {
						allowKick = Piece.Rotation.CCW;
					} else if (shape === "L" && field.grid[y + 2][x]) {
						allowKick = Piece.Rotation.CW;
					}
				}
			});
		}

		if (allowKick === false ||
		    (allowKick !== true && allowKick !== rotation)) {
			piece.shapeIndex = from;
			piece.setShape();
			return;
		}

		// attempt kick
		piece.moveRight();

		if (field.collision(piece)) {
			piece.moveLeft();
			piece.moveLeft();

			if (field.collision(piece)) {
				piece.moveRight();
				piece.shapeIndex = from;
				piece.setShape();
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
