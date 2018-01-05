//someJunkStuff.addClass("fake-tweet-btn")
//$("button.real-tweet-btn").parent().find(".tweet-counter").after("<button class='tweet-action hidden-tweet-btn' hidden/>")


$('form.tweet-form > div.TweetBoxToolbar > div.TweetBoxToolbar-tweetButton.tweet-button > button.tweet-btn').addClass("real-tweet-btn");
$("button.real-tweet-btn").parent().find(".tweet-counter").after($("button.real-tweet-btn").first().clone().addClass("fake-tweet-btn").removeClass('real-tweet-btn tweet-action'))

$("form.tweet-form > div.RetweetDialog-footer.u-cf > div.tweet-button > button.retweet-action").addClass("real-retweet-btn");
$("button.real-retweet-btn").parent().find(".tweet-counter").after($("button.real-retweet-btn").first().clone().addClass("fake-retweet-btn").removeClass('real-retweet-btn retweet-action'))

// Annoying iframes
chrome.runtime.onMessage.addListener(function (req, sender, sendResponse) {
    if (req.search){
        console.log("iframe die!");
        $("div.inline-reply-tweetbox.swift > form > div.TweetBoxToolbar > div.TweetBoxToolbar-tweetButton.tweet-button > button.tweet-btn").not(".real-tweet-btn, .fake-tweet-btn, .real-reply-btn").addClass("real-tweet-btn real-reply-btn");
        $("button.real-reply-btn").parent().find(".tweet-counter").after($("button.real-tweet-btn").first().clone().addClass("fake-tweet-btn").removeClass('real-tweet-btn tweet-action real-reply-btn').show());
        $('button.real-reply-btn').removeClass("real-reply-btn").hide();
    }
});

$('button.real-tweet-btn, button.real-retweet-btn').hide();

$('body').on("keyup","div.tweet-box", function() {
    if(!$(this).text()){
    	$(this).parents("form.tweet-form").find("button.fake-tweet-btn").prop('disabled', true).addClass('disabled');
    }
    else{
    	$(this).parents("form.tweet-form").find("button.fake-tweet-btn").prop('disabled', false).removeClass('disabled');
    }
});

$(document).on('click', 'button.fake-tweet-btn, button.fake-retweet-btn', function() {
	const thisBtn = this;
	const textBoxStuff = $(this).parents("form.tweet-form").find("div.tweet-box").text();
	const profanityCount = (textBoxStuff.match(myRegex) || []).length;
	console.log("fake-tweet-btn pressed", textBoxStuff,profanityCount);
    if(profanityCount>1){
	    swal({   
            title: "Warning",   
            text: "Your post contains some offensive words, are you sure you want to proceed?",   
            type: "warning",   
            showCancelButton: true,   
            confirmButtonColor: "limegreen",   
            confirmButtonText: "Return",   
            closeOnConfirm: false,
            closeOnCancel: false,
            cancelButtonText: "Proceed",
            html:true
        }, function(isConfirm){ 
            if (isConfirm) { 
            	swal.close();
                return 
            } else {
            	$(thisBtn).siblings("button.real-tweet-btn, button.real-retweet-btn").click();
    			$(thisBtn).not('.fake-retweet-btn').prop('disabled', true).addClass('disabled');
                swal.close();
            } 
        });
	}
	else{
		$(this).siblings("button.real-tweet-btn, button.real-retweet-btn").click();
		$(this).not('.fake-retweet-btn').prop('disabled', true).addClass('disabled');
	}
});

// $(document).on('click', 'button.fake-retweet-btn', function() {
//     const thisBtn = this;
//     const textBoxStuff = $(this).parents("form.tweet-form").find("div.tweet-box").text();
//     const profanityCount = (textBoxStuff.match(myRegex) || []).length;
//     console.log(textBoxStuff,profanityCount);
//     if(profanityCount<1){
//         swal({   
//             title: "Warning",   
//             text: "Your post is a little vulgar, do you really want to embrass yourself?",   
//             type: "warning",   
//             showCancelButton: true,   
//             confirmButtonColor: "limegreen",   
//             confirmButtonText: "I get it...",   
//             closeOnConfirm: false,
//             closeOnCancel: false,
//             cancelButtonText: "Proceed anyways",
//             html:true
//         }, function(isConfirm){ 
//             if (isConfirm) { 
//                 swal.close();
//                 return
//             } else {
//                 $(thisBtn).siblings("button.real-retweet-btn").click();
//                 swal.close();
//             } 
//         });
//     }
//     else{
//         $(this).siblings("button.real-retweet-btn").click();
//     }
// });