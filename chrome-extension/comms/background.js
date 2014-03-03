var tabs = {};

chrome.runtime.onConnect.addListener(function (port) {
	console.log('runtime.onConnect', port);

	// assign the listener function to a variable so we can remove it later
	var devToolsListener = function (message, sender) {
		console.log('devToolsListener', message, sender);

		if (message.tabId) {
			if (!tabs[message.tabId]) {
				tabs[message.tabId] = {};
			}
			tabs[message.tabId][sender.name] = sender;
		}

		// Inject a content script into the identified tab
		if (message.injectScript) {
			chrome.tabs.executeScript(message.tabId, {
				file: message.injectScript
			});
		}
		// Message passing between devtools.js and sidebar
		if (message.fromSidebar) {
			tabs[message.tabId].devtoolsMetricsMain.postMessage(message.fromSidebar);
		}
		if (message.toSidebar && tabs[message.tabId].devtoolsMetricsSidebar) {
			tabs[message.tabId].devtoolsMetricsSidebar.postMessage(message.toSidebar);
		}
	}
	// add the listener
	port.onMessage.addListener(devToolsListener);

	port.onDisconnect.addListener(function () {
		console.log('port.onDisconnect', arguments);
		port.onMessage.removeListener(devToolsListener);
		// TODO: Clean up tabs references
	});
});
