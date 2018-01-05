var background = chrome.extension.getBackgroundPage();

// document.addEventListener('DOMContentLoaded', function() {
// 	var profanityIndex = background.selectedCount;
// 	profanityIndex = profanityIndex.toString();
// 	console.log("incoming from popup.js: profanityIndex:" + profanityIndex);
// 	document.getElementById('profanity_index').textContent = profanityIndex;
// });
var timer;
document.addEventListener('DOMContentLoaded', function() {
	console.log("is timerset?");
	setTimerDisplay();
	timer= setInterval(setTimerDisplay, 30000);
});

const setTimerDisplay = () =>{
	var curTimer = chrome.extension.getBackgroundPage().timer;
	curTimer = (curTimer - (curTimer % 60)) / 60;
	curTimer = curTimer.toString();
	console.log("minuteTimer reset", curTimer)
	document.getElementById('minuteTimer').textContent = curTimer;
}