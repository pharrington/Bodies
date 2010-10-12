var ajax = function () {
	var head = document.getElementsByTagName("head")[0];

	return function (url, params) {
		var query = "",
		    script = document.createElement("script");
		for (param in params) {
			query += !query ? "?" : "&";
			query += param + "=" + params[param];
		}
		url += query;
		script.src = url;
		script.onload = script.onreadystatechange = function () {
			if (document.readyState === "complete") {
				head.removeChild(this);
			}
		};
		head.appendChild(script);
	}
}();
