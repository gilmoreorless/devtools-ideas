function getElementData() {
	if (!$0) {
		return {};
	}
	var data = getComputedStyle($0);
	// Make a shallow copy with a null prototype, so that sidebar does not
	// expose prototype.
	var props = Object.getOwnPropertyNames(data);
	var copy = {};
	props.filter(function (prop) {
		return prop.toLowerCase().indexOf('transform') > -1;
	}).forEach(function (prop) {
		copy[prop] = data[prop];
	});
	return copy;
}

function iife(fn) {
	return '(' + fn.toString() + ')();';
}

chrome.devtools.inspectedWindow.eval(iife(getElementData), function (result) {
	// alert(arguments.length);
	document.getElementById('holder').textContent = result.webkitTransform;
	document.querySelector('.trans-elem').style.webkitTransform = result.webkitTransform;
});