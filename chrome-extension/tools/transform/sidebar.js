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
	chrome.devtools.inspectedWindow.eval('getStylesAndRules($0)', {useContentScriptContext: true}, function (result) {
		var transform = getAppliedValue(result, 'webkitTransform', 'none');
		var origin = getAppliedValue(result, 'webkitTransformOrigin', '50% 50%');

		document.getElementById('holder').innerHTML = 'transform: ' + transform +
			'<br/>transform-origin: ' + origin;
		document.querySelector('.trans-elem').style.webkitTransform = transform;
		document.querySelector('.trans-elem').style.webkitTransformOrigin = origin;
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

