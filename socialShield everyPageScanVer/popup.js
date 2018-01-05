var danger_level;

function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function() {
	danger_level = chrome.extension.getBackgroundPage().selectedCount
	console.log("incoming from popup.js: danger_level:" + danger_level.toString())
	renderStatus(chrome.extension.getBackgroundPage().selectedCount);
});

window.onload = renderStatus;