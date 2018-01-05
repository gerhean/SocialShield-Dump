var name;
const customSettingsForDanger = {
    "1":{"title":"Page is safe", "showCancel":true, color: 'limegreen'},
    "2":{"title":"Page is generally safe, however, inappropriate content may be present", "showCancel":true, color: 'orange'},
    "3":{"title":"Page has moderate risk of inappropriate / offensive content, viewer's discretion is advised", "showCancel": true, color: 'darkorange'},
    "4":{"title":"Page has high risk of inappropriate / offensive content, returning to previous page is recommended", "showCancel": true, color: 'tomato'},
    "5":{"title":"Page has inappropriate / offensive content, highly recommended not to proceed", "showCancel": true, color: 'red'},
}

//This is a content script
if (window == top) {
    chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
        console.log('listener', req);
        swal.close();

        if (req.selfCheck) {
            name = $(".DashboardProfileCard-content").find(".u-linkComplex-target").text();
        } else {
            const title = document.title;
            const startIndex = title.indexOf('(');
            const endIndex = title.indexOf(')');
            if (startIndex==-1 && endIndex==-1){
                name = null;
                return false
            }
            else {
                name = title.substr(startIndex + 2, endIndex - startIndex - 2);
            };
        }

        if(req.selfCheck) {
            twitterScanDanger(name).then((profanityIndex) => {
                console.log('profanity index', profanityIndex);
                const banner = '<div id="ssBanner" style="height:50px"><h1 style="padding-top:65px;padding-bottom:20px;background-color:#EFEFEF;text-align:center;color:'+customSettingsForDanger[profanityIndex].color+'">Profanity Index: '+profanityIndex+'</h1></div>'
                $('body').prepend(banner)
            });
            return false
        }

        $('#ssBanner').remove();

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
        } else {
            console.log("url not recognised, starting twitterScanDanger");
            twitterScanDanger(name).then((profanityIndex) => {
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

const twitterScanDanger = (name) => {
    return new Promise((resolve)=> {
        console.log("twitterScanDanger is starting");
        const token = 'Bearer AAAAAAAAAAAAAAAAAAAAAJxdwQAAAAAAE8ilGm6Rr37aIFEyJkcHdaOhZvo%3DXi7X112RAWDlRPS7RSUfctj1nnlJzEhXkt1bP58SWhd2EScHYx';
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
                const targetProfanityCount = loadTweets(tweets, true);
                console.log('target profanity count: ', targetProfanityCount);
                const friends = data.users.map(d=>'from:' + d.screen_name);
                if (friends.length < 20) {
                    resolve(dangerLevelPhase(targetProfanityCount));
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
                        friendsProfanityCount += loadTweets(tweets, false);
                        if (phase == parts.length) {
                            console.log('friends count', friendsProfanityCount);
                            console.log('friends length', friends.length);
                            friendsProfanityCount = parseInt(15 * friendsProfanityCount / friends.length);
                            var profanityIndex = targetProfanityCount + friendsProfanityCount;
                            profanityIndex = dangerLevelPhase(profanityIndex);
                            resolve(profanityIndex);
                        }
                    });
                });
            });
        })
    })
};

const loadTweets = (textArr, isTarget) => {
    var profanityCount = 0;
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
        }).catch(()=>{resolve([])})
    })
};

const dangerMessage = (profanityIndex) => {

    if (profanityIndex > 1) {
        profanityIndex = profanityIndex.toString();
        const currentSetting = customSettingsForDanger[profanityIndex]
        const title = currentSetting["title"];
        const link = "https://twitter.com/intent/tweet?text=Hi%2C%20I%27ve%20noticed%20that%20some%20of%20your%20posts%20might%20be%20a%20little%20extreme.%20Maybe%20tone%20it%20down%20a%20little%3F%20Thank%20you!&hashtags="+name;
        swal({   
            title: "Warning",   
            text: "<p>" + title + "<br><br>Threat level: " + '<p style="color:' + currentSetting.color + '">' + profanityIndex + '/5</p><br><br>' + '<a target="_blank" href="'+link+'">Send friendly reminder</a></p>',   
            type: "warning",   
            showCancelButton: customSettingsForDanger[profanityIndex].showCancel,   
            confirmButtonColor: "limegreen",   
            confirmButtonText: "Go back",   
            closeOnConfirm: false,
            closeOnCancel: false,
            cancelButtonText: "Proceed",
            html:true
        }, function(isConfirm){ 
            if (isConfirm) { 
                swal("Nice!", "Back to safety...", "success")
                setTimeout(function(){history.back(); swal.close(); $('#doc').foggy(false)}, 2500)    
            } else {
                swal("Take care", "", "error")
                setTimeout(function(){swal.close(); $('#doc').foggy(false)}, 2500)
            } 
        });


    } else {
        $('#doc').foggy(false);
    }
};

const dangerLevelPhase = (profanityIndex) =>{
    var dangerLevel=1;
    if(profanityIndex<5) {
    } else if(profanityIndex<10){
        dangerLevel = 2;
    } else if(profanityIndex<30){
        dangerLevel = 3;
    } else if(profanityIndex<50){
        dangerLevel = 4;
    } else {
        dangerLevel = 5;
    }
    return dangerLevel
}