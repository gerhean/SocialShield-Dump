// using localStorage
var selectedCount = 0;
var selectedUrl = null;
var regexForTwitter = /twitter\.com\/\w+/;

localStorage.clear()

function updateCount(tabId, tabUrl) {


    var useCache = false;
    var currentUrlCount = null;
    //socishd is prefixed to identify url as for this app
    var moddedTabUrl = "socishd" + tabUrl
    console.log(moddedTabUrl+"is used")

    if (localStorage.getItem(moddedTabUrl) != null) {
        useCache = true;
        currentUrlCount = localStorage.getItem(moddedTabUrl);
        console.log('use cache', currentUrlCount);
    }

    chrome.tabs.sendMessage(tabId, {useCache, currentUrlCount}, (response) => {
        if (response) {
            console.log("count is recieved for updateCount!", response.profanityIndex);
            localStorage.setItem(moddedTabUrl, response.profanityIndex);
            selectedCount = response.profanityIndex;
        }
    });
}


chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
    var url = tab.url;
    if (url !== undefined && url.search(regexForTwitter) != -1 ){
        if (change.status == "complete") {
            //selectedUrl = url;
            console.log("onUpdated activates updateCount");
            updateCount(tabId, url)
        }
    }
    // else {
    //     selectedUrl = null;
    // }
});


// // Ensure the current selected tab is set up.
// chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
//     console.log("query activates updateCount");
//     updateCount(tabs[0].id, tabs[0].url);
// });
