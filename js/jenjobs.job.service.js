angular.module('jenjobs.services', [])
.factory('JobSearch', function($http, JsDatabase, $ionicLoading){
	var jobs = {};
	
	return {
		search: searchJob,
		get: function(jobId) {
			if( jobs[jobId] ){
				return jobs[jobId];
			}
			return null;
		}
	};
	
	function searchJob( filter ){
		
		var param = {};
		
		$http({
			method: 'GET',
			url: 'http://api.jenjobs.local/jobs/search',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			data: param
		}).then(function(response){
			$ionicLoading.show({
				template: response.data.status_text,
				noBackdrop: true,
				duration: 1500
			});
		}).catch(function(e){
			console.log(e);
			$ionicLoading.show({
				template: 'Data synchronization failed!',
				noBackdrop: true,
				duration: 1500
			});
		});
	}
});