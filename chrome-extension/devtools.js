function getElementData() {
	if (!$0) {
		return {};
	}
	var data = getComputedStyle($0);
	// Make a shallow copy with a null prototype, so that sidebar does not
	// expose prototype.
	var props = Object.getOwnPropertyNames(data);
	var copy = { __proto__: null };
	props.filter(function (prop) {
		return prop.toLowerCase().indexOf('transform') > -1;
	}).forEach(function (prop) {
		copy[prop] = data[prop];
	});
	window.__mettestData = copy;
	return copy;
}

chrome.devtools.panels.elements.createSidebarPane(
	'Metrics TEST',
	function (sidebar) {
		function setSidebarData() {
			// sidebar.setExpression('(' + getElementData.toString() + ')()');
			sidebar.setHeight('300px');
			sidebar.setPage('sidebar.html');
		}
		setSidebarData();
		chrome.devtools.panels.elements.onSelectionChanged.addListener(setSidebarData);
	}
);
