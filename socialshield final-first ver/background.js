var profanityIndex = {};
var selectedCount = null;
var selectedUrl = null;
var regexForTwitter = /twitter\.com/;

function updateCount(tabId, tabUrl) {

    var useCache = false;
    var currentUrlCount = null;

    if (profanityIndex[tabUrl] != null) {
        useCache = true;
        console.log('use cache');
        currentUrlCount = profanityIndex[tabUrl]
    }

    chrome.tabs.sendMessage(tabId, {useCache, currentUrlCount}, (response) => {
        if (response) {
            console.log("count is recieved for updateCount!", response.profanityIndex);
            selectedUrl = tabUrl;
            profanityIndex[tabUrl] = response.profanityIndex;
            selectedCount = response.profanityIndex;
        }
    });
}


chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
    var url = tab.url;
    if (url !== undefined && url.search(regexForTwitter) != -1) {
        if (change.status == "complete") {
            console.log("onUpdated activates updateCount");
            updateCount(tabId, url)
        }
    }
});


// // Ensure the current selected tab is set up.
// chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
//     console.log("query activates updateCount");
//     updateCount(tabs[0].id, tabs[0].url);
// });
