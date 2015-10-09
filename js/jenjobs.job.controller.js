angular.module('jenjobs.job', [])
.controller('JobCtrl', function($scope, $location, $http, JobSearch){
	$scope.go = function(path){
		$location.path(path);
	}
	
	JobSearch.search().then(function(jobs){
		console.log(jobs);
		$scope.jobs = jobs;
		// if( jobs.length > 0 ){
		// }else{
			// $scope.jobs = [];
		// }
	});
}).controller('JobDetailCtrl', function($scope, $stateParams, $location, $http, $ionicHistory, JobSearch){
	console.log($stateParams);
	$scope.job = JobSearch.get($stateParams.jid);
	// if( !$scope.job ){
		// $ionicHistory.nextViewOptions({
			// disableBack: true
		// });
		// $location.path('/tab/job');
	// }
	console.log($scope.job);
	
	$scope.bookmark = function( jid ){
		JobSearch.bookmarkJob( jid ).then(function(status){
			console.log(status);
		});
	}
	
	$scope.deleteBookmark = function( jid, rev ){
		JobSearch.deleteBookmark( jid, rev ).then(function(status){
			console.log(status);
		});
	}
});