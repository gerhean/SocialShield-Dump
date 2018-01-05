// using localStorage
var selectedCount = 0;
var selectedUrl = null;
var regexForTwitter = /twitter\.com\/\w+/;
//localStorage.clear()

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
}

const updateCount = (tabId, name, url)=> {
    var useCache = false;
    var currentUrlCount = null;
    //socishd is prefixed to identify name as for this app
    var moddedTabName = "socishd" + name
    console.log(moddedTabName+"is used")
    if (localStorage.getItem(moddedTabName)) {
        useCache = true;
        currentUrlCount = localStorage.getItem(moddedTabName);
        console.log('use cache', currentUrlCount);
    }
    if (url == selectedUrl && !useCache){return;}
    selectedUrl = url;
    startTimer();
    chrome.tabs.sendMessage(tabId, {useCache, currentUrlCount, name}, (response) => {
        if (response) {
            console.log("count is recieved for updateCount!", response.profanityIndex);
            localStorage.setItem(moddedTabName, response.profanityIndex);
            selectedCount = response.profanityIndex;
        }
    });
}

const selfCheck = (tabId)=> {
    var nowDate = new Date;
    var nowMinutes = (nowDate.getTime() - (nowDate.getTime() % 3600000)) / 3600000;
    var useCache = false;
    var lastRefresh = localStorage.getItem("socishdRefreshTime");
    lastRefresh = parseInt(lastRefresh);
    var currentUrlCount = localStorage.getItem("socishdOwnDanger");
    if (lastRefresh){
        console.log("lastRefresh, nowMinutes is", lastRefresh, nowMinutes);
        if (nowMinutes>=lastRefresh && nowMinutes<=lastRefresh+1){
            useCache = true;
            console.log('use cache', currentUrlCount);
        }
    }
    startTimer();
    chrome.tabs.sendMessage(tabId, {selfCheck:true, useCache, currentUrlCount}, (response) => {
        if (response) {
           console.log("count is recieved for selfCheck!", response.profanityIndex); 
           localStorage.setItem("socishdRefreshTime", nowMinutes);
           localStorage.setItem("socishdOwnDanger", response.profanityIndex);
        }
    });
}


chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
    if (tab.status != "complete") {
        return false
    }
    // if(change.status != "complete"){
    //     return false
    // }
    const url = tab.url;
    if (url!== undefined && url=="https://twitter.com/") {
        console.log('selfcheck');
        selfCheck(tabId)
    } else if (url!== undefined && url.search(regexForTwitter) != -1 ){
        const title = tab.title;
        console.log("title is", title)
        if (title.indexOf('@') == -1) {
            chrome.tabs.sendMessage(tabId, {search:true})
            return false
        }
        const startIndex = title.indexOf('(');
        const endIndex = title.indexOf(')');
        const name = title.substr(startIndex + 2, endIndex - startIndex - 2);
        console.log("onUpdated activates updateCount");
        updateCount(tabId, name, url)
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