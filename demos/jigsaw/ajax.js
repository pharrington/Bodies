var ajax = function () {
	var head = document.getElementsByTagName("head")[0];

	return function (url, params) {
		var query = "?",
		    script = document.createElement("script");

		for (param in params) {
			if (params.hasOwnProperty(param)) {
				query += param + "=" + params[param] + "&";
			}
		}

		url += query;

		script.onload = script.onreadystatechange = function () {
			if (document.readyState === "complete") {
				head.removeChild(this);
			}
		};

		script.src = url;
		head.appendChild(script);
	}
}();
