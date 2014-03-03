function update() {
	chrome.devtools.inspectedWindow.eval('getStylesAndRules($0)', {useContentScriptContext: true}, function (result) {
		document.getElementById('holder').innerHTML = 'transform: ' + result.computed['-webkit-transform'] +
			'<br/>transform-origin: ' + result.computed['-webkit-transform-origin'];
		document.querySelector('.trans-elem').style.webkitTransform = result.computed['-webkit-transform'];
		document.querySelector('.trans-elem').style.webkitTransformOrigin = result.computed['-webkit-transform-origin'];
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

