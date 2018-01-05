//This is a content script
if (window == top) {
    chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
        console.log('listener', req);
        swal.close();
        $("#doc").foggy({
            blurRadius: 8,
            opacity: 0.2
        });

        if (req.useCache) {
            console.log("useCache is true with value:", req.currentUrlCount)
            setTimeout(()=> {
                dangerMessage(req.currentUrlCount)
            }, 400);
            return false
        }
        else {
            console.log("url not recognised, starting twitterScanDanger");
            twitterScanDanger().then((profanityIndex) => {
                console.log('profanity index', profanityIndex);
                dangerMessage(profanityIndex);
                sendResponse({profanityIndex});
            });
            return true
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


const twitterScanDanger = () => {
    return new Promise((resolve)=> {
        console.log("twitterScanDanger is starting");
        const token = 'Bearer AAAAAAAAAAAAAAAAAAAAAJxdwQAAAAAAE8ilGm6Rr37aIFEyJkcHdaOhZvo%3DXi7X112RAWDlRPS7RSUfctj1nnlJzEhXkt1bP58SWhd2EScHYx'
        const title = document.title;
        if (title.indexOf('@') != -1) {
            var profanityCount = 0;
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
                    const targetProfanityCount = loadTweets(tweets, true, profanityCount);
                    console.log('target profanity count: ', targetProfanityCount);
                    const friends = data.users.map(d=>'from:' + d.screen_name);
                    if (friends.length < 30) {
                        resolve(targetProfanityCount);
                        return
                    }
                    let parts = [];
                    let i = 0;
                    while (i < friends.length) {
                        parts.push(friends.slice(i, i + 10));
                        i += 10
                    }

                    let phase = 0;
                    let friendsProfanityCount = 0;
                    parts.forEach((part) => {
                        const query = part.join(' OR ');
                        requestTweets("https://api.twitter.com/1.1/search/tweets.json", {
                            count: 100,
                            q: query,
                            lang: 'en',
                            skip_status: true,
                            include_user_entities: false
                        }, false).then((tweets) => {
                            console.log('yay');
                            phase += 1;
                            friendsProfanityCount += loadTweets(tweets, false, profanityCount);
                            if (phase == parts.length) {
                                console.log('friends count', friendsProfanityCount);
                                console.log('friends length', friends.length);
                                friendsProfanityCount = parseInt(10 * friendsProfanityCount / friends.length);
                                var profanityIndex = targetProfanityCount + friendsProfanityCount;
                                profanityIndex = dangerLevelPhase(profanityIndex);
                                resolve(profanityIndex);
                            }
                        });
                    });
                });

            })
        } else {
            console.log('no match');
            $('#doc').foggy(false)
        }
    })
};

const loadTweets = (textArr, isTarget, profanityCount) => {
    textArr.forEach((text) => {
        if (text.search(myRegex) != -1) {
            profanityCount += 1
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
            } else {
                resolve(tweets)
            }
        })
    })
};

const dangerMessage = (profanityIndex) => {
    var customSettingsForDanger = {
        "2":{"title":"This person is slightly vulgar", "showCancel":true},
        "3":{"title":"This person is vulgar", "showCancel":true},
        "4":{"title":"This person is really vulgar, I can't let you pass", "showCancel": false},
        "5":{"title":"Explicit content. Forget this page ever exists.", "showCancel": false},
    }


    if (profanityIndex > 1) {
        profanityIndex = profanityIndex.toString();
        const text = "Danger level is "+ profanityIndex;
        const title = customSettingsForDanger[profanityIndex]["title"];
        swal({   
            title: title,   
            text: text,   
            type: "warning",   
            showCancelButton: customSettingsForDanger[profanityIndex].showCancel,   
            confirmButtonColor: "#DD6B55",   
            confirmButtonText: "Go back",   
            cancelButtonText: "Proceed..."
        }, function(isConfirm){   
            if (isConfirm) {     
                history.back();
                $('#doc').foggy(false);  
            } else {     
                $('#doc').foggy(false);   
            } 
        });


    } else {
        $('#doc').foggy(false);
    }
};

const dangerLevelPhase = (profanityIndex) =>{
    var dangerLevel=0;
    if(profanityIndex<5){
        dangerLevel = 1;
    }else if(profanityIndex<10){
        dangerLevel = 2;
    }else if(profanityIndex<20){
        dangerLevel = 3;
    }else if(profanityIndex<30){
        dangerLevel = 4;
    }else {
        dangerLevel = 5;
    }
    return dangerLevel
}