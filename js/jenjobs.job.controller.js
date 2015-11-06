angular.module('jenjobs.job', [])
.controller('JobCtrl', function($scope, $state, $location, $http, $filter, $ionicModal, $ionicHistory, JobSearch, JsDatabase){
	$scope.jobs = [];
	$scope.tmp = {search_by: {id:1}};

	$scope.params = {
		page: 1,
		keyword: null,
		o: null,
		b: null,
		search_by: null,
		emid: null,
		job_level_id: [],
		industry_id: null,
		job_spec_id: [],
		job_role_id: [],
		country_id: [],
		state_id: [],
		salary_min: null,
		salary_max: null,
		job_type_id: [],
		seostate: null,
		advertiser: null,
		direct_employer: null
	};

	$scope.currentState = $state.current.name;
	$scope.jobTypes = [];
	$scope.countries = [];
	$scope.states = [];
	$scope.jobSpecs = [];
	$scope.selectedJobType = [];
	$scope.selectedJobLevel = [];
	$scope.selectedState = [];
	$scope.showRoles = {};
	$scope.selectedJobSpec = [];
	$scope.selectedJobRole = [];
	$scope.disableJobRole = {};
	$scope.specString = '';

	$scope.keywordFilter = [];
	var keywordFilters = {
		1: 'Position Title',
		2: 'Company Name',
		3: 'Skills',
		4: 'Job Description'
	};
	angular.forEach(keywordFilters, function(value, id){
		$scope.keywordFilter.push({
			id: id,
			name: value
		});
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

	// job type
	JsDatabase.getParameter('jobType').then(function(jobTypes){
		delete(jobTypes._id);
		delete(jobTypes._rev);

		$scope.jobTypes = jobTypes;
	});

	$scope.checkValue = function(){
		if( !$scope.selectedJobType[this.id] ){
			$scope.params.job_type_id.splice( $scope.params.job_type_id.indexOf(this.id), 1 );
		}else{
			$scope.params.job_type_id.push(this.id);
		}
	}
	// job type

	// job level
	JsDatabase.getParameter('jobLevel').then(function(jobLevels){
		delete(jobLevels._id);
		delete(jobLevels._rev);
		$scope.jobLevels = jobLevels;
	});

	$scope.checkJobLevelValue = function(){
		if( !$scope.selectedJobLevel[this.id] ){
			$scope.params.job_level_id.splice( $scope.params.job_level_id.indexOf(this.id), 1 );
		}else{
			$scope.params.job_level_id.push(this.id);
		}
	}
	// job level

	// country
	$scope.showMalaysiaState = true;
	$scope.malaysiaStateStatus = 'Select state';
	$scope.wholeStateIsSelected = false;
	$scope.toggleCountry = function( countryID ){
		countryID = Number(countryID);
		if( $scope.params.country_id.indexOf( countryID ) == -1 ){ // not found
			$scope.params.country_id.push(countryID);

			if( countryID == 127 ){
				$scope.malaysiaStateStatus = 'All states';
				$scope.showMalaysiaState = false;
				$scope.wholeStateIsSelected = true;
				$scope.params.state_id = [];
				$scope.selectedState = [];
			}
		}else{ // found
			$scope.params.country_id.splice( $scope.params.country_id.indexOf( countryID ), 1 );
			if( countryID == 127 ){
				$scope.showMalaysiaState = true;
				$scope.malaysiaStateStatus = 'Select state';
				$scope.wholeStateIsSelected = false;
			}
		}
		createCountryString();
	};

	JsDatabase.getParameter('states').then(function(states){
		delete(states._id);
		delete(states._rev);

		// we set the plain object({4:johor,5:xxx}) to tempStates
		$scope.tempStates = states;
		angular.forEach(states, function(name, id){
			// the we set the updated object({name:johor,id:4}...) to states
			$scope.states.push({
				name: name.name,
				id: id
			});
		});
		return;
	});

	$ionicModal.fromTemplateUrl('templates/modal/state-modal-with-close.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.stateModal = modal;
	});

	JsDatabase.getParameter('countries').then(function(countries){
		delete(countries._id);
		delete(countries._rev);

		delete(countries[127]);
		delete(countries[187]);

		$scope.tempCountries = countries;
		angular.forEach(countries, function(name, id){
			$scope.countries.push({
				name: name.name,
				id: id
			});
		});
		return;
	});

	$ionicModal.fromTemplateUrl('templates/modal/country-modal-with-close.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.countryModal = modal;
	});

	$scope.showCountryModal = function(){ $scope.countryModal.show(); }
	$scope.closeCountryModal = function(){ $scope.countryModal.hide(); }

	$scope.showStateModal = function(){
		$scope.stateModal.show();
	}

	$scope.closeStateModal = function(){
		$scope.stateModal.hide();
	}

	$scope.saveAndCloseStateModal = function(){
		$scope.stateModal.hide();

		if( Object.keys($scope.selectedState).length > 0 ){
			$scope.params.state_id = [];
			angular.forEach($scope.selectedState, function(e,i){
				if( e != 0 ){
					$scope.params.state_id.push(e);
				}
			});
			createStateString();
		}
	}

	$scope.countryString = '';
	function createCountryString(){
		if( $scope.params.country_id.length > 0 ){
			var tempCountry = [];
			angular.forEach($scope.params.country_id, function(e,i){
				if( e != 127 && e != 187 ){
					tempCountry.push( $scope.tempCountries[e].name );
				}
			});
			$scope.countryString = tempCountry.join(', ');
		}
	}

	function createStateString(){
		if( $scope.params.state_id.length > 0 ){
			var tempState = [];
			angular.forEach($scope.params.state_id, function(e,i){
				tempState.push( $scope.tempStates[e].name );
			});
			$scope.malaysiaStateStatus = tempState.join(', ');
		}
	}
	// country

	$scope.go = function(path){
		$ionicHistory.nextViewOptions({
			disableBack: true
		});
		$location.path(path);
	}

	$scope.filterJobs = function(){
		$scope.jobs = [];
		$scope.params.page = 1;

		if( $scope.tmp.search_by ){
			$scope.params.search_by = $scope.tmp.search_by.id;
		}

		setTimeout(function(){
			JobSearch.search($scope.params).then(function(jobs){
				angular.forEach(jobs, function(e,i){
					$scope.jobs.push(e);
				});
			});
			$scope.closeModal();
		}, 500);
	}

	$scope.closeModal = function(){ $scope.jobFilterModal.hide(); }
	$scope.$on('modal.hidden', function(a) {  });

	$scope.resetFilter = function(){
		$scope.tmp = {search_by: {id:1}};
		$scope.params = {
			page: 1,
			keyword: null,
			o: null,
			b: null,
			search_by: null,
			emid: null,
			job_level_id: [],
			industry_id: null,
			job_spec_id: null,
			job_role_id: null,
			country_id: [],
			state_id: [],
			salary_min: null,
			salary_max: null,
			job_type_id: [],
			seostate: null,
			advertiser: null,
			direct_employer: null
		};

		$scope.selectedJobType = [];
		$scope.selectedJobLevel = [];
		$scope.countries = [];
		$scope.states = [];
		$scope.selectedState = [];
		$scope.showRoles = {};
		$scope.selectedJobSpec = [];
		$scope.selectedJobRole = [];
		$scope.disableJobRole = {};
		$scope.specString = '';
	}

	var isLoading = false;
	$scope.gotMoreData = true;
	$scope.loadMore = function(){
		if( $scope.gotMoreData ){
			if( !isLoading ){
				isLoading = true;

				$scope.params.page += 1;
				JobSearch.search($scope.params, function(){
					// we should broadcast this event once data has been loaded
					$scope.$broadcast('scroll.infiniteScrollComplete');
				}).then(function(jobs){
					if( Object.keys(jobs).length == 0 ){
						$scope.gotMoreData = false;
					}

					if( $scope.jobs.length > 100 ){
						$scope.jobs.splice(0,20);
					}
					angular.forEach(jobs, function(e,i){
						$scope.jobs.push(e);
					});
					isLoading = false;
				}).catch(function(err){
					console.log(err);
					isLoading = false;
					$scope.gotMoreData = false;
				});
			}
		}
	}

	// specialisation
	$ionicModal.fromTemplateUrl('templates/modal/job-spec-modal-with-close.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) { $scope.jobSpecModal = modal; });

	JsDatabase.getParameter('jobSpec').then(function(jobSpecs){
		delete(jobSpecs._id);
		delete(jobSpecs._rev);
		$scope.jobSpecs = jobSpecs;

		angular.forEach(jobSpecs, function(e,i){
			$scope.showRoles[i] = true;
		});
	});

	$scope.showSpecModal = function(){ $scope.jobSpecModal.show(); }

	$scope.hideSpecModal = function(addFilter){
		$scope.jobSpecModal.hide();

		if( addFilter ){
			$scope.specString = '';
			angular.forEach($scope.selectedJobSpec, function(e,i){
				$scope.specString += $scope.jobSpecs[e].name;
				if( $scope.selectedJobRole[e] ){
					var temp = [];
					angular.forEach($scope.selectedJobRole[e], function(f,j){
						// console.log($scope.jobSpecs[e].roles);
						temp.push( $scope.jobSpecs[e].roles[f] );
					});
					$scope.specString += ' ('+temp.join(', ')+')<br />';
				}
			});
		}
	}

	$scope.toggleSpec = function(){
		if( $scope.params.job_spec_id.indexOf( this.id ) == -1 ){
			$scope.params.job_spec_id.push( this.id );

			if( !$scope.disableJobRole[this.id] ){
				$scope.disableJobRole[this.id] = true;
			}
			$scope.disableJobRole[this.id] = true;
		}else{
			$scope.params.job_spec_id.splice( $scope.params.job_spec_id.indexOf( this.id ),1 );
			delete($scope.selectedJobSpec[this.id]);

			// disable job roles under this job spec
			if( !$scope.disableJobRole[this.id] ){
				$scope.disableJobRole[this.id] = false;
			}
			$scope.disableJobRole[this.id] = false;

			// and remove check
			if( $scope.selectedJobRole[this.id] ){
				angular.forEach($scope.selectedJobRole[this.id], function(e,i){
					// console.log(e);
					$scope.params.role.splice( $scope.params.role.indexOf( e ),1 );
				});
				delete($scope.selectedJobRole[this.id]);
			}
		}
		// console.log($scope.selectedJobRole);
		// console.log($scope.selectedJobSpec);
		// console.log($scope.params.job_spec_id);
		// console.log($scope.params.job_role_id);
	};

	$scope.toggleRole = function(){
		if( $scope.params.job_role_id.indexOf( this.roleid ) == -1 ){
			$scope.params.job_role_id.push( this.roleid );
		}else{
			$scope.params.job_role_id.splice( $scope.params.job_role_id.indexOf( this.roleid ),1 );
		}
	};

})

.controller('JobDetailCtrl', function($scope, $state, $stateParams, $location, $http, $ionicHistory, $ionicLoading, $ionicModal, JsDatabase, JobSearch){
	$scope.bookmarked = false;
	$scope.applied = false;
	$scope.currentState = $state.current.name;
	$scope.jobTitle = 'loading...';
	$scope.isLoading = true;

	var urlParam = {};
	urlParam.post_id = $stateParams.jid;
	if( /closed\=1$/g.test( $location.absUrl() ) ){
		urlParam.closed = 1;
	}

	$scope.$on('$ionicView.enter', function(scopes, states) {
		JobSearch.get(urlParam).then(function(job){
			$scope.job = job;
			$scope.jobTitle = job.title;
			$scope.isLoading = false;

			// get bookmark status
			JobSearch.getBookmark($stateParams.jid).then(function(bookmark){
				$scope.bookmark = bookmark;
				$scope.bookmarked = true; // has bookmarked the job
			}).catch(function(err){
				// no bookmark
				//console.log(err);
			});

			// get application status
			JobSearch.checkApplication($stateParams.jid).then(function(application){
				console.log(application);
				if(application){
					$scope.applied = true; // has applied for the job
				}
			}).catch(function(err){
				// no application
				//console.log(err);
			});
		}).catch(function(){
			$scope.job = {title: 'Undefined'};
			$scope.jobTitle = $scope.job.title;
			$scope.isLoading = false;
		});
	});

	$scope.searchJob = function(){
		$ionicHistory.nextViewOptions({
			disableBack: true
		});
		$location.path('/tab/job');
	}

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
		$ionicHistory.nextViewOptions({
			disableBack: true
		});
		$location.path(path);
	}

	$scope.browse = function(url){
		window.open(url,'_system');
	}

	// company details
	$ionicModal.fromTemplateUrl('templates/modal/company-details.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.companyModal = modal;
	});

	$scope.openCompanyModal = function(){
		$scope.companyModal.show();
	}

	$scope.closeCompanyModal = function(){
		$scope.companyModal.hide();
	}
	// end company details
})

.controller('ApplicationCtrl', function($scope, $ionicHistory, $location, JobSearch, JsDatabase){

	$scope.$on('$ionicView.enter', function(){
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
	});

	$scope.go = function(path){
		$ionicHistory.nextViewOptions({
			disableBack: true
		});
		$location.path(path);
	}

})

.controller('BookmarkController', function($scope, $location, $ionicHistory, JobSearch, JsDatabase, $ionicPopup){
	$scope.bookmarks = [];
	JsDatabase.getToken().then(function(token){
		if( token.length > 0 ){
			$scope.access_token = token[0].access_token;
		}else{
			$ionicPopup.alert({
				title: 'Notification',
				template: 'Failed to get access token!'
			});
		}
	});

	$scope.$on('$ionicView.enter', function(){
		JobSearch.getBookmarks().then(function(bookmarks){
			if( bookmarks ){
				$scope.bookmarks = bookmarks;
			}
		}).catch(function(e){
			console.log(e);
		});
	})

	$scope.deleteBookmark = function(bookmark){
		var confirmPopup = $ionicPopup.confirm({
			title: 'Confirmation',
			template: 'Remove this bookmark?'
		});

		confirmPopup.then(function(res) {
			if(res) {
				JobSearch.deleteBookmark( bookmark._id, bookmark._rev, $scope.access_token ).then(function(status){
					// get the job then delete.
					JobSearch.getSavedJob(bookmark._id).then(function(job){
						JobSearch.deleteJob(job);

						// console.log($scope.bookmarks);
						$scope.bookmarks.splice( $scope.bookmarks.indexOf( bookmark ) ,1);
					});
				}).catch(function(err){
					console.log(err);
				});
			}
		});
	}

	$scope.go = function(path){
		$ionicHistory.nextViewOptions({
			disableBack: true
		});
		$location.path(path);
	}

});
