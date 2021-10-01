'use strict';

function date(){
	var d = new Date();
	return d.getFullYear() + "/" +
		("00" + (d.getMonth() + 1)).slice(-2) + "/" +
		("00" + d.getDate()).slice(-2) + " " +
		("00" + d.getHours()).slice(-2) + ":" +
		("00" + d.getMinutes()).slice(-2) + ":" +
		("00" + d.getSeconds()).slice(-2);
}

chrome.runtime.onInstalled.addListener(() => {
	// CONSOLE
	console.log("background - " + date() + " - Installed...");
	chrome.alarms.create('refresh', { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {

	console.log('background - ok');

	chrome.storage.local.get(["app_username","app_code","app_token"], function (res){

		console.log('background - app_username : ' + res.app_username);
	    console.log('background - app_code : ' + res.app_code);
	    console.log('background - app_token : ' + res.app_token);

		if (typeof res.app_username !== 'undefined' && typeof res.app_code !== 'undefined' && typeof res.app_token !== 'undefined'){

			console.log('sending...');

			// ICON ON
			chrome.action.setIcon({path: 'icons/icon32_on.png'});

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

				// FOCUS
				if (window.focused) focus = 1;

				// LANG - PAS DISPO DANS MV3 ENCORE
				//let lang = chrome.i18n.getMessage('@@ui_locale');
				//console.log("background - lang : " + lang);

				// DATA
				let data = '{"app_lang":"fr","app_focus":'+focus+',"app_username":"'+res.app_username+'","app_token":"'+res.app_token+'","app_code":"'+res.app_code+'","tabs":[' + tabs_list.toString() + ']}';

				console.log("background - data");

				fetch("https://www.dozo.app/hub", {
					method: 'post',
					headers: {"Content-type": "application/x-www-form-urlencoded; charset=UTF-8"},
					body: data
					})
					.then(function (response) {
						if(response.ok) {
							response.json()
					        .then(function(item) {
								if (typeof item.action != "undefined" && item.action == "session_ok"){
									// CONSOLE
									console.log("background - " + date() + " - Session running");
								}
								if (typeof item.action != "undefined" && item.action == "session_stop") {
									chrome.storage.local.remove(["app_username","app_code"],function(){
									    console.log("app_username and app_code removed");
									})
									chrome.action.setIcon({path: 'icons/icon32.png'});

									// CONSOLE
									console.log("background - " + date() + " - Session closed");
								}
					        })
						} else {
							console.log(response.status);
						}
					})
					.catch(function (error) {
						console.log('Request failed', error);
				});
			});

		} else {
			// CONSOLE
			console.log("background - " + date() + " - Session sleeping");
		}
	});
});
