if (window == top) {
    chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
        console.log('listener', req);
        $('body').foggy({
            blurRadius: 8,
            opacity: 0.2
        });

        if (req.useCache) {
            setTimeout(()=> {
                dangerMessage(req.currentUrlCount)
            }, 100);
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
                                const profanityIndex = targetProfanityCount + friendsProfanityCount;
                                resolve(profanityIndex);
                            }
                        });
                    });
                });

            })
        } else {
            console.log('no match');
            $('body').foggy(false)
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
    if (profanityIndex > 10) {
        if (window.confirm("Page may contain dangerous content. (Danger Level: " + profanityIndex + ") Leave?")) {
            history.back();
            $('body').foggy(false);
        } else {
            $('body').foggy(false);
        }
    } else {
        $('body').foggy(false);
    }
};
