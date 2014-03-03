var bgPage = chrome.runtime.connect({
	name: 'devtools-metrics-sidebar'
});

bgPage.onMessage.addListener(function (msg) {
	alert('MSG: ' + msg);
});

bgPage.postMessage({
	tabId: chrome.devtools.inspectedWindow.tabId,
	scriptToInject: 'injected/dtm-content.js'
});

chrome.devtools.panels.elements.createSidebarPane(
	'Metrics TEST',
	function (sidebar) {
		function setSidebarData() {
			sidebar.setHeight('400px');
			sidebar.setPage('tools/transform/sidebar.html');
		}
		setSidebarData();
		chrome.devtools.panels.elements.onSelectionChanged.addListener(setSidebarData);
	}
);
