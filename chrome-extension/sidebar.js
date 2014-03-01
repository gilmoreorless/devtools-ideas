function getElementData() {
	if (!$0) {
		return {};
	}

	function A(obj) {
		return Array.prototype.slice.call(obj || []);
	}
	function getStyles(rule) {
		var styles = {};
		A(rule.style).concat('cssText').forEach(function (prop) {
			styles[prop] = rule.style[prop];
		});
		return styles;
	}
	function getCSSRules(elem) {
		return A(getMatchedCSSRules(elem)).map(function (rule) {
			// Cut rules down to JSON-able objects
			return {
				cssText: rule.cssText,
				selectorText: rule.selectorText,
				style: getStyles(rule)
			};
		});
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
	copy.rules = getCSSRules($0);
	return copy;
}

function iife(fn) {
	return '(' + fn.toString() + ')();';
}

chrome.devtools.inspectedWindow.eval(iife(getElementData), function (result) {
	// alert(arguments.length);
	// document.getElementById('holder').innerHTML = 'transform: ' + result.webkitTransform +
	// 	'<br/>transform-origin: ' + result.webkitTransformOrigin;
	document.getElementById('holder').textContent = JSON.stringify(result);
	// document.getElementById('holder').textContent = result.rules.length + ' rules';
	document.querySelector('.trans-elem').style.webkitTransform = result.webkitTransform;
	document.querySelector('.trans-elem').style.webkitTransformOrigin = result.webkitTransformOrigin;
});