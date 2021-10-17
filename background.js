'use strict';

chrome.action.onClicked.addListener(() => {
	chrome.runtime.openOptionsPage()
})

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

	chrome.storage.local.get(["dozo_username","dozo_code","dozo_token"], function (res){

		console.log('background - app_username : ' + res.dozo_username);
	    console.log('background - app_code : ' + res.dozo_code);
	    console.log('background - app_token : ' + res.dozo_token);

		if (typeof res.dozo_username !== 'undefined' && typeof res.dozo_code !== 'undefined' && typeof res.dozo_token !== 'undefined'){

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

					// FOCUS
					if (window.focused) focus = 1;
				});

				// LANG - PAS ENCORE DISPO DANS MV3
				//let lang = chrome.i18n.getMessage('@@ui_locale');
				//console.log("background - lang : " + lang);

				// get number of enabled extensions
				chrome.management.getAll(function(extensions) {

				    var nb_enabled_ext = 0
				    extensions.forEach(function(extension) {
				        if (extension.type == "extension" && extension.enabled) nb_enabled_ext++;
				    });
				    // console
				    console.log("nb_enabled_ext : " + nb_enabled_ext);


					// DATA
					let data = '{"app_lang":"fr","app_focus":'+focus+',"app_username":"'+res.dozo_username+'","app_token":"'+res.dozo_token+'","app_code":"'+res.dozo_code+'","nb_enabled_ext":"'+nb_enabled_ext+'","tabs":[' + tabs_list.toString() + ']}';

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
										chrome.storage.local.remove(["app_code"],function(){
										    console.log("app_code removed");
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
			});

		} else {
			// CONSOLE
			console.log("background - " + date() + " - Session sleeping");
		}
	});
});
