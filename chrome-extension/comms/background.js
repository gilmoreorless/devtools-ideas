chrome.runtime.onConnect.addListener(function (devToolsConnection) {
	console.log('runtime.onConnect');

    // assign the listener function to a variable so we can remove it later
    var devToolsListener = function(message, sender, sendResponse) {
    	console.log('devToolsListener', message, sender);
        // Inject a content script into the identified tab
        chrome.tabs.executeScript(message.tabId,
            { file: message.scriptToInject });
    }
    // add the listener
    devToolsConnection.onMessage.addListener(devToolsListener);

    devToolsConnection.onDisconnect(function() {
         devToolsConnection.onMessage.removeListener(devToolsListener);
    });
});

chrome.runtime.onMessage.addListener(function (msg) {
	console.log('runtime.onMessage', msg);
});
