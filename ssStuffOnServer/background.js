// using localStorage
var selectedCount = 0;
var selectedUrl = null;
const regexForTwitter = /twitter\.com\/\w+/;
// const regexForSelf = /(twitter\.com)((\/\?)|($))/;

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
    console.log("start check");
    chrome.tabs.sendMessage(tabId, {selfCheck, type:"firstPhase"}, (response) => {
        if (!response || !response.name) {
            chrome.tabs.sendMessage(tabId, {type:"clear"});
            return
        };
        const cached = checkCache(response.name);
        if (cached){
            chrome.tabs.sendMessage(tabId, {cached, selfCheck, type: "secondPhase"});
        }
        else{
            reqServer(response.name).then((data) => {
                chrome.tabs.sendMessage(tabId, {data, selfCheck, type: "secondPhase"});
                setCache(response.name, data);
            }).catch(() => {
                chrome.tabs.sendMessage(tabId, {type:"clear"});
            });
        }
    })
};

const checkCache = (name) => {
    const moddedTabName = "socishd" + name;
    if (localStorage.getItem(moddedTabName)) {
        const cached = localStorage.getItem(moddedTabName);
        var d = new Date();
        if(cached.date == d.getDate()){
            console.log("cache retrieved", name)
            return cached.data;
        }
        else{
            return false;
        }
    }
    else{
        return false;
    }
}

const setCache = (name, data) =>{
    const moddedTabName = "socishd" + name;
    var d = new Date();
    localStorage.setItem(moddedTabName, {data:data, date:d.getDate()});
    console.log("cache is set",name,data)
}

chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
    if (tab.status != "complete") {
        return false
    }
    const url = tab.url;
    if (url === undefined) {
        stopTimer();
        return
    }
    if (url.search(regexForTwitter) != -1 ){
        const title = tab.title;
        console.log("title is", title)
        if (title.indexOf('@') == -1) {
            chrome.tabs.sendMessage(tabId, {type:"clear"});
        }
        else{
            check(tabId, false);
        }
    } else if (url=="https://twitter.com/") {
        console.log('selfcheck');
        check(tabId, true)
    }  
    else{
        chrome.tabs.sendMessage(tabId, {type:"clear"});
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