var background = chrome.extension.getBackgroundPage();
var AUTH_URL = 'https://socialshield.herokuapp.com/get_auth_url'

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
	document.getElementById('minuteTimer').textContent = curTimer + " minutes";
}

chrome.storage.sync.get('token', function(data){
	if(data.token) {  // Authorized
		$('#unauthorized').hide()
		$('#authorized').show()
	} else {
		$('#unauthorized').show()
		$('#authorized').hide()
	}
});

chrome.storage.onChanged.addListener(function(changes){
	for(key in changes) {
		if (key == 'token') {
			if (changes[key]) {  // Authorized
				$('#unauthorized').hide()
				$('#authorized').show()
			} else {
				$('#unauthorized').show()
				$('#authorized').hide()
			}
		}
	}
});

$('#signIn').click(function(){
	$.ajax(AUTH_URL).then((response) => {
		if(response.url) {
			window.open(response.url)
		}
	})
});

$('#signOut').click(function(){
	chrome.storage.sync.remove('token', function(){
		$('#unauthorized').show()
		$('#authorized').hide()
	})
});

$('#toggleExplanations').click(function(){
	var explanations = $('#explanations');
	if(explanations.is(':visible')) {
		explanations.hide(400);
		$('#toggleExplanations').text('Show Explanation for Danger Levels')
	} else {
		explanations.show(400);
		$('#toggleExplanations').text('Hide Explanation for Danger Levels')
	}
});