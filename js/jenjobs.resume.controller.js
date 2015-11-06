angular.module('jenjobs.resume', [])
.controller('ResumeCtrl', function($scope, $http, $state, $location, $ionicPopup, $ionicLoading, $ionicModal, $ionicHistory, JsDatabase){
	$scope.countries = [];
	$scope.states = [];
	$scope.info = {value: ''};

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

	JsDatabase.getParameter('jobseekingStatus').then(function(statuses){
		delete(statuses._id);
		delete(statuses._rev);
		$scope.jobseekingStatus = statuses;
	});

	$scope.$on('$ionicView.enter', function(scopes, states) {
		// job seeking status
		JsDatabase.getProfile().then(function(profile){
			$scope.js = profile;
			$scope.jsJobseekingStatus = profile.js_jobseek_status_id;
			$scope.availability = profile.availability;
			$scope.selectedavailabilityUnit = {};

			if(profile.availability_unit == 'D'){
				$scope.selectedavailabilityUnit.name = 'Day(s)';
			}else if(profile.availability_unit == 'W'){
				$scope.selectedavailabilityUnit.name = 'Week(s)';
			}else if(profile.availability_unit == 'M'){
				$scope.selectedavailabilityUnit.name = 'Month(s)';
			}
		}).then(function(){
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
				JsDatabase.getParameter('states').then(function(states){
					delete(states._id);
					delete(states._rev);

					angular.forEach(states, function(name, id){
						$scope.states.push({
							name: name.name,
							id: id
						});
					});

					return;
				}).then(function(){
					// mapping
					var currentlyStayIn = '';
					if( $scope.js.address ){
						var cn = {};
						$scope.countries.map(function(c){
							cn[c.id] = c.name;
						});

						if( $scope.js.address.country_id ){
							currentlyStayIn += cn[$scope.js.address.country_id];
						}

						if( $scope.js.address.state_id ){
							var st = {};
							$scope.states.map(function(s){
								st[s.id] = s.name;
							});
							currentlyStayIn += ' > '+st[$scope.js.address.state_id];
						}else{
							if( $scope.js.address.state_name ){
								currentlyStayIn += ' > '+$scope.js.address.state_name;
							}
						}

						if( $scope.city_name ){
							currentlyStayIn += ' > '+$scope.js.address.city_name;
						}
					}
					$scope.currentlyStayIn = currentlyStayIn;
					// mapping
				});
			});
		});
		// job seeking status

		// job preference
		JsDatabase.getParameter('currency').then(function(currencies){
			delete(currencies._id);
			delete(currencies._rev);
			JsDatabase.getSettings('jobPref').then(function(jobPref){
				$scope.jobPref = jobPref;
				$scope.currency = currencies[jobPref.currency_id];

				if( jobPref.state_id && jobPref.state_id.length > 0 ){
					JsDatabase.getParameter('states').then(function(states){
						var prefStates = [];
						angular.forEach(jobPref.state_id, function(e,i){
							prefStates.push(states[e].name);
						});
						return prefStates;
					}).then(function(prefStates){
						$scope.prefStates = prefStates.join(', ');
					});
				}

				if( jobPref.country_id && jobPref.country_id.length > 0 ){
					JsDatabase.getParameter('countries').then(function(countries){
						delete(countries._id);
						delete(countries._rev);
						delete(countries[127]);

						var prefCountries = [];
						angular.forEach(jobPref.country_id, function(e,i){
							prefCountries.push( countries[e] );
						});
						return prefCountries;
					}).then(function(prefCountries){
						$scope.prefCountries = prefCountries.join(', ');
					});
				}

				if( jobPref.job_type_id && jobPref.job_type_id.length > 0 ){
					JsDatabase.getParameter('jobType').then(function(jobTypes){
						var prefJobTypes = [];
						angular.forEach(jobPref.job_type_id, function(e,i){
							prefJobTypes.push( jobTypes[e] );
						});
						return prefJobTypes;
					}).then(function(prefJobTypes){
						$scope.prefJobTypes = prefJobTypes.join(', ');
					});
				}
			});
		});
		// job preference
	});

	// work
	JsDatabase.getWork().then(function(works){
		$scope.works = works;
	});

	$scope.removeWork = function( work ){
		var confirmPopup = $ionicPopup.confirm({
			title: 'Confirmation',
			template: 'Remove this work experience?'
		});

		confirmPopup.then(function(res) {
			if(res) {
				JsDatabase.deleteWork( work ).then(function(){
					if( work.id ){
						$http({
							method: 'DELETE',
							url: 'http://api.jenjobs.com/jobseeker/work-experience/'+work.id+'?access-token='+$scope.access_token,
							headers: {
								'Accept': 'application/json',
								'Content-Type': 'application/json'
							},
							data: ''
						}).then(function(response){
							$ionicLoading.show({
								template: response.data.status_text,
								noBackdrop: true,
								duration: 1000
							});

							setTimeout(function(){
								if( $scope.works.length == 0 ){
									JsDatabase.updateCompleteness('workExp', false);
								}
							}, 1600);
						}).catch(function(e){
							$ionicLoading.show({
								template: 'Data synchronization failed!',
								noBackdrop: true,
								duration: 1000
							});
						});
					}else{
						$ionicLoading.show({
							template: 'Your work experience was successfully deleted.',
							noBackdrop: true,
							duration: 1000
						});

						setTimeout(function(){
							if( $scope.works.length == 0 ){
								JsDatabase.updateCompleteness('workExp', false);
							}
						}, 1600);
					}
				});
			}
		});
		return false;
	}

	$scope.answerWorkExp = function(ans){
		// have work exp?
		if( !ans ){ //no
			// work exp is complete
			JsDatabase.updateCompleteness('workExp', true);
			$scope.js.no_work_exp = true;
			JsDatabase.updateProfile($scope.js).then(function(){
				$http({
					method: 'POST',
					url: 'http://api.jenjobs.com/jobseeker/do-you-have-work-exp',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					params: {'access-token': $scope.access_token},
					data: {status:1}
				}).then(function(response){
					console.log(response);
				});
			});
		}else{ //yes
			//navigate to add work exp
			$state.go('tab.resume-update-selected-work-experience', {}, {
		        reload: true,
		        inherit: false,
		        notify: true
		    });
		}
	}
	// work

	// education
	JsDatabase.getEducation().then(function(educations){
		$scope.educations = educations;
	}).then(function(){
		JsDatabase.getParameter('educationLevel').then(function(educationLevel){
			$scope.educationLevel = educationLevel;
			// console.log(educationLevel);
		});

		JsDatabase.getParameter('educationField').then(function(educationField){
			$scope.educationField = educationField;
		});
	});

	$scope.removeEdu = function( school ){
		var confirmPopup = $ionicPopup.confirm({
			title: 'Confirmation',
			template: 'Remove this education record?'
		});

		confirmPopup.then(function(res) {
			if(res){
				var status = JsDatabase.deleteEducation( school )
				.then(function(stat){
					if( school.id ){
						$http({
							method: 'DELETE',
							url: 'http://api.jenjobs.com/jobseeker/qualification/'+school.id+'?access-token='+$scope.access_token,
							headers: {
								'Accept': 'application/json',
								'Content-Type': 'application/json'
							},
							data: ''
						}).then(function(response){
							$ionicLoading.show({
								template: response.data.status_text,
								noBackdrop: true,
								duration: 1500
							});

							setTimeout(function(){
								if( $scope.educations.length == 0 ){
									JsDatabase.updateCompleteness('education', false);
								}
							}, 1600);
						}).catch(function(e){
							$ionicLoading.show({
								template: 'Data synchronization failed!',
								noBackdrop: true,
								duration: 1500
							});
						});
					}else{
						$ionicLoading.show({
							template: 'Your education record was successfully deleted.',
							noBackdrop: true,
							duration: 1500
						});

						setTimeout(function(){
							if( $scope.educations.length == 0 ){
								JsDatabase.updateCompleteness('education', false);
							}
						}, 1600);
					}
				});
			}
		});
	}
	// education

	// skill
	$ionicModal.fromTemplateUrl('templates/modal/add-skill-input.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.skillInput = modal;
	});

	JsDatabase.getSkill().then(function(skills){
		$scope.skills = skills;
	});

	$scope.addNewSkillModal = function(){
		$scope.skillInput.show();
	}

	$scope.closeModal = function(){
		$scope.skillInput.hide();
	}

	$scope.skill = {};
	var i = 0;
	$scope.saveAndCloseModal = function(){
		JsDatabase.addSkill( $scope.skill ).then(function(a){
			var param = {};
			param.skill = $scope.skill.value;

			$http({
				method: 'POST',
				url: 'http://api.jenjobs.com/jobseeker/skill?access-token='+$scope.access_token,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				data: param
			}).then(function(response){
				// console.log(response);
				JsDatabase.getSkillById( a.id ).then(function(skill){
					// console.log(skill);
					skill.id = response.data.id;
					JsDatabase.updateSkill( skill );
				});
			});
			$scope.closeModal();
		});
	}

	$scope.removeSkill = function(skill){
		var confirmPopup = $ionicPopup.confirm({
			title: 'Confirmation',
			template: 'Remove this skill record?'
		});

		confirmPopup.then(function(res) {
			if(res){
				JsDatabase.deleteSkill(skill).then(function(){
					// if got ID, then remove from webserver also
					if( skill.id ){
						var param = {};

						$http({
							method: 'DELETE',
							url: 'http://api.jenjobs.com/jobseeker/skill/'+skill.id+'?access-token='+$scope.access_token,
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
							$ionicLoading.show({
								template: 'Data synchronization failed!',
								noBackdrop: true,
								duration: 1500
							});
						});
					}else{
						$ionicLoading.show({
							template: 'Your skill was successfully deleted.',
							noBackdrop: true,
							duration: 1500
						});
					}
				});
			}
		});
	}
	// skill

	// language
	$ionicModal.fromTemplateUrl('templates/modal/attach-language-modal.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.languageModal = modal;
	});

	$scope.languageList = {}; // a list of available language
	$scope.savedLanguage = {}; // language which have been saved

	$scope.selectedLanguage;
	$scope.selectedSpokenLevel;
	$scope.selectedWrittenLevel;
	$scope.selectedNative;

	// $scope.$on('modal.shown', function(a, b) {
		// console.log($scope.selectedSpokenLevel);
	// });

	JsDatabase.getLanguage().then(function(languages){
		angular.forEach(languages, function(e,i){
			$scope.savedLanguage[e.language_id] = e;
		});
	});

	JsDatabase.getParameter('language').then(function(language){
		delete(language._id);
		delete(language._rev);
		angular.forEach(language, function(e,i){
			$scope.languageList[i] = {
				name: e,
				id: i
			};
		});
		return;
	}).then(function(){
		$scope.languageLevelList = [];
		$scope.native = [{id:'Yes', name: 'Yes'}, {id: 'No', name: 'No'}];
	});

	$scope.addNewLanguageModal = function(lang, level, native){
		if( lang && level ){

		}else{
			delete($scope.selectedLanguage);
			delete($scope.selectedSpokenLevel);
			delete($scope.selectedWrittenLevel);
			$scope.selectedNative = {id:'No'};
		}
		$scope.languageModal.show();
	}

	$scope.closeLanguageModal = function(){
		$scope.languageModal.hide();
	}

	// update which language is selected.
	$scope.updateLanguageChange = function(){ $scope.selectedLanguage = this.selectedLanguage; }
	// update which spoken level is selected
	$scope.updateSelectedSpokenLevel = function(){ $scope.selectedSpokenLevel = this.selectedSpokenLevel; }
	// update which written level is selected
	$scope.updateSelectedWrittenLevel = function(){ $scope.selectedWrittenLevel = this.selectedWrittenLevel; }
	// update is native
	$scope.updateSelectedNative = function(){
		$scope.selectedNative = this.selectedNative;
		console.log($scope.selectedNative);
	}

	$scope.saveLanguage = function(){
		var error = [];
		if( $scope.selectedWrittenLevel.id == 1 && $scope.selectedSpokenLevel.id == 1 ){
			error.push('Please set at least one of the proficiencies');
		}

		if( error.length > 0 ){
			$ionicLoading.show({
				template: error.join('. '),
				noBackdrop: true,
				duration: 1000
			});
		}else{
			var param = {
				language_id: $scope.selectedLanguage.id,
				spoken_language_level_id: $scope.selectedSpokenLevel.id,
				written_language_level_id: $scope.selectedWrittenLevel.id,
				native: $scope.selectedNative.id == 'Yes' ? true : false
			};

			JsDatabase.addLanguage(param).then(function(a){
				param._id = a.id;
				param._rev = a.rev;

				// add a new language into the list
				$scope.savedLanguage[param.language_id] = param;

				// mark this section as complete
				JsDatabase.updateCompleteness('language', true);

				// if native is set(Yes), then unset(No) for all other native value
				if(param.native){
					JsDatabase.getLanguage().then(function(languages){
						angular.forEach(languages, function(e,i){
							if( e.language_id != param.language_id ){
								e.native = false;
								JsDatabase.updateLanguage(e);
							}
						});
					});
				}

				// then try to post to web server
				$http({
					method: 'POST',
					url: 'http://api.jenjobs.com/jobseeker/language?access-token='+$scope.access_token,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					data: param
				}).then(function(response){
					if( response.data.status_code == 1 ){
						$ionicLoading.show({
							template: response.data.status_text,
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
				}).catch(function(e){
					console.log('error');
					console.log(e)
				});
				$scope.closeModal();
			}).catch(function(e){
				$ionicLoading.show({
					template: 'Error occur while saving laguages.',
					noBackdrop: true,
					duration: 1000
				});
			});
		}
	}

	$scope.removeLanguage = function(language){
		JsDatabase.deleteLanguage(language).then(function(){
			$ionicLoading.show({
				template: 'The language was successfully deleted.',
				noBackdrop: true,
				duration: 1000
			});

			var param = {
				'access-token': $scope.access_token
			};

			$http({
				method: 'DELETE',
				url: 'http://api.jenjobs.com/jobseeker/language/'+language.language_id,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				data: {},
				params: param
			}).then(function(response){
				console.log(response);
			});

			// remove from the list
			delete( $scope.savedLanguage[language.language_id] );

			// mark the section as incomplete if there is no
			if( Object.keys($scope.savedLanguage).length == 0 ){
				JsDatabase.updateCompleteness('language', false);
			}
		}).catch(function(){
			$ionicLoading.show({
				template: 'Failed to delete the language!',
				noBackdrop: true,
				duration: 1000
			});
		});
	}
	// language

	// attached resume
	$scope.tmpResumeAttachment;
	$ionicModal.fromTemplateUrl('templates/modal/attach-resume-input.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.resumeInput = modal;
	});

	$scope.openResumeUploadModal = function(){
		$scope.resumeInput.show();
	}

	$scope.closeResumeModal = function(){
		$scope.resumeInput.hide();
	}

	var tempResume = {};
	JsDatabase.getSettings('attachedResume').then(function(attachedResume){
		tempResume = attachedResume;
		$scope.attachedResume = attachedResume.value;
	}).catch(function(err){
		tempResume.value = 0;
		JsDatabase.addSettings(tempResume, 'attachedResume').then(function(a){
			tempResume._id = a.id;
			tempResume._rev = a.rev;
		});
	});

	$scope.saveAndCloseResumeModal = function(){
		// $scope.closeResumeModal();
		console.log( $scope.tmpResumeAttachment );

		var param = {
			'attachment': $scope.tmpResumeAttachment,
			'name': $scope.attachedResume
		};
		$http({
			method: 'POST',
			url: 'http://api.jenjobs.com/jobseeker/attachment?access-token='+$scope.access_token,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			data: param
		}).then(function(response){
			$scope.attachedResume = response.data.resume;
			tempResume.value = response.data.resume;
			JsDatabase.updateSettings(tempResume);

			$ionicLoading.show({
				template: response.data.status_text,
				noBackdrop: true,
				duration: 1500
			});

			setTimeout(function(){
				$scope.closeResumeModal();
			}, 2000);
		});
	}

	$scope.file_changed = function(element) {
		var resumefile = element.files[0],
		reader = new FileReader();

		$scope.attachedResume = resumefile.name;
		reader.onloadend = function(e) {
			$scope.tmpResumeAttachment = e.target.result;
		};
		reader.readAsDataURL(resumefile);
	}
	// attached resume

	// additional info
	$ionicModal.fromTemplateUrl('templates/modal/additional-info.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.additionalInfoInput = modal;
	});

	$scope.additionalInfo = {value:null};
	$scope.saveAdditionalInfo = function(){
		// console.log($scope.additionalInfo);
		JsDatabase.updateSettings($scope.additionalInfo).then(function(a){
			$scope.additionalInfo._rev = a.rev;

			var param = {info: $scope.additionalInfo.value};

			$http({
				method: 'POST',
				url: 'http://api.jenjobs.com/jobseeker/additional-info?access-token='+$scope.access_token,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				data: param
			}).then(function(response){
				$ionicLoading.show({
					template: response.data.status_text,
					noBackdrop: true,
					duration: 1000
				});

				setTimeout(function(){
					$scope.closeInfoModal();
				}, 2000);
			});
		});
	}

	JsDatabase.getSettings('info').then(function(info){
		$scope.additionalInfo = info;
	}).catch(function(e){
		JsDatabase.addSettings($scope.additionalInfo, 'info').then(function(a){
			$scope.additionalInfo._id = a.id;
			$scope.additionalInfo._rev = a.rev;
		});
	});

	$scope.openAdditionalInfoModal = function(){
		$scope.additionalInfoInput.show();
	}

	$scope.closeInfoModal = function(){
		$scope.additionalInfoInput.hide();
	}
	// additional info

	$scope.go = function(path){
		$ionicHistory.nextViewOptions({
			disableBack: true
		});
		$location.path(path);
	}
})

.controller('JobPrefCtrl', function($scope, $http, $location, $ionicModal, $ionicHistory, $ionicLoading, JsDatabase){
	$scope.access_token = null;
	$scope.tempPref = {};

	$scope.selectedJobType = [];
	$scope.tmpSelectedJobType = [];

	$scope.states = [];
	$scope.selectedState = [];
	$scope.checkedState = [];

	$scope.selectedCountry = [];
	$scope.countries = [];

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

	JsDatabase.getParameter('countries').then(function(countries){
		delete(countries._id);
		delete(countries._rev);
		delete(countries[127]);
		$scope.tempCountries = countries;
		angular.forEach(countries, function(name, id){
			$scope.countries.push({
				name: name.name,
				id: id
			});
		});

		$ionicModal.fromTemplateUrl('templates/modal/countries.html', {
			scope: $scope,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.countryModal = modal;
		});

		return;
	}).then(function(){
		JsDatabase.getParameter('states').then(function(states){
			delete(states._id);
			delete(states._rev);

			// we set the plain object({4:johor,5:xxx}) to tempStates
			$scope.tempStates = states;
			angular.forEach(states, function(name, id){
				// the we set the updated object({name:johor,id:4}...) to states
				$scope.states.push({name: name.name, id: id});
			});
			return;
		})
	});

	$scope.$on('$ionicView.enter', function(scopes, states){
		JsDatabase.getSettings('jobPref').then(function(jp){
			if( jp.salary ){
				$scope.expectedSalary = jp.salary;
			}

			if( jp.currency_id ){
				$scope.selectedCurrency = {
					id: jp.currency_id
				};
			}

			if( jp.job_type_id && jp.job_type_id.length > 0 ){
				angular.forEach(jp.job_type_id, function(e, i){
					$scope.selectedJobType[e] = e;
					$scope.tmpSelectedJobType.push(e);
				});
			}

			if( jp.state_id && jp.state_id.length > 0 ){
				angular.forEach(jp.state_id, function(e, i){
					$scope.selectedState[e] = true;
					$scope.checkedState.push(e);
				});
			}

			if( jp.country_id && jp.country_id.length > 0 ){
				angular.forEach(jp.country_id, function(e, i){
					$scope.selectedCountry[e] = true;
				});
			}
		});

		JsDatabase.getSettings('jobPref').then(function(jobPref){
			$scope.tempPref = jobPref;
		}).catch(function(e){
			JsDatabase.addSettings($scope.tempPref, 'jobPref').then(function(a){
				$scope.tempPref._id = a.id;
				$scope.tempPref._rev = a.rev;
			});
		});

		JsDatabase.getParameter('jobType').then(function(jobTypes){
			delete(jobTypes._id);
			delete(jobTypes._rev);
			$scope.jobTypes = jobTypes;
		});

		JsDatabase.getParameter('currency').then(function(currencies){
			delete(currencies._id);
			delete(currencies._rev);

			$scope.currencies = [];
			angular.forEach(currencies, function(e,i){
				$scope.currencies.push({id: i,name: e});
			});
		});
	});


	$ionicModal.fromTemplateUrl('templates/modal/states.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.stateModal = modal;
	});

	$scope.openStateModal = function(){
		$scope.stateModal.show();
	}

	$scope.openCountryModal = function(){
		$scope.countryModal.show();
	}

	$scope.closeCountryModal = function(){
		$scope.countryModal.hide();
	}

	$scope.closeStateModal = function(){
		$scope.stateModal.hide();
	}

	$scope.checkTotalStateSelected = function(){
		if( $scope.selectedState.length > 0 ){
			angular.forEach($scope.selectedState, function(e,i){
				if( !e ){
					delete($scope.selectedState[i]);
					$scope.checkedState.splice( $scope.checkedState.indexOf(i), 1 );
				}else{
					if( $scope.checkedState.indexOf(i) == -1 ){
						$scope.checkedState.push(i);
					}
				}
			});
		}
	}

	$scope.saveJobPref = function(form){
		// if everything is ok, then only can save
		var canSave = true;
		if( !form.$valid ){ canSave = canSave && false; }
		if( !$scope.expectedSalary ){ canSave = canSave && false; }
		if( $scope.selectedState.length == 0 ){ canSave = canSave && true; }

		var param = {};
		param.salary = $scope.expectedSalary;
		if( $scope.selectedCurrency && $scope.selectedCurrency.id ){
			param.currency_id = $scope.selectedCurrency.id;
		}else{
			param.currency_id = 6;
		}

		param.job_type_id = $scope.tmpSelectedJobType;

		param.state_id = [];
		if( $scope.selectedState.length > 0 ){
			angular.forEach($scope.selectedState, function(e,i){
				if( e ){
					param.state_id.push( i );
				}
			});
		}

		param.country_id = [];
		if( $scope.selectedCountry.length > 0 ){
			angular.forEach($scope.selectedCountry, function(e,i){
				if( e ){
					param.country_id.push( i );
				}
			});
		}

		console.log(param);

		param._id = $scope.tempPref._id;
		param._rev = $scope.tempPref._rev;

		JsDatabase.updateSettings(param).then(function(a){
			$scope.tempPref._id = a.id;
			$scope.tempPref._rev = a.rev;

			$http({
				method: 'POST',
				url: 'http://api.jenjobs.com/jobseeker/job-preference',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				data: param,
				params: {'access-token': $scope.access_token}
			}).then(function(response){
				console.log(response);
				$ionicLoading.show({
					template: response.data.status_text,
					noBackdrop: true,
					duration: 1500
				});
			});
		});
		return false;
	}

	$scope.checkValue = function(){
		if( !$scope.selectedJobType[this.id] ){
			$scope.tmpSelectedJobType.splice( $scope.tmpSelectedJobType.indexOf(this.id), 1 );
		}else{
			$scope.tmpSelectedJobType.push(this.id);
		}
	}

	$scope.go = function(path){
		$ionicHistory.nextViewOptions({
			disableBack: true
		});
		$location.path(path);
	}
})

.controller('AccessLevelCtrl', function($scope, $http, $location, $ionicLoading, $ionicHistory, JsDatabase){
	$scope.access_token = null;
	JsDatabase.getToken().then(function(token){
		if( token.length > 0 ){
			$scope.access_token = token[0].access_token;
		}else{
			$ionicLoading.show({
				template: 'Failed to get access token!',
				noBackdrop: true,
				duration: 2000
			});
		}

		JsDatabase.getProfile().then(function(profile){
			$scope.js = profile;
		});
	});

	$scope.saveAccessLevel = function(form){
		if( form.$valid ){
			console.log($scope.js.access);
			var stat = JsDatabase.updateProfile($scope.js)
			.then(function(){
				var url = 'http://api.jenjobs.com/jobseeker/access-level?access-token='+$scope.access_token;
				var param = {
					access: $scope.js.access
				};
				$http({
					method: 'POST',
					url: url,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					data: param
				}).then(function(response){
					console.log(response);

					$ionicLoading.show({
						template: 'Resume access level updated.',
						noBackdrop: true,
						duration: 2000
					});
				});
			}).catch(function(e){
				console.log(e);
				$ionicLoading.show({
					template: e.message,
					noBackdrop: true,
					duration: 2000
				});
			});
		}
	}

	$scope.go = function(path){
		$ionicHistory.nextViewOptions({
			disableBack: true
		});
		$location.path(path);
	}
})

.controller('JobseekStatusCtrl', function($scope, $http, $ionicHistory, $location, $ionicLoading, JsDatabase){
	$scope.access_token = null;
	$scope.city = null;

	// countries
	var tempStates = [];
	$scope.countries = [];
	$scope.states = [];
	// $scope.cities = [];

	$scope.selectedCountry = {};
	$scope.selectedState = {};
	// $scope.selectedCity = {};

	JsDatabase.getToken().then(function(token){
		if( token.length > 0 ){
			$scope.access_token = token[0].access_token;
		}else{
			$ionicLoading.show({
				template: 'Failed to get access token!',
				noBackdrop: true,
				duration: 2000
			});
		}

		JsDatabase.getProfile().then(function(profile){
			$scope.js = profile;

			$scope.jsJobseekingStatus = profile.js_jobseek_status_id;
			console.log(profile.js_jobseek_status_id);
			$scope.availability = profile.availability == -1 ? 0 : profile.availability;
			$scope.selectedavailabilityUnit = {
				id: profile.availability_unit
			};

			$scope.drivingLicense = profile.driving_license;
			$scope.ownTransport = profile.transport;

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
				// states
				JsDatabase.getParameter('states').then(function(states){
					delete(states._id);
					delete(states._rev);

					tempStates = states;
					angular.forEach(states, function(name, id){
						$scope.states.push({
							name: name.name,
							id: id
						});
					});

					return;
				}).then(function(){
					if( $scope.js.address ){
						$scope.selectedCountry = {
							id: $scope.js.address.country_id,
							// name: 'xxx'
						};

						$scope.selectedState = {
							id: $scope.js.address.state_id
						};

						$scope.city = $scope.js.address.city_name;
					}
				});
			});
		});
	});

	JsDatabase.getParameter('jobseekingStatus').then(function(statuses){
		delete(statuses._id)
		delete(statuses._rev)

		$scope.jobseekingStatus = statuses;
	});

	// country onChange
	$scope.countryChanged = function(){
		$scope.selectedCountry = this.selectedCountry; // update scope
		console.log($scope.selectedCountry.id);
	}
	// end countries

	$scope.stateChanged = function(){
		$scope.selectedState = this.selectedState;
	}
	// end states

	$scope.availabilityUnit = [
		{id: 'D', name: 'Day(s)'},
		{id: 'W', name: 'Week(s)'},
		{id: 'M', name: 'Month(s)'},
		{id: 'I', name: 'Immedietly'},
	];

	$scope.jsJobseekingStatusUpdate = function(){
		$scope.jsJobseekingStatus = this.id;
	}

	$scope.saveJobseekingInformation = function(){
		var param = {};

		$scope.js.js_jobseek_status_id = $scope.jsJobseekingStatus;
		param.js_jobseek_status_id = $scope.js.js_jobseek_status_id;

		$scope.js.availability = $scope.availability;
		param.availability = $scope.js.availability;

		if( !$scope.selectedavailabilityUnit ){
			$scope.selectedavailabilityUnit = $scope.availabilityUnit[0];
		}
		$scope.js.availability_unit = $scope.selectedavailabilityUnit.id;
		param.availability_unit = $scope.js.availability_unit;

		$scope.js.driving_license = $scope.drivingLicense;
		param.driving_license = $scope.js.driving_license;

		$scope.js.transport = $scope.ownTransport;
		param.transport = $scope.js.transport;

		if( !$scope.js.address ){
			$scope.js.address = {};
		}
		$scope.js.address.country_id = $scope.selectedCountry.id;
		$scope.js.address.state_id = $scope.selectedState.id;
		$scope.js.address.state_name = $scope.insertedState;
		$scope.js.address.city_name = $scope.city;

		param.country_id = $scope.js.address.country_id;
		if( $scope.js.address.country_id == 127 ){
			param.state_id = $scope.js.address.state_id;
		}else{
			param.state_name = $scope.js.address.state_name;
		}
		param.city_name = $scope.js.address.city_name;

		JsDatabase.updateProfile( $scope.js ).then(function(a){
			// if this two field is updated, then mark this section as completed
			if( param.js_jobseek_status_id && param.availability ){
				JsDatabase.updateCompleteness('jobseek', true);
			}else{
				JsDatabase.updateCompleteness('jobseek', false);
			}
		}).catch(function(b){
			// console.log(b);
		});

		$http({
			method: 'POST',
			url: 'http://api.jenjobs.com/jobseeker/jobseeking-info',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			data: param,
			params: {'access-token':$scope.access_token}
		}).then(function(response){
			console.log(response);
			$ionicLoading.show({
				template: response.data.status_text,
				noBackdrop: true,
				duration: 1000
			});
		}).catch(function(){

		});

		return false;
	}

	$scope.go = function(path){
		$ionicHistory.nextViewOptions({
			disableBack: true
		});
		$location.path(path);
	}
})

.controller('WorkExpCtrl', function($scope, $stateParams, $filter, $http, $location, $ionicLoading, $ionicHistory, JsDatabase){

	var rev = null;
	var id = 0;
	var workId = 0;

	$scope.$on('$ionicView.enter', function(scopes, states){
		if( $stateParams.workid ){
			JsDatabase.getWorkById($stateParams.workid).then(function(work){
				$scope.positionTitle = work.position;
				$scope.companyName = work.company;
				$scope.selectedEmploymentType = { id: work.job_type_id };
				$scope.selectedJobLevel = { id: work.job_level_id }
				$scope.monthlySalary = work.salary;
				$scope.selectedCurrency = { id: work.currency_id }
				$scope.selectedJobSpecialisation = { id: work.job_spec_id };
				$scope.selectedJobRole = { id: work.job_role_id }
				$scope.selectedIndustry = { id: work.industry_id };
				$scope.experience = work.experience;

				$scope.startMonth = new Date(work.date_from);
				if( work.date_to ){
					$scope.endMonth = new Date(work.date_to);
				}
				rev = work._rev;
				id = work.id;
				workId = work._id;

				setTimeout(function(){
					$scope.updateJobRole();
				}, 500);
			});
		}

		JsDatabase.getParameter('jobType').then(function(jobTypes){
			delete(jobTypes._id);
			delete(jobTypes._rev);

			$scope.jobTypes = [];
			angular.forEach(jobTypes, function(e,i){
				$scope.jobTypes.push({
					id: i,
					name: e
				});
			});
		});

		JsDatabase.getParameter('jobLevel').then(function(jobLevels){
			delete(jobLevels._id);
			delete(jobLevels._rev);

			$scope.jobLevels = [];
			angular.forEach(jobLevels, function(e,i){
				$scope.jobLevels.push({id: i,name: e});
			});
		});

		JsDatabase.getParameter('currency').then(function(currencies){
			delete(currencies._id);
			delete(currencies._rev);

			$scope.currencies = [];
			angular.forEach(currencies, function(e,i){
				$scope.currencies.push({id: i,name: e});
			});
		});

		JsDatabase.getParameter('jobSpec').then(function(jobSpecs){
			delete(jobSpecs._id);
			delete(jobSpecs._rev);

			$scope.jobSpecialisations = []; // for input selection
			$scope.tempSpec = jobSpecs; // for searcing by index

			angular.forEach(jobSpecs, function(e,i){
				$scope.jobSpecialisations.push({id: i,name: e.name});
			});
		});

		JsDatabase.getParameter('industry').then(function(industries){
			delete(industries._id);
			delete(industries._rev);

			$scope.industries = []; // for input selection
			angular.forEach(industries, function(e,i){
				$scope.industries.push({id: i,name: e});
			});
		});
	});


	$scope.access_token = null;
	$scope.js = null;

	JsDatabase.getToken().then(function(token){
		if( token.length > 0 ){
			$scope.access_token = token[0].access_token;

			JsDatabase.getProfile().then(function(profile){
				$scope.js = profile;
			});
		}else{
			var alertPopup = $ionicPopup.alert({
				title: 'Notification',
				template: 'Failed to get access token!'
			});
		}
	});

	$scope.updateJobRole = function(){
		$scope.selectedJobSpecialisation = this.selectedJobSpecialisation;
		if($scope.selectedJobSpecialisation.id){
			var jobRoles = $scope.tempSpec[$scope.selectedJobSpecialisation.id].roles;
			$scope.jobRoles = [];
			angular.forEach(jobRoles, function(e,i){
				$scope.jobRoles.push({id: i, name: e});
			});
		}
	}

	$scope.saveWorkExp = function(form){
		if( form.$valid ){
			var param = {};

			param.position = $scope.positionTitle;
			param.company = $scope.companyName;
			param.job_spec_id = $scope.selectedJobSpecialisation.id;
			param.job_role_id = $scope.selectedJobRole.id;
			param.job_type_id = $scope.selectedEmploymentType.id;
			param.job_level_id = $scope.selectedJobLevel.id;
			param.industry_id = $scope.selectedIndustry.id;

			if( $scope.monthlySalary && $scope.selectedCurrency ){
				param.salary = $scope.monthlySalary;
				param.currency_id = $scope.selectedCurrency.id;
			}
			param.date_from = $filter('date')($scope.startMonth, 'yyyy-MM-dd');
			if( param.date_to ){
				param.date_to = $filter('date')($scope.endMonth, 'yyyy-MM-dd');
			}
			param.experience = $scope.experience;
			param.id = id;

			// check if there is internet connectivity first before submitting
			if( id ){
				JsDatabase.addWork( param, workId, rev ).then(function(a){
					param._id = a.id;
					param._rev = a.rev;
					rev = a.rev;

					// set no work exp as false
					JsDatabase.updateCompleteness('workExp', true);
					if( $scope.js.no_work_exp ){
						$scope.js.no_work_exp = false;
						JsDatabase.updateProfile($scope.js);
					}

					postWorkExp( param );
				});
			}else{
				JsDatabase.addWork(param).then(function(a){
					param._id = a.id;
					param._rev = a.rev;
					workId = a.id;
					rev = a.rev;

					// set no work exp as 0
					JsDatabase.updateCompleteness('workExp', true);
					if( $scope.js.no_work_exp ){
						$scope.js.no_work_exp = false;
						JsDatabase.updateProfile($scope.js);
					}

					postWorkExp( param );
				});
			}
			/////////////////////
		}else{
			$ionicLoading.show({
				template: 'Please complete the form.',
				noBackdrop: true,
				duration: 2000
			});
		}
		return false;
	}

	function postWorkExp( param ){
		var url = 'http://api.jenjobs.com/jobseeker/work-experience';
		if( id ){ url += '/'+id; }
		url += '?access-token='+$scope.access_token;

		$http({
			method: 'POST',
			url: url,
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

			id = response.data.id;
			param.id = response.data.id;

			JsDatabase.updateWork(param).then(function(stat){
				console.log(stat);
			}).catch(function(err){
				console.log(err);
			});
		}).catch(function(e){
			console.log(e);
		});
	}

	$scope.go = function(path){
		$ionicHistory.nextViewOptions({
			disableBack: true
		});
		$location.path(path);
	}

})

.controller('EduCtrl', function($scope, $stateParams, $filter, $http, $location, $ionicHistory, $ionicLoading, JsDatabase){
	var rev = null;
	var id = 0;
	var eduId = 0;

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

	$scope.$on('$ionicView.enter', function(scopes, states){
		if( $stateParams.eduid ){
			JsDatabase.getEducationById($stateParams.eduid).then(function(edu){
				rev = edu._rev;
				id = edu._id;

				$scope.school = edu.school;
				$scope.selectedEducationLevel = {id:edu.edu_level_id};
				$scope.selectedEducationField = {id:edu.edu_field_id};
				$scope.yearGraduated = {id:edu.date_graduated};
				$scope.educationMajor = edu.major;
				$scope.grade = edu.grade;
				$scope.educationInfo = edu.info;
				eduId = edu.id;
			});
		}

		JsDatabase.getParameter('educationLevel').then(function(educationLevel){
			delete(educationLevel._id);
			delete(educationLevel._rev);

			$scope.EducationLevel = [];
			angular.forEach(educationLevel, function(e,i){
				$scope.EducationLevel.push({id: i, name: e});
			});
		});

		JsDatabase.getParameter('educationField').then(function(educationField){
			delete(educationField._id);
			delete(educationField._rev);

			$scope.EducationField = [];
			angular.forEach(educationField, function(e,i){
				$scope.EducationField.push({id: i, name: e});
			});
		});

		$scope.years = [];
		var startYear = Number($filter('date')(new Date(), 'yyyy'));
		for(var i=startYear;i>startYear-50;i--){
			$scope.years.push({id: i,name: i});
		}
	});

	$scope.saveEducation = function(form){
		if( form.$valid ){
			var param = {};

			param.edu_level_id = $scope.selectedEducationLevel.id;
			param.edu_field_id = $scope.selectedEducationField.id;
			param.country_id = 0;
			param.school = $scope.school;
			param.major = $scope.educationMajor;
			// param.edu_field_desc
			param.grade = $scope.grade;
			param.date_graduated = $scope.yearGraduated.id;
			param.info = $scope.educationInfo;
			param.id = eduId;

			if( id && rev ){
				param._id = id;
				param._rev = rev;
				JsDatabase.addEducation( param, id, rev ).then(function(){
					JsDatabase.updateCompleteness('education', true);

					postEducation( param );
				});
			}else{
				JsDatabase.addEducation( param ).then(function(a){
					console.log(a);
					param._id = a.id;
					param._rev = a.rev;
					JsDatabase.updateCompleteness('education', true);

					postEducation( param );
				});
			}

		}else{
			$ionicLoading.show({
				template: 'Please complete the form.',
				noBackdrop: true,
				duration: 1500
			});

			setTimeout(function(){
				$location.path('/tab/resume');
			}, 1500);
		}
	}

	// function to post education to server
	function postEducation( param ){
		var url = 'http://api.jenjobs.com/jobseeker/qualification';
		if( Number(eduId) ){ url += '/'+eduId; }
		url += '?access-token='+$scope.access_token;

		$http({
			method: 'POST',
			url: url,
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

			if( response.data.status_code == 1 ){
				eduId = response.data.id;
				param.id = eduId;
				console.log(param);
				JsDatabase.updateEducation(param).then(function(a){
					console.log(a);
					setTimeout(function(){
						$location.path('/tab/resume');
					}, 1500);
				});
			}
		});
	}
	// end post education

	$scope.go = function(path){
		$ionicHistory.nextViewOptions({
			disableBack: true
		});
		$location.path(path);
	}
});
