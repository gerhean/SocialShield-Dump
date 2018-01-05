// using localStorage
var selectedCount = 0;
var selectedUrl = null;
var regexForTwitter = /twitter\.com\/\w+/;

const SERVER_URL = "https://socialshield.herokuapp.com/get_danger_level"


//timer in seconds
var timer = parseInt(localStorage.getItem("ssTimer")) || 0;
var activeTimer;
var isTimerActive = false;
const startTimer = ()=> {
    var d = new Date();
    if (isTimerActive){
        localStorage.setItem("ssTimer", timer);
        return;
    }
    isTimerActive = true;
    timer = localStorage.getItem("ssTimer") || 0;
    timer = parseInt(timer);
    console.log("timer is set!", timer);
    if (localStorage.getItem("ssTimerDate") != d.getDate()){
        timer = 0;
        localStorage.setItem("ssTimerDate", d.getDate());
    }
    activeTimer = setInterval(function(){timer+=1;}, 1000);
}
const stopTimer = ()=> {
    if (isTimerActive){
        isTimerActive = false;
        console.log("timer is stopped");
        clearInterval(activeTimer);
        localStorage.setItem("ssTimer", timer);
    }
};

const check = (tabId, selfCheck) => {
    startTimer();
    
    chrome.tabs.sendMessage(tabId, {selfCheck}, (response) => {
        if (!response || !response.name) {
            return
        };

        reqServer(response.name).then((data) => {
            chrome.tabs.sendMessage(tabId, {data, selfCheck, name: response.name, secondPhase: true})
        })
    })
};


chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
    if (tab.status != "complete") {
        return false
    }
    const url = tab.url;
    if (url === undefined) {
        stopTimer();
        return
    }

    if (url=="https://twitter.com/") {
        console.log('selfcheck');
        check(tabId, true)
    } else if (url.search(regexForTwitter) != -1 ){
        const title = tab.title;
        console.log("title is", title)
        if (title.indexOf('@') == -1) {
            chrome.tabs.sendMessage(tabId, {search:true})
            return false
        }
        check(tabId, false)
    } 
    else{
        stopTimer();
    }
});

chrome.tabs.onActivated.addListener(function(){
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        var url = tabs[0].url;
        if (url=="https://twitter.com/" || url.search(regexForTwitter) != -1){
            startTimer();
        }
        else{
            stopTimer();
        }
    });
})

chrome.windows.onFocusChanged.addListener(function(window) {
    if (window == chrome.windows.WINDOW_ID_NONE) {
        stopTimer();
    } else {
        startTimer();
    }
});

const reqServer = (name) => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('token', function(data) {
            const token = data.token;
            if(!token) {
                resolve(null);
                return
            }

            $.ajax(SERVER_URL, {data: {
                oauth_token: token,
                screen_name: name
            }}).then(function(response){
                console.log(response);
                resolve(response)
            }).catch(reject)
        })
    })
}