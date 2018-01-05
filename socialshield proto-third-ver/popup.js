var danger_level;

function renderStatus(statusText) {
	console.log(statusText)
	document.getElementById('status').textContent = statusText;
}

document.addEventListener('DOMContentLoaded', function() {
	danger_level = chrome.extension.getBackgroundPage().selectedCount;
	danger_level = danger_level.toString();
	console.log("incoming from popup.js: danger_level:" + danger_level);
	renderStatus(danger_level);
});

window.onload = renderStatus;