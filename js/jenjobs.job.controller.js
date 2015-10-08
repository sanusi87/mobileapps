angular.module('jenjobs.job', [])
.controller('JobCtrl', function($scope, $location, $http){
	$scope.go = function(path){
		$location.path(path);
	}
	
	
});