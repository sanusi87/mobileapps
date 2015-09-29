angular.module('starter.controllers', [])
.controller('DashCtrl', function($scope) {})
.controller('ChatsCtrl', function($scope, Chats) {
	// With the new view caching in Ionic, Controllers are only called
	// when they are recreated or on app start, instead of every page change.
	// To listen for when this page is active (for example, to refresh data),
	// listen for the $ionicView.enter event:
	//
	//$scope.$on('$ionicView.enter', function(e) {
	//});
	
	$scope.chats = Chats.all();
	$scope.remove = function(chat) {
		Chats.remove(chat);
	};
})
.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
	$scope.chat = Chats.get($stateParams.chatId);
})
.controller('AccountCtrl', function($scope, $location, JsDatabase) {
	// logout
	$scope.logout = function(){
		// keep parameter
		// remove token
		JsDatabase.getToken().then(function(token){
			if(token.length > 0){
				angular.forEach(token, function(t, i){
					JsDatabase.deleteToken(t).then(function(){
						
						// remove profile
						JsDatabase.getProfile().then(function(profile){
							if( profile.length > 0 ){
								angular.forEach(profile, function(p, i){
									JsDatabase.deleteProfile(p);
								});
							}
						});
						
						// remove work
						JsDatabase.getWork().then(function(work){
							if( work.length > 0 ){
								angular.forEach(work, function(w,i){
									JsDatabase.deleteWork(w);
								});
							}
						});
									
						// remove education
						JsDatabase.getEducation().then(function(education){
							if( education.length > 0 ){
								angular.forEach(education, function(e,i){
									JsDatabase.deleteEducation(e);
								});
							}
						});
						
						// remove skill
						JsDatabase.getSkill().then(function(skill){
							if( skill.length ){
								angular.forEach(skill, function(s,i){
									JsDatabase.deleteSkill(s);
								});
							}
						});
						
						// remove language
						JsDatabase.getLanguage().then(function(language){
							if( language.length ){
								angular.forEach(language, function(l,i){
									JsDatabase.deleteLanguage(l);
								});
							}
						});
						
						// $location.path('/login');
					});
				});
			}
		});
		
		
		return false;
	}
});
