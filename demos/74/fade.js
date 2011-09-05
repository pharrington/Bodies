Fade = (function() {
	var el = null,
	    body,
	    css = {
	    position: "absolute",
	    display: "none",
	    backgroundColor: "#000",
	    opacity: 0.7,
	    top: "-50px",
	    left: "-125px",
	    width: 0,
	    height: 0,
	    zIndex: 1000,
	},

	setStyles = function (element, css) {
		var p,
		    style = element.style;

		for (p in css) {
			if (!css.hasOwnProperty(p)) { continue; }

			style[p] = css[p];
		}
	},

	element = function() {
		if (el === null) {
			el = document.createElement("div");
			setStyles(el, css);

			body = document.body;
			body.appendChild(el);
		}
		return el;
	};

	return {
		css: css,

		show: function() {
			var el = element();

			css.display = "block";
			css.width = window.innerWidth + "px";
			css.height = window.innerHeight + "px";

			setStyles(el, css);
		},

		hide: function() {
			css.display = "none";
			setStyles(element(), css);
		}
	};
}());
