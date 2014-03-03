var bgPage = chrome.runtime.connect({
	name: 'devtoolsMetricsMain'
});

bgPage.onMessage.addListener(function (msg) {
	alert('MSG: ' + msg);
});

bgPage.postMessage({
	tabId: chrome.devtools.inspectedWindow.tabId,
	injectScript: 'injected/dtm-content.js'
});

chrome.devtools.panels.elements.createSidebarPane(
	'Metrics TEST',
	function (sidebar) {
		function setSidebarData() {
			sidebar.setHeight('400px');
			sidebar.setPage('tools/transform/sidebar.html');
		}
		setSidebarData();
		// chrome.devtools.panels.elements.onSelectionChanged.addListener(setSidebarData);
		chrome.devtools.panels.elements.onSelectionChanged.addListener(function () {
			bgPage.postMessage({
				tabId: chrome.devtools.inspectedWindow.tabId,
				toSidebar: 'update'
			});
		});
	}
);
