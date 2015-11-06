angular.module('jenjobs.controllers', ['ionic'])

.controller('CheckProfileCtrl', function($scope, $location, $ionicHistory, JsDatabase){
	console.log('checking login status...');
	JsDatabase.getToken().then(function(token){
		console.log('access token ontained.');
		console.log(token);

		$ionicHistory.nextViewOptions({
			disableBack: true
		});

		if( token.length > 0 ){
			// $scope.access_token = token[0].access_token;
			$location.path('/tab/profile');
		}else{
			$location.path('/login');
		}
	}).catch(function(err){
		console.log('failed to get token...');
		console.log(err);
	});
})

.controller('ProfileCtrl', function($scope, $location, JsDatabase){
	$scope.js = {};
	$scope.isLoading = true;
	// $scope.access_token = null;

	$scope.$on('$ionicView.enter', function(scopes, states) {
		JsDatabase.getProfile().then(function(profile){
			$scope.js = profile;
			$scope.isLoading = false;
		});
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

.controller('LoginCtrl', function($scope, $state, $location, $http, $ionicPopup, $ionicHistory, JsDatabase, JobSearch, JobseekerLogin, $ionicPlatform){
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

	// $scope.log = "";

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
						$scope.button.text = 'Downloading profile...';
						JobseekerLogin.downloadProfile(function(response){
							if( response.error ){
								$scope.button.text = 'Downloading profile...error';
							}else{
								$scope.button.text = 'Downloading profile...done';
								delete(response.data._links);
								response.data.no_work_exp = response.data.no_work_exp == 0 ? false : true;
								var completedItems = [];

								$scope.button.text = 'Downloading profile...saved';
								JsDatabase.addProfile(response.data).then(function(){
									if( response.data.mobile_no && response.data.dob ){
										completedItems.push('profile');
									}

									if( response.data.resume_file && response.data.resume_file.length > 5 ){
										completedItems.push('attachment');
									}

									if( response.data.availability ){
										completedItems.push('jobseek');
									}

									$scope.button.text = 'Downloading application...';
									JobseekerLogin.downloadApplication(function(response){
										if( response.error ){
											$scope.button.text = 'Downloading application...error';
										}else{
											$scope.button.text = 'Downloading application...done';
											if( response.data.length > 0 ){
												angular.forEach(response.data, function(value, i){
													value._id = String(value.post_id);

													JobSearch.apply(value).then(function(doc){
														// console.log(doc);
													}).catch(function(err){
														// console.log(err);
													});
												});
											}

											$scope.button.text = 'Downloading work exp...';
											JobseekerLogin.downloadWorkExperience(function(response){
												if( response.error ){
													$scope.button.text = 'Downloading work exp...error';
												}else{
													$scope.button.text = 'Downloading work exp...done';
													if( response.data.length > 0 ){
														angular.forEach(response.data, function(value, i){
															JsDatabase.addWork(value);
														});
														completedItems.push('workExp');
													}

													$scope.button.text = 'Downloading edu...';
													JobseekerLogin.downloadQualification(function(response){
														if( response.error ){
															$scope.button.text = 'Downloading edu...error';
														}else{
															$scope.button.text = 'Downloading edu...done';
															if( response.data.length > 0 ){
																angular.forEach(response.data, function(value, i){
																	JsDatabase.addEducation(value);
																});
																completedItems.push('education');
															}

															$scope.button.text = 'Downloading job pref...';
															JobseekerLogin.downloadJobPreference(function(response){
																if( response.error ){
																	$scope.button.text = 'Downloading job pref...error';
																}else{
																	$scope.button.text = 'Downloading job pref...done';
																	JsDatabase.addSettings(response.data, 'jobPref');
																	if( response.data.salary && response.data.job_type_id.length > 0 ){
																		completedItems.push('jobPref');
																	}

																	$scope.button.text = 'Downloading skill...';
																	JobseekerLogin.downloadSkill(function(response){
																		if( response.error ){
																			$scope.button.text = 'Downloading skill...error';
																		}else{
																			$scope.button.text = 'Downloading skill...done';
																			if( response.data.length > 0 ){
																				angular.forEach(response.data, function(skill, i){
																					JsDatabase.addSkill(skill);
																				});
																			}

																			$scope.button.text = 'Downloading language...';
																			JobseekerLogin.downloadLanguage(function(response){
																				if( response.error ){
																					$scope.button.text = 'Downloading language...error';
																				}else{
																					$scope.button.text = 'Downloading language...done';
																					if( response.data.length > 0 ){
																						angular.forEach(response.data, function(lang, i){
																							JsDatabase.addLanguage(lang);
																						});
																						completedItems.push('language');
																					}

																					$scope.button.text = 'Downloading bookmark...';
																					JobseekerLogin.downloadBookmark(function(response){
																						if( response.error ){
																							$scope.button.text = 'Downloading bookmark...error';
																						}else{
																							$scope.button.text = 'Downloading bookmark...done';
																							$scope.button.text = 'Downloading subscription...';
																							JobseekerLogin.downloadSubscription(function(response){
																								$scope.button.text = 'Downloading subscription...done';
																								angular.forEach(response.data, function(subscr,i){
																									var settingName = '';
																									if( subscr.subscription_id == 1 ){
																										settingName = 'newsletter_alert';
																									}else if( subscr.subscription_id == 2 ){
																										settingName = 'promotion_alert';
																									}else if( subscr.subscription_id == 3 ){
																										settingName = 'sms_job_alert';
																									}

																									JsDatabase.getSettings(settingName)
																									.then(function(settingValue){
																										settingValue.value = subscr.subscription_id ? 1 : 0;
																										JsDatabase.updateSettings(settingValue)
																										.then(function(updateStatus){
																											console.log(updateStatus);
																										}).catch(function(err){
																											console.log(err);
																										});
																									}).catch(function(err){
																										console.log(err);
																									});
																								});
																							});
																							// end updating subscription

																							// $scope.log += "bookmarks downloaded...";
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
																										$scope.button.text = 'Redirecting...';
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
																								$scope.button.text = 'Redirecting...';
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
									// $scope.log += "failed to save profile..."+angular.toJson(err);
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
	// $scope.$on('$ionicView.enter', function(scopes, states) {
		// $scope.log = "ionicView.enter="+typeof(JsDatabase.getToken())+"...";
		// runEnterEvent();
    // });

	$ionicPlatform.ready(function(){
		runEnterEvent();
	});

	// setTimeout(function(){
	// 	console.log('time outted!');
	// 	$state.go($state.current, {}, {reload: true});
	// }, 1000);

	// trying to trigger enter event if not yet executed
	function runEnterEvent(){
		JsDatabase.getToken().then(function(token){
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
			// $scope.log = err;
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

.controller('AccountCtrl', function($scope, $location, $ionicLoading, JsDatabase, JobSearch, Sync) {
	$scope.access_token = null;
	$scope.parameter = {
		notification: false,
		smsSubscription: false,
		newsletterSubscription: false,
		promotionSubscription: false
	};

	var tmp_newsletter_alert,
	tmp_promotion_alert,
	tmp_sms_job_alert,
	tmp_notification;

	JsDatabase.getToken().then(function(token){
		if(token.length > 0){
			$scope.access_token = token;
			Sync.setToken(token[0].access_token);
		}else{
			$location.path('/login');
		}
	}).catch(function(){
		$location.path('/login');
	});

	JsDatabase.getSettings('newsletter_alert').then(function(newsletter_alert){
		$scope.parameter.newsletterSubscription = newsletter_alert.value == 1 ? true : false;
		tmp_newsletter_alert = newsletter_alert;
	});

	JsDatabase.getSettings('promotion_alert').then(function(promotion_alert){
		$scope.parameter.promotionSubscription = promotion_alert.value == 1 ? true : false;
		tmp_promotion_alert = promotion_alert;
	});

	JsDatabase.getSettings('sms_job_alert').then(function(sms_job_alert){
		$scope.parameter.smsSubscription = sms_job_alert.value == 1 ? true : false;
		tmp_sms_job_alert = sms_job_alert;
	});

	JsDatabase.getSettings('notification_alert').then(function(notification){
		$scope.parameter.notification = notification.value == 1 ? true : false;
		tmp_notification = notification;
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

	$scope.toggleNotification = function(){
		//console.log($scope.parameter.notification);
		tmp_notification.value = $scope.parameter.notification ? 1 : 0;
		JsDatabase.updateSettings(tmp_notification).then(function(updateStatus){
			console.log(updateStatus);
			tmp_notification._rev = updateStatus.rev;

			// update server

		});
	}

	$scope.toggleSmsSubscription = function(){
		//console.log($scope.parameter.smsSubscription);
		tmp_sms_job_alert.value = $scope.parameter.smsSubscription ? 1 : 0;
		JsDatabase.updateSettings(tmp_sms_job_alert).then(function(updateStatus){
			tmp_sms_job_alert._rev = updateStatus.rev;

			// update server
			Sync.updateSubscription(3, $scope.parameter.smsSubscription, function(response){
				if( response.error ){
					$ionicLoading.show({
						template: response.error,
						noBackdrop: true,
						duration: 1000
					});
				}else{
					$ionicLoading.show({
						template: response.data.status_text,
						noBackdrop: true,
						duration: 1000
					});
				}
			});
		});
	}

	$scope.toggleNewsletterSubscription = function(){
		// console.log($scope.parameter.newsletterSubscription);
		tmp_newsletter_alert.value = $scope.parameter.newsletterSubscription ? 1 : 0;
		JsDatabase.updateSettings(tmp_newsletter_alert).then(function(updateStatus){
			console.log(updateStatus);
			tmp_newsletter_alert._rev = updateStatus.rev;

			// update server
			Sync.updateSubscription(1, $scope.parameter.newsletterSubscription, function(response){
				if( response.error ){
					$ionicLoading.show({
						template: response.error,
						noBackdrop: true,
						duration: 1000
					});
				}else{
					$ionicLoading.show({
						template: response.data.status_text,
						noBackdrop: true,
						duration: 1000
					});
				}
			});
		});
	}

	$scope.togglePromotionSubscription = function(){
		// console.log($scope.parameter.promotionSubscription);
		tmp_promotion_alert.value = $scope.parameter.promotionSubscription ? 1 : 0;
		JsDatabase.updateSettings(tmp_promotion_alert).then(function(updateStatus){
			console.log(updateStatus);
			tmp_promotion_alert._rev = updateStatus.rev;

			// update server
			Sync.updateSubscription(2, $scope.parameter.promotionSubscription, function(response){
				if( response.error ){
					$ionicLoading.show({
						template: response.error,
						noBackdrop: true,
						duration: 1000
					});
				}else{
					$ionicLoading.show({
						template: response.data.status_text,
						noBackdrop: true,
						duration: 1000
					});
				}
			});
		});
	}

	$scope.exitApp = function(){
		ionic.Platform.exitApp();
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

.controller('TestCtrl', function($scope, $filter){
	// how to format a date using $filter
	$scope.date = $filter('date')(new Date(), 'yyyy-MM-dd');
});
