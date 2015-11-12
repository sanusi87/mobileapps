angular.module('jenjobs.background.services', [])
.factory('BackgroundService', function($q, $http, JsDatabase, $ionicLoading){
	var myService;
	var serviceName = 'app.jenjobs.MyService';
	
	return {
		init: init,
		updateHandler: updateHandler
	};
	
	function init(){
		document.addEventListener('deviceready', function() {
			// 1) set the BackgroundService constructor
			var factory = cordova.require('com.red_folder.phonegap.plugin.backgroundservice.BackgroundService');
			// 2) to create a new background service
			myService = factory.create(serviceName);
			go();
		}, true);
	}

	// function getStatus() {
		// myService.getStatus(function(r){
			// displayResult(r)
		// }, function(e){
			// displayError(e)
		// });
	// }
	
	function displayResult(data) {
		alert("Is service running: " + data.ServiceRunning);
	}

	function displayError(data) {
		alert("We have an error");
	}
	
	function updateHandler(data) {
		var resultMessage = '';
		if (data.LatestResult != null) {
			try {
				resultMessage = data.LatestResult.Message;
			} catch (err) {
				
			}
		}
		return resultMessage;
	}
	
	
	/**
	Get current status of the plugin getStatus
	*/
	function go() {
		myService.getStatus(function(r){
			startService(r);
		}, function(e){
			displayError(e);
		});
	};
	
	/**
	Start the service if not already started startService
	*/
	function startService(data) {
		if (data.ServiceRunning) {
			enableTimer(data);
		} else {
			myService.startService(function(r){
				enableTimer(r);
			}, function(e){
				displayError(e);
			});
		}
	}
	
	/**
	Enabled the service timer if not already enabled enableTimer
	*/
	function enableTimer(data) {
		if (data.TimerEnabled) {
			registerForUpdates(data);
		} else {
			myService.enableTimer(60000, function(r){
				registerForUpdates(r);
			}, function(e){
				displayError(e);
			});
		}
	}
	
	/**
	Registers the updateHander (added above) to received the latest results registerForUpdates
	*/
	function registerForUpdates(data) {
		if (!data.RegisteredForUpdates) {
			myService.registerForUpdates(function(r){
				updateHandler(r);
			}, function(e){
				displayError(e);
			});
		}
	}


});