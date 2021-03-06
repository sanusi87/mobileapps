angular.module('starter', ['ionic','ionic.service.core', 'jenjobs.controllers', 'jenjobs.resume', 'jenjobs.db', 'jenjobs.services', 'jenjobs.job', 'jenjobs.login', 'jenjobs.sync', 'textAngular', 'jenjobs.background.services'])

.run(function($ionicPlatform, JsDatabase, JobSearch, BackgroundService) {
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
		JobSearch.initDB();
		JsDatabase.periodicallyCheckNetworkConnection();
		// JsDatabase.updateAll();
		BackgroundService.init();
	});
})
.config(function($stateProvider, $urlRouterProvider, $httpProvider, $compileProvider, $ionicConfigProvider) {
	$stateProvider

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

	.state('logincheck', {
		url: '/logincheck',
		templateUrl: 'templates/progress.html',
		controller: 'CheckProfileCtrl'
	})

	.state('register', {
		url: '/register',
		templateUrl: 'templates/register.html',
		controller: 'RegisterCtrl'
	})

	.state('forgotpassword', {
		url: '/forgotpassword',
		templateUrl: 'templates/forgot-password.html',
		controller: 'ForgotPasswordCtrl'
	})

	.state('jobs', {
		url: '/jobs',
		templateUrl: 'templates/tab-job.html',
		controller: 'JobCtrl'
	})

	.state('job-details', {
		url: '/job-details/:jid',
		templateUrl: 'templates/tab-job-detail.html',
		controller: 'JobDetailCtrl'
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

	// profile overview
	.state('tab.profile', {
		url: '/profile',
		views: {
			'tab-profile': {
				templateUrl: 'templates/tab-profile.html',
				controller: 'ProfileCtrl'
			}
		}
	})

	// profile update section
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

	// access level update section
	.state('tab.resume-update-access-level', {
		url: '/resume-update-access-level',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-access-level.html',
				controller: 'AccessLevelCtrl'
			}
		}
	})

	// jobseeking info update section
	.state('tab.resume-update-jobseeking-information', {
		url: '/resume-update-jobseeking-information',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-jobseeking-information.html',
				controller: 'JobseekStatusCtrl'
			}
		}
	})

	// job preference update section
	.state('tab.resume-update-job-preferences', {
		url: '/resume-update-job-preferences',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-job-preferences.html',
				controller: 'JobPrefCtrl'
			}
		}
	})

	// work experiences add/update section
	.state('tab.resume-update-selected-work-experience', {
		url: '/resume-update-selected-work-experience/:workid',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-selected-work-experience.html',
				controller: 'WorkExpCtrl'
			}
		}
	})

	// education/qualification add/update section
	.state('tab.resume-update-selected-education', {
		url: '/resume-update-selected-education/:eduid',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-selected-education.html',
				controller: 'EduCtrl'
			}
		}
	})

	// upload resume attachment
	.state('tab.resume-update-attached-resume', {
		url: '/resume-update-attached-resume',
		views: {
			'tab-profile': {
				templateUrl: 'templates/resume/update-attached-resume.html',
				controller: 'AttachmentCtrl'
			}
		}
	})

	// update additional information
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
	.state('tab.job-details', {
		url: '/job-details/:jid',
		views: {
			'tab-job': {
				templateUrl: 'templates/tab-job-detail.html',
				controller: 'JobDetailCtrl'
			}
		}
	})
	.state('tab.bookmarks', {
		url: '/bookmarks',
		views: {
			'tab-job': {
				templateUrl: 'templates/tab-bookmarks.html',
				controller: 'BookmarkController'
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
		controller: 'TestCtrl'
	});

	// if none of the above states are matched, use this as the fallback
	$urlRouterProvider.otherwise('/login');

	// configing ajax request
	$httpProvider.defaults.useXDomain = true;
	$httpProvider.defaults.headers = {
		'Content-Type': 'application/json;charset=utf-8'
	};

	// disable javascript scroll to improve performace
	$ionicConfigProvider.scrolling.jsScrolling(false);
	// disable page transition delay
	$ionicConfigProvider.views.transition('none');

	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|geo):/);
});
