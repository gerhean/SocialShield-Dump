var profanityCounts = {};
var selectedCount = null;
var selectedUrl = null;
var regrexForTwitter = /twitter\.com/;
var pendingTabs = {};

function updateCount(tabId, tabUrl) {
  if (!tabUrl.match(regrexForTwitter)) {
    return null
  };

  if (tabUrl == selectedUrl) {
    console.log("you shalt not run again");
    return null
  };

  if (tabId in pendingTabs) {
    return null
  };
  pendingTabs[tabId] = true;
  console.log("new tab pending", pendingTabs);

  console.log("from updateCount, currentUrl is", tabUrl)
  var urlFound = false;
  var currentUrlCount = 0;
  if (tabUrl in profanityCounts) {
    if (profanityCounts[tabUrl]){
      urlFound = true;
      currentUrlCount = profanityCounts[tabUrl]
    }
  };

  chrome.tabs.sendRequest(tabId, {stuff: {urlFound: urlFound, currentUrlCount: currentUrlCount}}, function(count) {
    console.log("count is recieved for updateCount!" , count);
    selectedUrl = tabUrl;
    profanityCounts[tabUrl] = count;
    selectedCount = count;
    delete pendingTabs[tabId];
    console.log("tab has been removed", pendingTabs)
  });
}


chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
  var url = tab.url;
  if (url !== undefined && change.status == "complete") {
    console.log("onUpdated activates updateCount");
    updateCount(tabId, url)
  }
});


// Ensure the current selected tab is set up.
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  console.log("query activates updateCount");
  updateCount(tabs[0].id, tabs[0].url);
});
