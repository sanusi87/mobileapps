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

	// JsDatabase.getToken().then(function(token){
	// 	console.log(token);
	// 	if( token.length > 0 ){
	//
	// 	}else{
	// 		$location.path('/login');
	// 	}
	// });
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
				id: id,
				dial_code: name.dial_code
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

		$scope.js.mobile_no = '(+'+$scope.selectedCountry.dial_code+')';
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

	/*
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
	*/

	// update profile submit
	$scope.updateForm = function(){
		var errors = [];

		if( $scope.js.mobile_no.length < 5 ){
			errors.push('Mobile number is required');
		}else{
			if( !/^\(\+/ig.test( $scope.js.mobile_no ) ){
				errors.push('Mobile number should be in this format (+A)B, where A is your country code and B is your mobile number.');
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
					url: 'http://api.jenjobs.com/jobseeker/profile',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					data: param,
					params: {'access-token': $scope.access_token}
				}).then(function(response){
					console.log(response);
					$ionicLoading.show({
						template: 'Your profile have successfully updated.',
						noBackdrop: true,
						duration: 1000
					});

					JsDatabase.updateCompleteness('profile', true);
				}).catch(function(e){
					console.log(e);
					$ionicLoading.show({
						template: 'Failed to update your profile.',
						noBackdrop: true,
						duration: 1000
					});
				});
			}).catch(function(e){
				console.log(e);
				$ionicLoading.show({
					template: 'Failed to update your profile.',
					noBackdrop: true,
					duration: 1000
				});
			});
		}
		return false;
	}
})

.controller('LoginCtrl', function($scope, $state, $location, $http, $ionicPopup, $ionicHistory, JsDatabase, JobSearch, JobseekerLogin){
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

	$scope.log = "";

	$scope.submit = function(){
		$scope.button.text = 'Login...';
		$scope.disableButton = true;

		JobseekerLogin.setUsername( $scope.user.username );
		JobseekerLogin.setPassword( $scope.user.password );

		JobseekerLogin.login(function(response){
			if( response.error ){
				$scope.button.text = 'Login';
				$scope.disableButton = false;
				var alertPopup = $ionicPopup.alert({
					title: 'Notification',
					template: response.error
				});
			}else{
				if( response.data && typeof( response.data.access_token ) != 'undefined' ){
					$scope.button.text = 'Downloading data...';

					JobseekerLogin.setAccessToken( response.data.access_token, function(){
						JobseekerLogin.downloadProfile(function(response){
							if( response.error ){
								$scope.log += "failed to download profile..."+angular.toJson(response.error);
							}else{
								// $scope.log += "profile downloaded...";
								delete(response.data._links);
								response.data.no_work_exp = response.data.no_work_exp == 0 ? false : true;

								var completedItems = [];

								JsDatabase.addProfile(response.data).then(function(){
									// $scope.log += "profile saved...";
									if( response.data.mobile_no && response.data.dob ){
										completedItems.push('profile');
									}

									if( response.data.resume_file && response.data.resume_file.length > 5 ){
										completedItems.push('attachment');
									}

									if( response.data.availability ){
										completedItems.push('jobseek');
									}

									JobseekerLogin.downloadApplication(function(response){
										if( response.error ){
											// got error
											$scope.log += "failed to download application..."+angular.toJson(response.error);
										}else{
											// $scope.log += "application downloaded...";
											if( response.data.length > 0 ){
												angular.forEach(response.data, function(value, i){
													// console.log(value);
													value._id = String(value.post_id);

													JobSearch.apply(value).then(function(doc){
														// console.log(doc);
													}).catch(function(err){
														// console.log(err);
													});
												});
											}

											// $scope.log += "download work exp...";
											JobseekerLogin.downloadWorkExperience(function(response){
												if( response.error ){
													// got error
													$scope.log += "failed to download work exp..."+angular.toJson(response.error);
												}else{
													// $scope.log += "work exp downloaded...";
													if( response.data.length > 0 ){
														angular.forEach(response.data, function(value, i){
															JsDatabase.addWork(value);
														});
														completedItems.push('workExp');
													}

													// $scope.log += "downloading qualification...";
													JobseekerLogin.downloadQualification(function(response){
														if( response.error ){
															// got error
															$scope.log += "failed to download qualification"+angular.toJson(response.error);
														}else{
															// $scope.log += "qualification downloaded.";
															if( response.data.length > 0 ){
																angular.forEach(response.data, function(value, i){
																	JsDatabase.addEducation(value);
																});
																completedItems.push('education');
															}

															// $scope.log += "downloading job preference...";
															JobseekerLogin.downloadJobPreference(function(response){
																if( response.error ){
																	// got error
																	$scope.log += "failed to download job preferences"+angular.toJson(response.error);
																}else{
																	// $scope.log += "job preference downloaded...";
																	JsDatabase.addSettings(response.data, 'jobPref');
																	if( response.data.salary && response.data.job_type_id.length > 0 ){
																		completedItems.push('jobPref');
																	}

																	// $scope.log += "downloading skills...";
																	JobseekerLogin.downloadSkill(function(response){
																		if( response.error ){
																			// got error
																			$scope.log += "failed to download skill..."+angular.toJson(response.error);
																		}else{
																			// $scope.log += "skills downloaded...";
																			if( response.data.length > 0 ){
																				angular.forEach(response.data, function(skill, i){
																					JsDatabase.addSkill(skill);
																				});
																			}

																			// $scope.log += "downloading language...";
																			JobseekerLogin.downloadLanguage(function(response){
																				if( response.error ){
																					// got error
																					$scope.log += "failed to download language..."+angular.toJson(response.error);
																				}else{
																					// $scope.log += "language downloaded...";
																					if( response.data.length > 0 ){
																						angular.forEach(response.data, function(lang, i){
																							JsDatabase.addLanguage(lang);
																						});
																						completedItems.push('language');
																					}

																					// $scope.log += "downloading bookmarks...";
																					JobseekerLogin.downloadBookmark(function(response){
																						if( response.error ){
																							// got error
																							$scope.log += "failed to download bookmark..."+angular.toJson(response.error);
																						}else{
																							$scope.log += "bookmarks downloaded...";
																							if( response.data.length > 0 ){
																								angular.forEach(response.data, function(bookmark, i){
																									JobSearch.bookmarkJob(bookmark);
																								});
																							}

																							if( completedItems.length > 0 ){
																								loopItem();

																								function loopItem(){
																									if( completedItems.length > 0 ){
																										updateCompleteness(completedItems[0]);
																									}else{
																										$scope.disableButton = false;
																										$scope.button.text = 'Login';

																										console.log('redirecting...');
																										// $state.go('tab.profile', {}, {reload: false});
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
																								$scope.button.text = 'Login';

																								console.log('redirecting...');
																								// $state.go('tab.profile', {}, {reload: false});
																								$location.path('/tab/profile');
																							}
																						}
																					});
																				}
																			});
																		}
																	});
																}
															});
														}
													});
												}
											});
										}
									});
								}).catch(function(err){
									$scope.log += "failed to save profile..."+angular.toJson(err);
								});
							}
						});
					});
					// save access token to database
					JsDatabase.addToken( response.data );

					JobseekerLogin.downloadParameter(function(response){
						if( response.error ){
							// got error
						}else{
							angular.forEach(response.data, function(value, i){
								JsDatabase.addParameter(value, i);
							});

							JobseekerLogin.downloadLocation(function(response){
								console.log(response);
								if( response.error ){
									// got error
								}else{
									angular.forEach(response.data, function(value, i){
										JsDatabase.addParameter(value, i);
									});
								}
							});
						}
					});
				}else{
					$scope.button.text = 'Login';
					var alertPopup = $ionicPopup.alert({
						title: 'Notification',
						template: 'Login failed! Access token not found.'
					});
				}
			}
		});
	}

	var enterEventFired = false;
	$scope.$on('$ionicView.enter', function(scopes, states) {
		// $scope.log = "ionicView.enter="+typeof(JsDatabase.getToken())+"...";
		runEnterEvent();
    });

	// setTimeout(function(){
	// 	console.log('time outted!');
	// 	$state.go($state.current, {}, {reload: true});
	// }, 1000);

	// trying to trigger enter event if not yet executed
	function runEnterEvent(){
		JsDatabase.getToken()
		.then(function(token){
			// $scope.log += "found token? "+token
			// if already got token, then redirect to profile
			if( token.length > 0 ){
				$ionicHistory.nextViewOptions({
					disableBack: true
				});
				enterEventFired = true;
				$location.path('/tab/profile');
			}
		}).catch(function(err){
			$scope.log = err;
		});
	}
})

.controller('RegisterCtrl', function( $scope, $http, $location, $ionicHistory, $ionicPopup, JsDatabase, JobseekerLogin ){
	$scope.js = {
		name: '',
		email: '',
		password: '',
		repeat_password: ''
	},
	$scope.button = {
		text: 'Register'
	}

	$scope.disableButton = false;

	$scope.submit = function(){
		$scope.disableButton = true;
		$scope.button.text = 'Registering...';
		$http({
			method: 'POST',
			url: 'http://api.jenjobs.com/register/jobseeker',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			data: $scope.js
		}).then(function(response){
			console.log(response);

			if( response.data.status_code == 1 ){
				$scope.button.text = 'Registration success.';

				// successful registration will return an access token, save them
				JsDatabase.addToken( response.data.token );
				JobseekerLogin.setAccessToken( response.data.token.access_token, function(){
					// then we use that access token to login the jobseeker into app.
					JobseekerLogin.downloadProfile(function(response){
						console.log(response);
						if( response.error ){
							// got error
						}else{
							delete(response.data._links);
							response.data.no_work_exp = response.data.no_work_exp == 0 ? false : true;
							JsDatabase.addProfile(response.data)
							.then(function(){
								// unlike most of the data doesnt need to be downloaded
								JobseekerLogin.downloadParameter(function(response){
									if( response.error ){
										// got error
									}else{
										angular.forEach(response.data, function(value, i){
											JsDatabase.addParameter(value, i);
										});

										JobseekerLogin.downloadLocation(function(response){
											$scope.disableButton = false;
											$scope.button.text = 'Register';

											console.log(response);
											if( response.error ){
												// got error
											}else{
												angular.forEach(response.data, function(value, i){
													JsDatabase.addParameter(value, i);
												});
												$location.path('/tab/profile');
											}
										});
									}
								});
							}).catch(function(err){
								console.log(err);
							});
						}
					});
				});
			}else{
				$scope.disableButton = false;
				$scope.button.text = 'Register';

				$ionicPopup.alert({
					title: 'Notification',
					template: response.data.error
				});
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
})

.controller('TabCtrl', function($scope, $state){
	$scope.go = function(args){
		$state.go(args, {}, {
	        reload: true,
	        inherit: false,
	        notify: true
	    });
	}
})

.controller('ForgotPasswordCtrl', function($scope, $http, $location, $ionicPopup){
	$scope.js = {
		email: ''
	};
	$scope.button = {
		text: 'Request Password Reset',
		disabled: false
	}

	$scope.submit = function(){
		$scope.button.disabled = true;
		$scope.button.text = 'Processing request...';

		$http({
			method: 'POST',
			url: 'http://api.jenjobs.com/forgot-password/jobseeker',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			data: $scope.js
		}).then(function(response){
			console.log(response);
			// reset form
			$scope.button.disabled = false;
			$scope.button.text = 'Request Password Reset';
			$scope.js.email = '';

			$ionicPopup.alert({
				title: 'Notification',
				template: response.data.status_text
			});
		});
	}

	$scope.go = function(path){
		$location.path(path);
	}
})

.controller('JobSearchCtrl', function($scope){

});
