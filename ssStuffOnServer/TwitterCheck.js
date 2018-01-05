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
const loadingUrl = chrome.extension.getURL('images/Preloader_1.gif');
var name;
var nameMarkedSafe = null;
var loadingState;
const customSettingsForDanger = {
    '1':{"title":"Page is safe", "showCancel":true, color: 'limegreen'},
    '2':{"title":"Page is generally safe, however, inappropriate content may be present", "showCancel":true, color: 'orange'},
    '3':{"title":"Page has moderate risk of inappropriate / offensive content, viewer's discretion is advised", "showCancel": true, color: 'darkorange'},
    '4':{"title":"Page has high risk of inappropriate / offensive content, returning to previous page is recommended", "showCancel": true, color: 'tomato'},
    '5':{"title":"Page has inappropriate / offensive content, highly recommended not to proceed", "showCancel": true, color: 'red'},
}

//This is a content script
if (window == top) {
    chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
        console.log(req);

        if (req.type == "secondPhase") {
            loadingState=false;
            const level = req.data.level;
            if(!level) {
                $('#doc').foggy(false);
                swal.close();
                return false
            }
            if (req.selfCheck) {
                $('#doc').foggy(false);
                swal.close();
                const banner = '<div id="ssBanner" style="height:50px"><h1 style="padding-top:65px;padding-bottom:20px;background-color:#EFEFEF;text-align:center;color:'+customSettingsForDanger[level].color+'">Threat Level: '+level+' / 5'+'</h1></div>'
                if($('#ssBanner').length == 0) {
                    $('body').prepend(banner)
                };
            } else {
                if (level > 1 && name!=nameMarkedSafe) {
                    dangerMessage(req.data);
                } else {
                    $('#doc').foggy(false);
                    loadingState=false;
                    swal.close();
                }
            }
            return false
        }

        else if (req.type=="clear") {
            $('#ssBanner').remove();
            if(document.location.href.search(/twitter\.com\/\w+/) == -1 || document.title.indexOf('@') == -1){
                name = null;
                $('#doc').foggy(false);
                loadingState=false;
            }
        }

        else if (req.type=="firstPhase"){
            $('#ssBanner').remove();
            if (req.selfCheck) {
                name = $(".DashboardProfileCard-content").find(".u-linkComplex-target").text();
            } 
            else{
                const title = document.title;
                name = title.substr(title.indexOf('(') + 2, title.indexOf(')') - title.indexOf('(') - 2);
                if(name!=nameMarkedSafe){
                    $("#doc").foggy({blurRadius: 8, opacity: 0.2});
                    loadingState=true;
                    setTimeout(()=>{
                        if(loadingState){
                            swal({title: "Please wait a moment<br><img src='"+loadingUrl+"'/>",
                                text: "Scanning page",
                                showConfirmButton: false,
                                html: true
                            });
                        }
                    },500);
                }
                else{
                    $('#doc').foggy(false);
                    return false
                }
            }
            if (!name) {
                return false
            }
            sendResponse({name})
        }
 
    });
}


const dangerMessage = (data) => {
    if (!name){
        return
    }

    const profanityIndex = data.level.toString();
    const currentSetting = customSettingsForDanger[profanityIndex]
    const title = currentSetting["title"];
    const link = "https://twitter.com/intent/tweet?text=Hi%2C%20I%27ve%20noticed%20that%20some%20of%20your%20posts%20might%20be%20a%20little%20extreme.%20Maybe%20tone%20it%20down%20a%20little%3F%20Thank%20you!&hashtags="+name;
    swal({   
        title: '<h1 style="color:' + currentSetting.color + '">Warning</h1>',   
        text: '<div style="margin-left:30px;margin-right:30px"><p>' + title
        + "<br><br>Threat level: "
        + '<p style="font-size:250%;color:' + currentSetting.color + '">' + profanityIndex
        + '/5</p><br><br>'
        + '<a target="_blank" href="https://socialshield.herokuapp.com/tone/?screen_name=' + name + '">Tone analysis</a>'
        + '<br><br>'
        + '<a target="_blank" href="'+link+
        '">Send friendly reminder</a></p></div>',   
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
            swal("Nice!", "Back to safety...", "success");
            setTimeout(function(){history.back(); swal.close();}, 2500);  
        } else {
            swal("Take care", "", "error");
            setTimeout(function(){swal.close(); $('#doc').foggy(false)}, 2500);
            nameMarkedSafe=name;
        } 
    });

};
