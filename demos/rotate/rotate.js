function mark(red) {
	if (mark.marked === undefined) { mark.marked = false; }
	if ((red && mark.marked) || (!red && !mark.marked)) { return; }
	mark.marked = red;
	var color = red ? [255, 0, 0, 255] : [0, 0, 0, 255],
	    pixels = this.imageData.data;

	for (var p = 0; p < this.width * this.height; p++) {
		var index = p * 4;
		if (pixels[index + 3] > 0) {
			for (var i = 0; i < 3; i++) {
				pixels[index + i] = color[i];
			}
		}
	}
	this.context.putImageData(this.imageData, 0, 0);
}

var square, oval;
window.addEventListener("load", function() {
	Bodies(600, 600);
	Bodies.loadImage("square", "square.jpg");
	Bodies.loadImage("oval", "oval.gif");

	Bodies.mouseMove(function (x, y) {
		square.moveTo(x, y);
	});

	Bodies.loaded(function () {
		square = new Bodies.Sprite("square");
		oval = new Bodies.Sprite("oval");
		square.moveTo(153, 232);
		oval.moveTo(200, 200);
	});

	Bodies.refresh(function(context) {
		if (Bodies.testCollision(square, oval)) {
			mark.call(oval, true);
		} else {
			mark.call(oval, false);
		}
		context.clearRect(0, 0, 600, 600);
		square.rotate(0.05);
		square.draw();
		oval.draw();
	});
}, true);
