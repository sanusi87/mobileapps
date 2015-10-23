angular.module('jenjobs.controllers', [])

.controller('ProfileCtrl', function($scope, $location, JsDatabase){
	$scope.js = {};
	$scope.access_token = null;

	JsDatabase.getProfile().then(function(profile){
		$scope.js = profile;
		console.log(profile);
	});

	$scope.go = function(path){
		$location.path(path);
	}

	JsDatabase.getToken().then(function(token){
		if( token.length > 0 ){

		}else{
			$location.path('/login');
		}
	});
})

.controller('ProfileUpdateCtrl', function($scope, $http, $filter, $ionicPopup, $ionicModal, $ionicLoading, JsDatabase){
	$scope.access_token = null;
	JsDatabase.getToken().then(function(token){
		if( token.length > 0 ){
			$scope.access_token = token[0].access_token;
		}else{
			$location.path('/login');
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

	$ionicModal.fromTemplateUrl('templates/modal/country-dial-code.html', {
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

.controller('LoginCtrl', function($scope, $http, $location, $ionicPopup, $ionicHistory, JsDatabase, JobSearch, JobseekerLogin){
	$scope.disableButton = false;

	$scope.user = {
		grant_type: 'password',
		username: '',
		password: '',
		client_id: 'testclient',
		client_secret: 'testpass'
	}

	$scope.button = {
		text: 'Login'
	}

	$scope.submit = function(){
		$scope.button.text = 'Login...';

		$scope.disableButton = true;
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
				$scope.button.text = 'Downloading data...';

				// add token to db
				JsDatabase.addToken( response.data );
				var accessToken = response.data.access_token;

				// download parameters
				$http({method: 'GET',url: 'http://api.jenjobs.local/parameters/others'})
				.then(function(response_param){
					angular.forEach(response_param.data, function(value, i){
						JsDatabase.addParameter(value, i);
					});

					// download countries, states, cities
					$http({method: 'GET',url: 'http://api.jenjobs.local/parameters/locations'})
					.then(function(response_loc){
						angular.forEach(response_loc.data, function(value, i){
							JsDatabase.addParameter(value, i);
						});

						var completedItems = [];

						// download profile
						$http({
							method: 'GET',
							url: 'http://api.jenjobs.local/jobseeker/profile',
							params: {'access-token': accessToken}
						}).then(function(response_profile){
							// remove _links from record, before saving, else it will cause bad special document member error, because _links is a reserved work in PouchDb
							// only for user profile/account
							delete(response_profile.data._links);
							response_profile.data.no_work_exp = response_profile.data.no_work_exp == 0 ? false : true;

							return response_profile;
						}).then(function(response_profile){
							JsDatabase.addProfile(response_profile.data).then(function(){
								if( response_profile.data.mobile_no && response_profile.data.dob ){
									// JsDatabase.updateCompleteness('profile', true);
									completedItems.push('profile');
								}

								if( response_profile.data.resume_file && response_profile.data.resume_file.length > 5 ){
									completedItems.push('attachment');
								}

								if( response_profile.data.availability ){
									completedItems.push('jobseek');
								}
							});



							// download job applications
							$http({
								method: 'GET',
								url: 'http://api.jenjobs.local/jobseeker/application',
								params: {'access-token': accessToken}
							}).then(function(response_app){
								console.log(response_app);
								if( response_app.data.length > 0 ){
									angular.forEach(response_app.data, function(value, i){
										console.log(value);
										value._id = String(value.post_id);

										JobSearch.apply(value).then(function(doc){
											console.log(doc);
										}).catch(function(err){
											console.log(err);
										});
									});
								}

								// download work experiences
								$http({
									method: 'GET',
									url: 'http://api.jenjobs.local/jobseeker/work-experience',
									params: {'access-token': accessToken}
								}).then(function(response_work){
									if( response_work.data.length > 0 ){
										angular.forEach(response_work.data, function(value, i){
											JsDatabase.addWork(value);
										});
										// JsDatabase.updateCompleteness('workExp', true);
										completedItems.push('workExp');
									}

									// download qualification/education
									$http({
										method: 'GET',
										url: 'http://api.jenjobs.local/jobseeker/qualification',
										params: {'access-token':accessToken}
									}).then(function(response_edu){
										if( response_edu.data.length > 0 ){
											angular.forEach(response_edu.data, function(value, i){
												JsDatabase.addEducation(value);
											});
											// JsDatabase.updateCompleteness('education', true);
											completedItems.push('education');
										}

										// download job preferences
										$http({
											method: 'GET',
											url: 'http://api.jenjobs.local/jobseeker/job-preference',
											params: {'access-token':accessToken}
										}).then(function(resp){
											JsDatabase.addSettings(resp.data, 'jobPref');
											if( resp.data.salary && resp.data.job_type_id.length > 0 ){
												// JsDatabase.updateCompleteness('jobPref', true);
												completedItems.push('jobPref');
											}

											// download skills
											$http({
												method: 'GET',
												url: 'http://api.jenjobs.local/jobseeker/skill',
												params: {'access-token':accessToken}
											}).then(function(respo){

												if( respo.data.length > 0 ){
													angular.forEach(respo.data, function(skill, i){
														JsDatabase.addSkill(skill);
													});
												}

												// download languages
												$http({
													method: 'GET',
													url: 'http://api.jenjobs.local/jobseeker/language',
													params: {'access-token':accessToken}
												}).then(function(respon){
													if( respon.data.length > 0 ){
														angular.forEach(respon.data, function(lang, i){
															JsDatabase.addLanguage(lang);
														});
														completedItems.push('language');
													}

													// download bookmarks
													$http({
														method: 'GET',
														url: 'http://api.jenjobs.local/jobseeker/bookmark',
														params: {'access-token':accessToken}
													}).then(function(respon){
														if( respon.data.length > 0 ){
															angular.forEach(respon.data, function(bookmark, i){
																JobSearch.bookmarkJob(bookmark);
															});
														}

														console.log(completedItems);
														if( completedItems.length > 0 ){
															loopItem();

															function loopItem(){
																if( completedItems.length > 0 ){
																	console.log('completeness updated.');
																	updateCompleteness(completedItems[0]);
																}else{
																	$scope.disableButton = false;
																	console.log('reached');
																	$location.path('/tab/profile');
																}
															}

															function updateCompleteness( key ){
																JsDatabase.updateCompleteness(key, true)
																.then(function(){
																	completedItems.splice(0,1);
																	loopItem();
																}).catch(function(e){
																	console.log(e);
																});
															}
														}else{
															$scope.disableButton = false;
															console.log('reached');
															$location.path('/tab/profile');
														}
													}); // download bookmarks
												}); // done languages
											}); // done skills
										}); // done job preferences
									}); // done qualification
								}); // done work experience
							}); // done application



						}); // done profile
					}); // done location
				}); // done parameter
			}else{
				$scope.button.text = 'Login';
				var alertPopup = $ionicPopup.alert({
					title: 'Notification',
					template: 'Login failed!'
				});
			}
		}).catch(function(response){
			$scope.button.text = 'Login';
			// failed
			$scope.disableButton = false;
			var alertPopup = $ionicPopup.alert({
				title: 'Notification',
				template: angular.toJson(response, true)
			});
		});
	}

	var enterEventFired = false;
	$scope.$on('$ionicView.enter', function() {
		enterEventFired = true;
		runEnterEvent();
    });

	// trying to trigger enter event if not yet executed
	setTimeout(function(){
		if( !enterEventFired ){
			runEnterEvent();
		}
	}, 2000);

	function runEnterEvent(){
		JsDatabase.getToken().then(function(token){
			// if already got token, then redirect to profile
			if( token.length > 0 ){
				$ionicHistory.nextViewOptions({
					disableBack: true
				});
				$location.path('/tab/profile');
			}
		});
	}
})

.controller('RegisterCtrl', function( $scope, $http, $ionicHistory, $ionicLoading, JsDatabase, JobseekerLogin ){
	$scope.js = {
		name: '',
		email: '',
		password: '',
		repeat_password: ''
	},
	$scope.button = {
		text: 'Register'
	}

	$scope.submit = function(){
		$scope.button.text = 'Registering...';
		$http({
			method: 'POST',
			url: 'http://api.jenjobs.local/register/jobseeker',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			data: $scope.user
		}).then(function(response){
			console.log(response);

			if( response.data.status_code == 1 ){
				$scope.button.text = 'Registration success.';

			}else{
				$scope.button.text = 'Register';
			}
		});
	}
})

.controller('AccountCtrl', function($scope, $location, JsDatabase, JobSearch) {
	$scope.access_token = null;
	JsDatabase.getToken().then(function(token){
		if(token.length > 0){
			$scope.access_token = token;
		}else{
			$location.path('/login');
		}
	}).catch(function(){
		$location.path('/login');
	});

	// logout
	$scope.logout = function(){
		// keep parameter
		// remove token

		angular.forEach($scope.access_token, function(t, i){
			JsDatabase.deleteToken(t).then(function(){
				console.log('token removed');
				// remove profile
				JsDatabase.getProfile().then(function(profile){
					if( profile ){
						JsDatabase.deleteProfile(profile);
					}
				}).catch(function(e){
					console.log(e);
				});

				// remove work
				JsDatabase.getWork().then(function(work){
					if( work.length > 0 ){
						angular.forEach(work, function(w,i){
							JsDatabase.deleteWork(w);
						});
					}
				}).catch(function(e){
					console.log(e);
				});

				// remove education
				JsDatabase.getEducation().then(function(education){
					if( education.length > 0 ){
						angular.forEach(education, function(e,i){
							JsDatabase.deleteEducation(e);
						});
					}
				}).catch(function(e){
					console.log(e);
				});

				// remove skill
				JsDatabase.getSkill().then(function(skill){
					if( skill.length ){
						angular.forEach(skill, function(s,i){
							JsDatabase.deleteSkill(s);
						});
					}
				}).catch(function(e){
					console.log(e);
				});

				// remove language
				JsDatabase.getLanguage().then(function(language){
					if( language.length ){
						angular.forEach(language, function(l,i){
							JsDatabase.deleteLanguage(l);
						});
					}
				}).catch(function(e){
					console.log(e);
				});

				JobSearch.getBookmarks().then(function(bookmarks){
					angular.forEach(bookmarks, function(b,i){
						JobSearch.deleteBookmark(i, b._rev, t);
					});
				}).catch(function(e){
					console.log(e);
				});

				JsDatabase.deleteSettings().then(function(){
					console.log('settings deleted.');
					JobSearch.deleteAllJob().then(function(){
						console.log('jobs deleted');
						JobSearch.deleteAllBookmark().then(function(){
							console.log('bookmark deleted');
							JobSearch.deleteAllApplication().then(function(){
								console.log('application deleted.');
								$location.path('/login');
							}).catch(function(e){
								console.log(e);
							});
						}).catch(function(e){
							console.log(e);
						});
					}).catch(function(e){
						console.log(e);
					});
				}).catch(function(e){
					console.log(e);
				});
			}).catch(function(e){
				console.log(e);
			});
		});

		return false;
	}
});
