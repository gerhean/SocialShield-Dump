if (window == top) {
  chrome.extension.onRequest.addListener(function(req, sender, sendResponse) {
    sendResponse(profanityFilter());
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

var profanityFilter = function(){
	console.log("content script is up and running! :)");
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