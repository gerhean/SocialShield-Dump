var swear_counts = {};
var selectedCount = null;
var selectedId = null;

function updateCount(tabId) {
  chrome.tabs.sendRequest(tabId, {}, function(count) {
    console.log("count is recieved for updateCount:");
    swear_counts[tabId] = count;
    if (selectedId == tabId) {
        updateSelected(tabId);
    }
  });
}

function updateSelected(tabId) {
  selectedCount = swear_counts[tabId];
  if (selectedCount > 10) {
          console.log("Danger level over limit:" + selectedCount.toString())
          alert("Danger!\nDanger level is " + selectedCount.toString())
        }
}

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
  if (change.status == "complete") {
    updateCount(tabId);
  }
});

chrome.tabs.onSelectionChanged.addListener(function(tabId, info) {
  selectedId = tabId;
  updateSelected(tabId);
});

// Ensure the current selected tab is set up.
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  updateCount(tabs[0].id);
});
