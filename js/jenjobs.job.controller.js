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

	$ionicModal.fromTemplateUrl('templates/modal/job-filter.html', {
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
.controller('JobDetailCtrl', function($scope, $stateParams, $location, $http, $ionicHistory, $ionicLoading, JsDatabase, JobSearch){
	$scope.bookmarked = false;
	$scope.applied = false;
	// console.log($location.absUrl());

	var urlParam = {};
	urlParam.post_id = $stateParams.jid;
	if( /closed\=1$/g.test( $location.absUrl() ) ){
		urlParam.closed = 1;
	}

	JobSearch.get(urlParam).then(function(job){
		$scope.job = job;

		// get bookmark status
		JobSearch.getBookmark($stateParams.jid).then(function(bookmark){
			$scope.bookmark = bookmark;
			$scope.bookmarked = true; // has bookmarked the job
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
		console.log('bookmarking 1 '+jid);
		JobSearch.bookmarkJob({
			post_id: jid,
			title: $scope.job.title,
			date_closed: $scope.job.date_closed
		}, $scope.access_token).then(function(status){
			console.log('bookmarked!');
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
		JsDatabase.getProfile().then(function(profile){
			JsDatabase.getSettings('completeness')
			.then(function(completeness){
				console.log(completeness);

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

				// if js uploaded a resume, no need to check for anything else
				var canApply = false;
				var alerts = [];

				if( completeness.attachment ){
					canApply = true;
				}else{
					if( completeness.profile ){
						if( completeness.workExp ){ // got work exp
							if( completeness.education ){ // got education
								if( completeness.jobseek ){
									if( completeness.jobPref ){
										if( completeness.language ){
											canApply = true;
										}else{
											alerts.push('Please fill in your spoken and written language!');
										}
									}else{
										alerts.push('Please complete your job preferences!');
									}
								}else{
									alerts.push('Please complete your jobseeking information!');
								}
							}else{
								alerts.push('Please add your education record!');
							}
						}else{
							// no work exp... need to check whether js has check the noWorkExp settings
							if( profile.no_work_exp ){
								canApply = true;
							}else{
								alerts.push('Please add your work experiences!');
							}
						}
					}else{
						alerts.push('Please complete your profile!');
					}
				}

				console.log(canApply);
				console.log(alerts);

				if( canApply ){
					JobSearch.apply({
						closed: false,
						date_created: new Date(),
						id: 0,
						post_id: $stateParams.jid,
						status: 0,
						title: $scope.job.title,
						//_id: $stateParams.jid
					}, $scope.access_token).then(function(doc){
						console.log(doc);
						$ionicLoading.show({
							template: 'Application submitted',
							noBackdrop: true,
							duration: 1000
						});
					}).catch(function(e){
						console.log(e);
					});
				}else{
					$ionicLoading.show({
						template: alerts.join(' '),
						noBackdrop: true,
						duration: 1000
					});
				}
			});
		});
	}

	$scope.go = function(path){
		$location.path(path);
	}

})

.controller('ApplicationCtrl', function($scope, JobSearch, JsDatabase){

	JobSearch.getApplication().then(function(application){
		console.log(application);
		if( application.length > 0 ){
			angular.forEach(application, function(app, i){
				console.log(app);
				app.status_desc = JobSearch.applicationStatus[app.status];
			});
		}
		$scope.application = application;
	});
})

.controller('BookmarkController', function($scope, JobSearch){
	$scope.bookmarks = [];
	JobSearch.getBookmarks().then(function(bookmarks){
		if( bookmarks ){
			$scope.bookmarks = bookmarks;
		}
	}).catch(function(e){
		console.log(e);
	});

	setTimeout(function(){ $scope.bookmarks }, 2000);
});
