if (window == top) {
  chrome.extension.onRequest.addListener(function(req, sender, sendResponse) {
    sendResponse(getTwitterName());
  });
}


var swear_words_arr;
$.ajax({ type: "GET",   
         url: chrome.extension.getURL("swearWords.json"),   
         async: false,
         dataType: "json",
         success : function(data)
         {
             swear_words_arr = data;
         }
});


var getTwitterName = function(){
	var title = document.title;
	console.log("title get!:", title);
	var myRegex = eval("/\\(@(\\w+)\\)/");
	var screenName = title.match(myRegex)[1];
	console.log(screenName);
	getTwitterFriends(screenName);
	return 1
};


var getTwitterFriends = function(screenName){
	var idArr;
	var myInit = {
		Header:{
			Authorization: "Bearer AAAAAAAAAAAAAAAAAAAAAJxdwQAAAAAAE8ilGm6Rr37aIFEyJkcHdaOhZvo%3DXi7X112RAWDlRPS7RSUfctj1nnlJzEhXkt1bP58SWhd2EScHYx"
		},
		Params: {
			screen_name:screenName,
			cursor:-1,
			skip_status:true,
			include_user_entities:false,
			count:19
		}
	};

	fetch("https://api.twitter.com/1.1/friends/list.json")
	.then(function(data){
		console.log(data);
		idArr = data.ids;
		console.log(idArr)
	})
	console.log(idArr)
}


var profanityChecker = function(){
	console.log("Checking for badwords commence :)");
	var swear_count = 0,
	// swear_words_arr = ["ass","evil","freak"],
	queue = [document.body],
	curr,
	myRegex = eval("/\\b(?:" + swear_words_arr.join("|") + ")\\b/ig");
	console.log(myRegex);
	while (curr = queue.pop()) {
	    if (!curr.textContent.match(myRegex)) continue;
	    for (var i = 0; i < curr.childNodes.length; ++i) {
	        switch (curr.childNodes[i].nodeType) {
	            case Node.TEXT_NODE : // 3
	                while (result = myRegex.exec(curr.childNodes[i].textContent)) {
	                	console.log(result, myRegex.lastIndex);
	                	swear_count += 1
	                }
	                break;
	            case Node.ELEMENT_NODE : // 1
	                queue.push(curr.childNodes[i]);
	                break;
	        }
	    }
	};
	console.log("Evils recorded:");
	console.log(swear_count);
	return swear_count
}