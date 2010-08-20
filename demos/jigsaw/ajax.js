function ajax(url, params) {
	if (!ajax.head) {
		ajax.head = document.getElementsByTagName("head")[0];
	}

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
			ajax.head.removeChild(this);
		}
	};
	ajax.head.appendChild(script);
}
