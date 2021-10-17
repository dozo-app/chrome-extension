'use strict';

// HTML i18n
function localizeHtmlPage()
{
    //Localize by replacing __MSG_***__ meta tags
    var objects = document.getElementsByTagName('html');
    for (var j = 0; j < objects.length; j++)
    {
        var obj = objects[j];

        var valStrH = obj.innerHTML.toString();
        var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1)
        {
            return v1 ? chrome.i18n.getMessage(v1) : "";
        });

        if(valNewH != valStrH)
        {
            obj.innerHTML = valNewH;
        }
    }
}
localizeHtmlPage();

var dozo_username;
var dozo_code;
var dozo_token;

// remove old varaibles
chrome.storage.local.remove("app_username");
chrome.storage.local.remove("app_code");
chrome.storage.local.remove("app_token");

// get number of enabled extensions
chrome.management.getAll(function(extensions) {
    var nb_enabled_ext = 0
    extensions.forEach(function(extension) {
        if (extension.type == "extension" && extension.enabled) nb_enabled_ext++;
    });
    // console
    console.log("nb_enabled_ext : " + nb_enabled_ext);
});

manage_extensions.onclick = function() {
    chrome.tabs.create({ url: "chrome://extensions/" });
}

chrome.storage.local.get(["dozo_username","dozo_code","dozo_token"], function (res){

    // APP_TOKEN
    if (typeof res.dozo_token === "undefined"){
        dozo_token = (Math.random()+1).toString(36).substring(2) + (Math.random()+1).toString(36).substring(2) + (Math.random()+1).toString(36).substring(2);
        chrome.storage.local.set({"dozo_token":dozo_token});
        // console
        console.log("token created");
    } else {
        dozo_token = res.dozo_token;
    }

    // check if dozo_username and dozo_code are in localStorage
    if (typeof res.dozo_code !== 'undefined'){
    	document.getElementById("session_open").style.display = "none";
    	document.getElementById("session_close").style.display = "block";

    	// console
    	console.log("options - session opened");

    } else {
    	chrome.action.setIcon({path: 'icons/icon32.png'});
    	document.getElementById("session_open").style.display = "block";
    	document.getElementById("session_close").style.display = "none";
        if (typeof res.dozo_username !== 'undefined'){
            document.getElementById("session_open_user").placeholder = res.dozo_username;
        }


    	// console
    	console.log("options - start new session");
    }

    console.log('options - dozo_username : ' + res.dozo_username);
    console.log('options - dozo_code : ' + res.dozo_code);
    console.log('options - dozo_token : ' + dozo_token);

    // CLOSE SESSION
    session_close_submit.onclick = function() {
    	chrome.action.setIcon({path: 'icons/icon32.png'});
        chrome.storage.local.remove("dozo_code");

    	// console
    	console.log("options - session closed");
    };

    // OPEN SESSION
    session_open_submit.onclick = function() {

    	let input_dozo_username = document.getElementById('session_open_user').value;
    	let input_dozo_code = document.getElementById('session_open_code').value;

        // console
        console.log("input_dozo_username : " + input_dozo_username);
        console.log("input_dozo_code : " + input_dozo_code);

        if (input_dozo_username != "" && input_dozo_code != "") {

    		if(!/^[A-Za-z]+[A-Za-z-]+[A-Za-z]+$/i.test(input_dozo_username)) {
    				document.getElementById("console").innerHTML = "<div class='pb-3 text-monospace small text-danger'>"+chrome.i18n.getMessage("inputForbidden")+"</div>";
    		} else {

    			// WINDOWS
    			chrome.windows.getAll({"populate":true}, function(windows) {

    				let tabs_list = [];
    				let focus = 0;

    				windows.forEach(function(window){
    					// TABS
    					window.tabs.forEach(function(tab){
    						tabs_list.push('"' + encodeURIComponent(tab.url) + '"');
    					});
    				});

    				// LANG
    				let lang = chrome.i18n.getMessage('@@ui_locale');

    				// DATA
    				let data = '{"app_lang":"'+lang+'","app_focus":'+1+',"app_username":"'+input_dozo_username+'","app_token":"'+dozo_token+'","app_code":"'+input_dozo_code+'","nb_enabled_ext":"'+nb_enabled_ext+'", "tabs":[' + tabs_list.toString() + ']}'

    				var xhr = new XMLHttpRequest();
    				xhr.open("POST", "https://www.dozo.app/hub", true);
    				xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    				xhr.onreadystatechange = function() {
    					if (xhr.readyState == 4) {

    						var response = JSON.parse(xhr.responseText);

    						if (typeof response.message !== "undefined"){
    							document.getElementById("console").innerHTML = response.message;
    						}

    						if (typeof response.action != "undefined" && response.action == "session_ok"){

    							// SAVE DATA IN LOCAl STORAGE
                                chrome.storage.local.set({"dozo_username":input_dozo_username}, function() {
                                    console.log('username is set to ' + input_dozo_username);
                                });
                                chrome.storage.local.set({"dozo_code":input_dozo_code}, function() {
                                    console.log('code is set to ' + input_dozo_username);
                                });

                                // ICON ON
                                chrome.action.setIcon({path: 'icons/icon32_on.png'});

    							// CLOSE POPUP
    							window.close();
    						}

    					}
    				}
    				xhr.send(data);

    			});

    		}

    	} else {

    		document.getElementById("console").innerHTML = "<div class='pb-3 text-monospace small text-danger'>"+chrome.i18n.getMessage("inputEmpty")+"</div>";

    	}
    };

});
