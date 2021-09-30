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

var app_username;
var app_code;
var app_token;


chrome.storage.local.get(["app_username","app_code","app_token"], function (res){

    // check if app_username and app_code are in localStorage
    if (typeof res.app_username !== 'undefined' && typeof res.app_code !== 'undefined' && typeof res.app_token !== 'undefined'){
    	document.getElementById("session_open").style.display = "none";
    	document.getElementById("session_close").style.display = "block";

    	// CONSOLE
    	console.log("popup - close current session");

    } else {
    	chrome.action.setIcon({path: 'icons/icon32.png'});
    	document.getElementById("session_open").style.display = "block";
    	document.getElementById("session_close").style.display = "none";

    	// CONSOLE
    	console.log("start new session");
    }

    console.log('popup - app_username : ' + res.app_username);
    console.log('popup - app_code : ' + res.app_code);
    console.log('popup - app_token : ' + res.app_token);

    // cancel session
    session_close_submit.onclick = function() {
    	chrome.action.setIcon({path: 'icons/icon32.png'});
        chrome.storage.local.remove("app_username");
        chrome.storage.local.remove("app_code");

    	// CONSOLE
    	console.log("popup - session closed");
    };

    // open session
    session_open_submit.onclick = function() {

    	if (typeof res.app_token === "undefined"){
            chrome.storage.local.set({"app_token":(Math.random()+1).toString(36).substring(2)});
            // CONSOLE
        	console.log("token created");
    	}

    	let input_app_username = document.getElementById('session_open_user').value;
    	let input_app_code = document.getElementById('session_open_code').value;

        // CONSOLE
        console.log("input_app_username : " + input_app_username);
        console.log("input_app_code : " + input_app_code);

    	if (input_app_username != "" && input_app_code != "") {

    		if(!/^[A-Za-z]+[A-Za-z-]+[A-Za-z]+$/i.test(input_app_username)) {
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

    					//if (window.focused) focus = 1;

    				});

    				// LANG
    				let lang = chrome.i18n.getMessage('@@ui_locale');

    				// DATA
    				let data = '{"app_lang":"'+lang+'","app_focus":'+1+',"app_username":"'+input_app_username+'","app_token":"'+res.app_token+'","app_code":"'+input_app_code+'","tabs":[' + tabs_list.toString() + ']}'

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

    							// save data in local storage
                                chrome.storage.local.set({"app_username":input_app_username}, function() {
                                    console.log('username is set to ' + input_app_username);
                                });
                                chrome.storage.local.set({"app_code":input_app_code}, function() {
                                    console.log('code is set to ' + input_app_username);
                                });
    							// close popup
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
