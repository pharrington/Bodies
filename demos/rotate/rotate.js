var s1;
window.addEventListener("load", function() {
	Bodies(600, 600);
	Bodies.loadImage("square", "square.jpg");

	Bodies.loaded(function () {
		s1 = new Bodies.Sprite("square");
		s1.moveTo(250, 250);
	});

	Bodies.refresh(function(context) {
		context.clearRect(0, 0, 600, 600);
		s1.rotate(0.05);
		s1.draw();
	});
}, true);
