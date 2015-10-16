angular.module('jenjobs.controllers', [])

.controller('ProfileCtrl', function($scope, $location, JsDatabase){
	$scope.js = {};

	JsDatabase.getProfile().then(function(profile){
		$scope.js = profile;
		console.log(profile);
	});

	$scope.go = function(path){
		$location.path(path);
	}
})

.controller('ProfileUpdateCtrl', function($scope, $http, $filter, $ionicPopup, $ionicModal, $ionicLoading, JsDatabase){
	$scope.access_token = null;
	JsDatabase.getToken().then(function(token){
		if( token.length > 0 ){
			$scope.access_token = token[0].access_token;
		}else{
			var alertPopup = $ionicPopup.alert({
				title: 'Notification',
				template: 'Failed to get access token!'
			});
		}
	});

	JsDatabase.getProfile().then(function(profile){
		$scope.js = profile;
	}).then(function(){
		$scope.gender = [{name: 'Male',id: 'M'}, {name: 'Female',id: 'F'}, {name: 'Undisclosed',id: 'U'}];
		if( $scope.js ){
			// console.log( $scope.js );
			if( /^m/ig.test( $scope.js.gender ) ){
				$scope.selectedGender = $scope.gender[0];
			}else if( /^f/ig.test( $scope.js.gender ) ){
				$scope.selectedGender = $scope.gender[1];
			}else{
				$scope.selectedGender = $scope.gender[2];
			}
		}else{
			$scope.selectedGender = $scope.gender[0];
		}
		// console.log( $scope.selectedGender );
	}).then(function(){
		$scope.selectedCountry = {
			name: $scope.js.country,
			id: $scope.js.country_id
		}
	});

	// gender
	$scope.genderChanged = function(){
		$scope.selectedGender = this.selectedGender;
		$scope.js.gender = $scope.selectedGender.name;
	}
	// end gender

	// countries
	$scope.countries = [];
	$scope.selectedCountry = {};
	JsDatabase.getParameter('countries').then(function(countries){
		delete(countries._id);
		delete(countries._rev);

		angular.forEach(countries, function(name, id){
			$scope.countries.push({
				name: name.name,
				id: id
			});
		});

		return;
	}).then(function(){

	});

	// country onChange
	$scope.countryChanged = function(){
		$scope.selectedCountry = this.selectedCountry; // update scope
		$scope.js.country = $scope.selectedCountry.name;
		$scope.js.country_id = $scope.selectedCountry.id;
	}
	// countries

	// avatar onChange event
	$scope.file_changed = function(element) {
		var photofile = element.files[0],
		reader = new FileReader(),
		img = new Image(), // original image
		tmp_img = new Image(), // image holder
		tmp_canvas = document.createElement('canvas'), // canvas
		tmp_ctx = tmp_canvas.getContext('2d'), // canvas context
		max_img_width = 400,
		max_img_height = 500;

		reader.onloadend = function(e) {
			// $scope.$apply(function() {
				// $scope.js.photo_file = e.target.result;
			// });

			tmp_img.src = e.target.result;
			tmp_canvas.width = max_img_width;
			tmp_canvas.height = max_img_height;
		};
		reader.readAsDataURL(photofile);

		tmp_img.onload = function(){
			if( tmp_img.width > tmp_img.height ){
				if( tmp_img.width > max_img_width ){
					img.height = ( tmp_img.height / tmp_img.width ) * max_img_width;
					img.width = tmp_canvas.width;
					tmp_canvas.height = img.height;
				}
			}else if( tmp_img.width < tmp_img.height ){
				if( tmp_img.height > max_img_height ){
					img.width = ( tmp_img.width / tmp_img.height ) * max_img_height;
					img.height = tmp_canvas.height;
					tmp_canvas.width = img.width;
				}
			}
			img.src = tmp_img.src;
		}

		img.onload = function(){
			// draw to context
			tmp_ctx.drawImage( img, 0, 0, tmp_canvas.width, tmp_canvas.height);

			// set the original image src using canvas data
			$scope.$apply(function() {
				$scope.js.photo_file = tmp_canvas.toDataURL();
			});
		}
	};

	$ionicModal.fromTemplateUrl('/templates/modal/country-dial-code.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.dialCodeModal = modal;
	});

	$scope.openCountryDialCode = function(){
		$scope.dialCodeModal.show();
	}

	$scope.closeCountryDialCode = function(){
		$scope.dialCodeModal.hide();
	}

	// update profile submit
	$scope.updateForm = function(){
		var errors = [];

		if( $scope.js.mobile_no.length == 0 ){
			errors.push('Mobile number is required');
		}else{
			if( /^\(\+/ig.test( $scope.js.mobile_no ) ){
				errors.push('Mobile number be in this format (+A)B, where A is your country code and B is your mobile number.');
			}
		}

		if( errors.length > 0 ){
			$ionicLoading.show({
				template: errors.join('. '),
				noBackdrop: true,
				duration: 1000
			});
		}else{
			JsDatabase.updateProfile( $scope.js )
			.then(function(){
				$ionicLoading.show({
					template: 'Your profile have successfully updated.',
					noBackdrop: true,
					duration: 1000
				});

				var param = {};
				param.photo_file = $scope.js.photo_file;
				param.name = $scope.js.name;
				param.country_id = $scope.js.country_id;
				param.dob = $filter('date')($scope.js.dob, 'yyyy-MM-dd');
				param.gender = $scope.js.gender;
				param.mobile_no = $scope.js.mobile_no;
				param.ic_no = $scope.js.ic_no;
				param.passport_no = $scope.js.passport_no;

				$http({
					method: 'POST',
					url: 'http://api.jenjobs.local/jobseeker/profile',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					data: param,
					params: {'access-token': $scope.access_token}
				}).then(function(response){
					console.log(response);
				}).catch(function(e){
					console.log(e);
				});
			}).catch(function(e){
				console.log(e);
			});
		}
		return false;
	}
})

.controller('LoginCtrl', function($scope, $http, $location, $ionicPopup, $ionicHistory, JsDatabase, JobSearch){
	$scope.user = {
		grant_type: 'password',
		username: '',
		password: '',
		client_id: 'testclient',
		client_secret: 'testpass'
	};

	$scope.submit = function(){
		// $http.post('http://api.jenjobs.local/oauth2/token', $scope.user)
		$http({
			method: 'POST',
			url: 'http://api.jenjobs.local/oauth2/token',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			data: $scope.user
		}).then(function(response){
			// success
			if( response.data && typeof( response.data.access_token ) != 'undefined' ){
				// add token to db
				JsDatabase.addToken( response.data );
				var accessToken = response.data.access_token;

				// download all parameters, profile, work, education etc

				// download parameters
				$http({method: 'GET',url: 'http://api.jenjobs.local/parameters/others'})
				.then(function(response){
					angular.forEach(response.data, function(value, i){
						JsDatabase.addParameter(value, i);
					});
				});

				// download countries, states, cities
				$http({method: 'GET',url: 'http://api.jenjobs.local/parameters/locations'})
				.then(function(response){
					angular.forEach(response.data, function(value, i){
						JsDatabase.addParameter(value, i);
					});
				});

				// download profile
				$http({
					method: 'GET',
					url: 'http://api.jenjobs.local/jobseeker/profile',
					params: {'access-token': accessToken}
				}).then(function(response){
					// remove _links from record, before saving, else it will cause bad special document member error, because _links is a reserved work in PouchDb
					// only for user profile/account
					delete(response.data._links);
					return response;
				}).then(function(response){
					JsDatabase.addProfile(response.data).then(function(){
						if( response.data.mobile_no && response.data.dob ){
							JsDatabase.updateCompleteness('profile', true);
						}
						$location.path('/tab/profile');
					});
				});

				// download job applications
				$http({
					method: 'GET',
					url: 'http://api.jenjobs.local/jobseeker/applications',
					params: {'access-token': accessToken}
				}).then(function(response){
					if( response.data.length > 0 ){
						angular.forEach(response.data, function(value, i){
							JsDatabase.addApplication(value, value.post_id);
						});
					}
				});

				// download work experiences
				$http({
					method: 'GET',
					url: 'http://api.jenjobs.local/jobseeker/work-experience',
					params: {'access-token': accessToken}
				}).then(function(response){
					if( response.data.length > 0 ){
						angular.forEach(response.data, function(value, i){
							JsDatabase.addWork(value);
						});
						JsDatabase.updateCompleteness('workExp', true);
					}
				});

				// download qualification/education
				$http({
					method: 'GET',
					url: 'http://api.jenjobs.local/jobseeker/qualification',
					params: {'access-token':accessToken}
				}).then(function(response){
					if( response.data.length > 0 ){
						angular.forEach(response.data, function(value, i){
							JsDatabase.addEducation(value);
						});
						JsDatabase.updateCompleteness('education', true);
					}
				});

				// download job preferences
				$http({
					method: 'GET',
					url: 'http://api.jenjobs.local/jobseeker/job-preference',
					params: {'access-token':accessToken}
				}).then(function(response){
					JsDatabase.addSettings(response.data, 'jobPref');
					if( response.data.salary && response.job_type_id.length > 0 ){
						JsDatabase.updateCompleteness('jobPref', true);
					}
				});
			}else{
				var alertPopup = $ionicPopup.alert({
					title: 'Notification',
					template: 'Login failed!'
				});
			}
		}, function(response){
			// failed
		});
	}

	$scope.$on('$ionicView.enter', function() {
		JsDatabase.getToken().then(function(token){
			// console.log(token);
			// if already got token, then redirect to profile
			if( token.length > 0 ){
				$ionicHistory.nextViewOptions({
					disableBack: true
				});
				$location.path('/tab/profile');
			}
		});
    });

	$scope.logout = function(){
		// JobSearch.getBookmarks().then(function(bookmarks){
		// 	angular.forEach(bookmarks, function(b,i){
		// 		JsDatabase.deleteBookmark(i, b._rev, token);
		// 	});
		// });

		// JsDatabase.deleteSettings();

		JobSearch.deleteAllJob();
		JobSearch.deleteAllBookmark();
		JobSearch.deleteAllApplication();
	}
})

.controller('RegisterCtrl', function( $scope, $http, $ionicHistory, $ionicLoading, JsDatabase ){

})

.controller('AccountCtrl', function($scope, $location, JsDatabase, JobSearch) {
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
							if( profile ){
								JsDatabase.deleteProfile(profile);
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

						JobSearch.getBookmarks().then(function(bookmarks){
							angular.forEach(bookmarks, function(b,i){
								JsDatabase.deleteBookmark(i, b._rev, token);
							});
						});

						JsDatabase.deleteSettings();
						JobSearch.deleteAllJob();
						JobSearch.deleteAllBookmark();
						JobSearch.deleteAllApplication();

						setTimeout(function(){
							$location.path('/login');
						}, 1000);
					});
				});
			}
		});


		return false;
	}
});
