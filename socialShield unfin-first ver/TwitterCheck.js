if (window == top) {
  chrome.extension.onRequest.addListener(function(req, sender, sendResponse) {

    console.log("message recieved with req:", req.stuff);
    var urlFound = req.stuff.urlFound;
    var currentUrlCount = req.stuff.currentUrlCount;

    $('body').foggy({
                blurRadius: 8,
                opacity: 0.2
            });
    
    if (!urlFound) {
        console.log("url not recognised, starting twitterScanDanger")
        twitterScanDanger().then((profanityCount) => {
            currentUrlCount = profanityCount;
            dangerMessage(currentUrlCount);
            sendResponse(currentUrlCount)
        });
    }
    else {
        dangerMessage(currentUrlCount);
        sendResponse(currentUrlCount)
    }
  });
}

var swear_words_arr;
$.ajax({
    type: "GET",
    url: chrome.extension.getURL("swearWords.json"),
    async: false,
    dataType: "json",
    success: function (data) {
        swear_words_arr = data;
    }
});
var myRegex = eval("/\\b(?:" + swear_words_arr.join("|") + ")\\b/ig");


const twitterScanDanger = ()  => {
    return new Promise((resolve)=> {
        console.log("twitterScanDanger is starting")
        const token = 'Bearer AAAAAAAAAAAAAAAAAAAAAJxdwQAAAAAAE8ilGm6Rr37aIFEyJkcHdaOhZvo%3DXi7X112RAWDlRPS7RSUfctj1nnlJzEhXkt1bP58SWhd2EScHYx'
        const title = document.title;
        if (title.indexOf('@') != -1) {
            var profanityCount = 0;
            var phase = 1;
            const startIndex = title.indexOf('(');
            const endIndex = title.indexOf(')');
            const name = title.substr(startIndex + 2, endIndex - startIndex - 2);
            console.log("twitter name:", name);

            jQuery.ajax("https://api.twitter.com/1.1/friends/list.json", {
                headers: {
                    Authorization: token
                },
                data: {
                    count: 100,
                    screen_name: name,
                    skip_status: true,
                    include_user_entities: false
                },
                dataType: 'json'
            }).then((data)=> {
                console.log("activating requestTweets");
                requestTweets("https://api.twitter.com/1.1/search/tweets.json", {
                    count: 100,
                    q: 'from:' + name,
                    lang: 'en',
                    skip_status: true,
                    include_user_entities: false
                }, false).then((tweets) => {
                    profanityCount = loadTweets(tweets, true, profanityCount)
                });

                const friends = data.users.map(d=>'from:' + d.screen_name);
                let parts = [];
                let i = 0;
                while (i < friends.length) {
                    parts.push(friends.slice(i, i + 10));
                    i += 10
                }

                parts.forEach((part) => {
                    const query = part.join(' OR ');
                    requestTweets("https://api.twitter.com/1.1/search/tweets.json", {
                        count: 100,
                        q: query,
                        lang: 'en',
                        skip_status: true,
                        include_user_entities: false
                    }, false).then((tweets) => {
                        phase += 1;
                        profanityCount = loadTweets(tweets, false, profanityCount);
                        if(phase == parts.length) {
                            profanityCount += 1;
                            console.log("profanityCount scanned:", profanityCount);
                            resolve(profanityCount);
                        }
                    });
                });
            })
        }
    })
};

const loadTweets = (textArr, isTarget, profanityCount) => {
    textArr.forEach((text) => {
        if (text.search(myRegex) != -1) {
            profanityCount += (isTarget)?4:1
        }
    });
    return profanityCount
};

const requestTweets = (path, data, breakNext) => {
    return new Promise((resolve)=> {
        jQuery.ajax(path, {
            headers: {
                Authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAAJxdwQAAAAAAE8ilGm6Rr37aIFEyJkcHdaOhZvo%3DXi7X112RAWDlRPS7RSUfctj1nnlJzEhXkt1bP58SWhd2EScHYx'
            },
            data,
            dataType: 'json'
        }).then((data) => {
            const tweets = data.statuses.map(d=>d.text);
            if (breakNext) {
                resolve(tweets)
            }
            else if (data.search_metadata.next_results) {
                requestTweets(path + data.search_metadata.next_results, null, true).then((d) => {
                    resolve(tweets.concat(d))
                })
            }
        })
    })
};

const dangerMessage = (currentUrlCount) =>{
    if(currentUrlCount > 100) {
        const dangerLevel = parseInt(currentUrlCount / 20);
        console.log("dangerLevel:", dangerLevel);
        if (window.confirm("Page may contain dangerous content. (Danger Level: "+dangerLevel+") Leave?")) {
            history.back(1);
        } 
    };
    $('body').foggy(false);
}

