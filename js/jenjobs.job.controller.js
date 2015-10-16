angular.module('jenjobs.job', [])
.controller('JobCtrl', function($scope, $location, $http, $ionicModal, JobSearch){
	// $scope.go = function(path){
	// 	$location.path(path);
	// }

	JobSearch.search().then(function(jobs){
		console.log(jobs);
		$scope.jobs = jobs;
		// if( jobs.length > 0 ){
		// }else{
			// $scope.jobs = [];
		// }
	});

	$ionicModal.fromTemplateUrl('/templates/modal/job-filter.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.jobFilterModal = modal;
	});

	// open job search filter in modal
	$scope.openFilterModal = function(){
		$scope.jobFilterModal.show();
	}

	// open bookmark section
	$scope.openBookmarkSection = function(){
		$location.path('/tab/bookmarks');
	}

	$scope.saveAndCloseModal = function(){
		var filter = {};
		JobSearch.search(filter).then(function(jobs){
			console.log(jobs);
			$scope.jobs = jobs;
		});
		$scope.closeModal();
	}

	$scope.closeModal = function(){
		$scope.jobFilterModal.hide();
	}

	$scope.$on('modal.hidden', function(a) {
		console.log(a);
	});

})
.controller('JobDetailCtrl', function($scope, $stateParams, $location, $http, $ionicHistory, JsDatabase, JobSearch){
	$scope.bookmarked = false;
	$scope.applied = false;

	JobSearch.get($stateParams.jid).then(function(job){
		console.log(job);
		$scope.job = job;

		// get bookmark status
		JobSearch.getBookmark($stateParams.jid).then(function(bookmark){
			$scope.bookmark = bookmark;
			$scope.bookmarked = true; // has bookmarked the job
		}).then(function(){

		}).catch(function(err){
			console.log(err);
		});

		// get application status
		JobSearch.checkApplication($stateParams.jid).then(function(application){
			console.log(application);
			if(application){
				$scope.applied = true; // has applied for the job
			}
		}).catch(function(err){
			console.log(err);
		});
	}).catch(function(){
		$scope.job = {title: 'Undefined'};
		$scope.searchJob = function(){
			$ionicHistory.nextViewOptions({
				disableBack: true
			});
			$location.path('/tab/job');
		}
	});

	// console.log($scope.job);
	// if( !$scope.job ){
		// $ionicHistory.nextViewOptions({
			// disableBack: true
		// });
		// $location.path('/tab/job');
	// }


	JsDatabase.getToken().then(function(token){
		if( token.length > 0 ){
			$scope.access_token = token[0].access_token;
		}
	});

	$scope.bookmark = function( jid ){
		JobSearch.bookmarkJob({
			jid: jid,
			title: $scope.job.title,
			date_closed: $scope.job.date_closed
		}, $scope.access_token).then(function(status){
			$scope.bookmarked = true;
			$scope.bookmark._rev = status.rev; // update revision to update the object reference

			$scope.job._id = jid;
			JobSearch.saveJob($scope.job);
		}).catch(function(err){
			console.log(err);
		});
	}

	$scope.deleteBookmark = function( jid ){
		JobSearch.deleteBookmark( jid, $scope.bookmark._rev, $scope.access_token ).then(function(status){
			$scope.bookmarked = false;
			$scope.bookmark._rev = status.rev; // update revision to update the object reference

			JobSearch.deleteJob($scope.job);
		}).catch(function(err){
			console.log(err);
		});
	}

	$scope.submitApplication = function(){
		/**
		check resume completeness
			attached resume?
				ok -> can apply
				not ok -> need to complete online resume
					name, phone, birthday
					work exp
					education
					jobseeking information
					job preferences

		*/
	}
})
.controller('BookmarkController', function($scope, JobSearch){
	$scope.bookmarks = [];
	JobSearch.getBookmarks().then(function(bookmarks){
		// console.log(bookmarks);
		$scope.bookmarks = bookmarks;
	}).catch(function(e){
		console.log(e);
	});
});
