// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'jenjobs.controllers', 'jenjobs.resume', 'jenjobs.db', 'jenjobs.job'])
.run(function($ionicPlatform, JsDatabase) {
	$ionicPlatform.ready(function(){
		// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
		// for form inputs)
		if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			cordova.plugins.Keyboard.disableScroll(true);
		}
		
		if (window.StatusBar) {
			// org.apache.cordova.statusbar required
			StatusBar.styleLightContent();
		}
		
		JsDatabase.initDB();
	});
})
.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
	// Ionic uses AngularUI Router which uses the concept of states
	// Learn more here: https://github.com/angular-ui/ui-router
	// Set up the various states which the app can be in.
	// Each state's controller can be found in controllers.js
	$stateProvider
	
	// setup an abstract state for the tabs directive
	.state('tab', {
		url: '/tab',
		abstract: true,
		templateUrl: 'templates/tabs.html'
	})
	
	.state('login', {
		url: '/login',
		templateUrl: 'templates/login.html',
		controller: 'LoginCtrl'
	})
	
	.state('tab.settings', {
		url: '/settings',
		views: {
			'tab-settings': {
				templateUrl: 'templates/tab-settings.html',
				controller: 'AccountCtrl'
			}
		}
	})
	
	.state('tab.profile', {
		url: '/profile',
		views: {
			'tab-profile': {
				templateUrl: 'templates/tab-profile.html',
				controller: 'ProfileCtrl'
			}
		}
	})
	.state('tab.profile-update', {
		url: '/profile-update',
		views: {
			'tab-profile': {
				templateUrl: 'templates/tab-profile-update.html',
				controller: 'ProfileUpdateCtrl'
			}
		}
	})
	// resume details
	.state('tab.resume', {
		url: '/resume',
		views: {
			'tab-profile': {
				templateUrl: 'templates/tab-resume.html',
				controller: 'ResumeCtrl'
			}
		}
	})
	
	// #/tab/resume-update-access-level
	// #/tab/resume-update-jobseeking-information
	// #/tab/resume-update-job-preferences
	// #/tab/resume-update-work-experience
	// #/tab/resume-update-education
	// #/tab/resume-update-skill
	// #/tab/resume-update-attached-resume
	// #/tab/resume-update-additional-info
	
	.state('tab.resume-update-access-level', {
		url: '/resume-update-access-level',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-access-level.html',
				controller: 'AccessLevelCtrl'
			}
		}
	})
	.state('tab.resume-update-jobseeking-information', {
		url: '/resume-update-jobseeking-information',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-jobseeking-information.html',
				controller: 'JobseekStatusCtrl'
			}
		}
	})
	.state('tab.resume-update-job-preferences', {
		url: '/resume-update-job-preferences',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-job-preferences.html',
				controller: 'JobPrefCtrl'
			}
		}
	})
	
	.state('tab.resume-update-selected-work-experience', {
		url: '/resume-update-selected-work-experience/:workid',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-selected-work-experience.html',
				controller: 'WorkExpCtrl'
			}
		}
	})
	.state('tab.resume-update-selected-education', {
		url: '/resume-update-selected-education/:eduid',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-selected-education.html',
				controller: 'EduCtrl'
			}
		}
	})
	
	.state('tab.resume-update-attached-resume', {
		url: '/resume-update-attached-resume',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-attached-resume.html',
				controller: 'AttachmentCtrl'
			}
		}
	})
	.state('tab.resume-update-additional-info', {
		url: '/resume-update-additional-info',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-additional-info.html',
				controller: 'AdditionalInfoCtrl'
			}
		}
	})
	// done resume
	
	.state('tab.job', {
		url: '/job',
		views: {
			'tab-job': {
				templateUrl: 'templates/tab-job.html',
				controller: 'JobCtrl'
			}
		}
	})
	.state('tab.job-filter', {
		url: '/job-filter',
		views: {
			'tab-job': {
				templateUrl: 'templates/tab-job-filter.html',
				controller: 'JobFilterCtrl'
			}
		}
	})
	
	.state('tab.application', {
		url: '/application',
		views: {
			'tab-application': {
				templateUrl: 'templates/tab-application.html',
				controller: 'ApplicationCtrl'
			}
		}
	})
	
	.state('test', {
		url: '/test',
		templateUrl: 'templates/test.html',
		controller: 'WorkCtrl'
	});
	
	// if none of the above states are matched, use this as the fallback
	$urlRouterProvider.otherwise('/login');
	
	// configing ajax request
	$httpProvider.defaults.useXDomain = true;
	$httpProvider.defaults.headers = {
		'Content-Type': 'application/json;charset=utf-8'
	};
});
