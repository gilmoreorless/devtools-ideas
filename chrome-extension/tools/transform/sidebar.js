function getAppliedValue(defs, prop, defaultValue) {
	// TODO: This is really simple and naive for testing - make it work properly with specificity
	var applied = defs.inlineStyle[prop];
	if (!applied) {
		defs.rules.forEach(function (rule) {
			if (rule.style[prop] !== undefined) {
				applied = rule.style[prop];
			}
		});
	}
	if (applied === undefined) {
		applied = defaultValue;
	}
	return applied;
}

function update() {
	/* jshint evil:true */
	chrome.devtools.inspectedWindow.eval('getStylesAndRules($0)', {useContentScriptContext: true}, function (result) {
		var transform = getAppliedValue(result, 'webkitTransform', 'none');
		var origin = getAppliedValue(result, 'webkitTransformOrigin', '50% 50%');

		// Update visual display
		var transBase = document.querySelector('.trans-base');
		var transDisplay = document.querySelector('.trans-elem');
		transDisplay.style.webkitTransform = transform;
		transDisplay.style.webkitTransformOrigin = origin;
		transBase.querySelector('.origin').style.left = getAppliedValue(result, 'webkitTransformOriginX', '50%');
		transBase.querySelector('.origin').style.top = getAppliedValue(result, 'webkitTransformOriginY', '50%');

		// Update property list
		document.querySelector('#t2d-prop-transform .value').textContent = transform;
		document.querySelector('#t2d-prop-transform-origin .value').textContent = origin;
	});
}

update();

var bgPage = chrome.runtime.connect({
	name: 'devtoolsMetricsSidebar'
});

bgPage.onMessage.addListener(function (msg) {
	if (msg === 'update') {
		update();
	}
});

bgPage.postMessage({
	tabId: chrome.devtools.inspectedWindow.tabId,
	from: 'sidebar'
});

function setElemTransform(trans) {
	/* jshint evil:true */
	chrome.devtools.inspectedWindow.eval('$0.style.webkitTransform = "' + trans + '"',
	                                     {useContentScriptContext: true}, update);
}

