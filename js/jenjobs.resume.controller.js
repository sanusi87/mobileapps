angular.module('jenjobs.resume', [])
.controller('ResumeCtrl', function($scope, $http, $ionicPopup, $ionicLoading, $ionicModal, JsDatabase){
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
	
	JsDatabase.getProfile().then(function(profile){
		$scope.js = profile;
		$scope.jsJobseekingStatus = profile.js_jobseek_status_id;
		$scope.availability = profile.availability;
		$scope.selectedavailabilityUnit = {};
		console.log(profile);
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
					name: name,
					id: id
				});
			});
			
			return;
		}).then(function(){
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
	
	JsDatabase.getParameter('jobseekingStatus').then(function(statuses){
		delete(statuses._id)
		delete(statuses._rev)
		
		$scope.jobseekingStatus = statuses;
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
							url: 'http://api.jenjobs.local/jobseekers/work-experience/'+work.id+'?access-token='+$scope.access_token,
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
						}).catch(function(e){
							console.log(e);
							$ionicLoading.show({
								template: 'Data synchronization failed!',
								noBackdrop: true,
								duration: 1500
							});
						});
					}else{
						$ionicLoading.show({
							template: 'Your work experience was successfully deleted.',
							noBackdrop: true,
							duration: 1500
						});
					}
				});
			}
		});
		return false;
	}
	// work
	
	// education
	JsDatabase.getEducation().then(function(educations){
		$scope.educations = educations;
	}).then(function(){
		JsDatabase.getParameter('educationLevel').then(function(educationLevel){
			$scope.educationLevel = educationLevel;
		});
		
		JsDatabase.getParameter('educationField').then(function(educationField){
			$scope.educationField = educationField;
		});
	});
	
	$scope.removeEdu = function( school ){
		var confirmPopup = $ionicPopup.confirm({
			title: 'Confirmation',
			template: 'Remove this work experience?'
		});
		
		confirmPopup.then(function(res) {
			if(res){
				var status = JsDatabase.deleteEducation( school )
				.then(function(stat){
					// console.log(stat);
					//Object {ok: true, id: "BE672A6F-5D6C-F49A-978E-0EAD04755813", rev: "2-ef3a3735b6fe48adf416b2a40476493f"}
					
					if( school.id ){
						$http({
							method: 'DELETE',
							url: 'http://api.jenjobs.local/jobseekers/qualification/'+school.id+'?access-token='+$scope.access_token,
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
						}).catch(function(e){
							console.log(e);
							$ionicLoading.show({
								template: 'Data synchronization failed!',
								noBackdrop: true,
								duration: 1500
							});
						});
					}else{
						$ionicLoading.show({
							template: 'Your work experience was successfully deleted.',
							noBackdrop: true,
							duration: 1500
						});
					}
				});
			}
		});
	}
	// education
	
	// skill
	$ionicModal.fromTemplateUrl('/templates/modal/add-skill-input.html', {
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
			// console.log(a);
			var param = {};
			param.skill = $scope.skill.value;
			
			$http({
				method: 'POST',
				url: 'http://api.jenjobs.local/jobseekers/skill?access-token='+$scope.access_token,
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
		JsDatabase.deleteSkill(skill).then(function(){
			// console.log(skill);
			// if got ID, then remove from webserver also
			if( skill.id ){
				var param = {};
				
				$http({
					method: 'DELETE',
					url: 'http://api.jenjobs.local/jobseekers/skill/'+skill.id+'?access-token='+$scope.access_token,
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
					template: 'Your work experience was successfully deleted.',
					noBackdrop: true,
					duration: 1500
				});
			}
		});
	}
	// skill
	
	// attached resume
	$scope.tmpResumeAttachment;
	$ionicModal.fromTemplateUrl('/templates/modal/attach-resume-input.html', {
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
			url: 'http://api.jenjobs.local/jobseekers/attachment?access-token='+$scope.access_token,
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
	$ionicModal.fromTemplateUrl('/templates/modal/additional-info.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal) {
		$scope.additionalInfoInput = modal;
	});
	
	
	$scope.additionalInfo = {value:null};
	$scope.saveAdditionalInfo = function(){
		console.log($scope.additionalInfo);
		JsDatabase.updateSettings($scope.additionalInfo).then(function(a){
			$scope.additionalInfo._rev = a.rev;
			
			var param = {info: $scope.additionalInfo.value};
			
			$http({
				method: 'POST',
				url: 'http://api.jenjobs.local/jobseekers/additional-info?access-token='+$scope.access_token,
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
				
				setTimeout(function(){
					$scope.openAdditionalInfoModal();
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
})

.controller('JobPrefCtrl', function($scope, $http, $ionicModal, JsDatabase){
	$scope.access_token = null;
	$scope.tempPref = {};
	$scope.selectedJobType = [];
	$scope.states = [];
	$scope.selectedState = [];
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
	
	JsDatabase.getParameter('countries').then(function(countries){
		delete(countries._id);
		delete(countries._rev);
		delete(countries[127]);
		$scope.tempCountries = countries;
		angular.forEach(countries, function(name, id){
			$scope.countries.push({
				name: name,
				id: id
			});
		});
		
		$ionicModal.fromTemplateUrl('/templates/modal/countries.html', {
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
			
			$scope.tempStates = states;
			angular.forEach(states, function(name, id){
				$scope.states.push({
					name: name.name,
					id: id
				});
			});
			return;
		})
	});	
	
	$ionicModal.fromTemplateUrl('/templates/modal/states.html', {
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
	
	// console.log($scope.tempCountries);
	// setInterval(function(){
		// console.log($scope.selectedCountry);
	// }, 2000);
	
	$scope.saveJobPref = function(){
		var param = {};
		
		param.salary = $scope.expectedSalary;
		
		param.job_type_id = [];
		if( $scope.selectedJobType && $scope.selectedJobType.length > 0 ){
			angular.forEach($scope.selectedJobType, function(e,i){
				if( e ){
					param.job_type_id.push(i);
				}
			});
		}
		
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
			console.log(a);
			$http({
				method: 'POST',
				url: 'http://api.jenjobs.local/jobseekers/job-preference?access-token='+$scope.access_token,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				data: param
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
})

.controller('AccessLevelCtrl', function($scope, $http, $ionicLoading, JsDatabase){
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
				var url = 'http://api.jenjobs.local/jobseekers/access-level?access-token='+$scope.access_token;
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
})

.controller('JobseekStatusCtrl', function($scope, $http, $ionicLoading, JsDatabase){
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
			$scope.availability = profile.availability;
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
						name: name,
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
					$scope.selectedCountry = {
						id: $scope.js.address.country_id,
						// name: 'xxx'
					};
					
					$scope.selectedState = {
						id: $scope.js.address.state_id
					};
					
					$scope.city = $scope.js.address.city_name;
				});
			});
		});
	});
	
	// $scope.jsJobseekingStatus
	JsDatabase.getParameter('jobseekingStatus').then(function(statuses){
		delete(statuses._id)
		delete(statuses._rev)
		
		$scope.jobseekingStatus = statuses;
	});
	
	// country onChange
	$scope.countryChanged = function(){
		$scope.selectedCountry = this.selectedCountry; // update scope
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
		
		$scope.js.address.country_id = $scope.selectedCountry.id;
		$scope.js.address.state_id = $scope.selectedState.id;
		$scope.js.address.state_name = $scope.insertedState;
		$scope.js.address.city_name = $scope.city;
		
		console.log($scope.selectedCountry);
		param.country_id = $scope.js.address.country_id;
		if( $scope.js.address.country_id == 127 ){
			param.state_id = $scope.js.address.state_id;
		}else{
			param.state_name = $scope.js.address.state_name;
		}
		param.city_name = $scope.js.address.city_name;
		
		JsDatabase.updateProfile( $scope.js )
		$http({
			method: 'POST',
			url: 'http://api.jenjobs.local/jobseekers/jobseeking-info?access-token='+$scope.access_token,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			data: param
		}).then(function(response){
			console.log(response);
		});
		
		return false;
	}
})

.controller('WorkExpCtrl', function($scope, $stateParams, $filter, $http, $location, $ionicLoading, JsDatabase){
	
	var rev = null;
	var id = 0;
	var workId = 0;
	
	// console.log($stateParams);
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
	
	$scope.access_token = null;
	// $scope.works;
	JsDatabase.getToken().then(function(token){
		if( token.length > 0 ){
			// console.log(token[0].access_token);
			$scope.access_token = token[0].access_token;
		}else{
			var alertPopup = $ionicPopup.alert({
				title: 'Notification',
				template: 'Failed to get access token!'
			});
		}
	});
	
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
			$scope.jobLevels.push({
				id: i,
				name: e
			});
		});
	});
	
	JsDatabase.getParameter('currency').then(function(currencies){
		delete(currencies._id);
		delete(currencies._rev);
		
		$scope.currencies = [];
		angular.forEach(currencies, function(e,i){
			$scope.currencies.push({
				id: i,
				name: e
			});
		});
	});
	
	JsDatabase.getParameter('jobSpec').then(function(jobSpecs){
		delete(jobSpecs._id);
		delete(jobSpecs._rev);
		
		$scope.jobSpecialisations = []; // for input selection
		$scope.tempSpec = jobSpecs; // for searcing by index
		
		angular.forEach(jobSpecs, function(e,i){
			$scope.jobSpecialisations.push({
				id: i,
				name: e.name
			});
		});
	});
	
	$scope.updateJobRole = function(){
		$scope.selectedJobSpecialisation = this.selectedJobSpecialisation;
		var jobRoles = $scope.tempSpec[$scope.selectedJobSpecialisation.id].roles;
		$scope.jobRoles = [];
		angular.forEach(jobRoles, function(e,i){
			$scope.jobRoles.push({
				id: i,
				name: e
			});
		});
	}
	
	JsDatabase.getParameter('industry').then(function(industries){
		delete(industries._id);
		delete(industries._rev);
		
		$scope.industries = []; // for input selection
		angular.forEach(industries, function(e,i){
			$scope.industries.push({
				id: i,
				name: e
			});
		});
	});
	
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
			console.log(id);
			if( id ){
				console.log(workId);
				console.log(rev);
				JsDatabase.addWork( param, workId, rev ).then(function(a){
					param._id = a.id;
					param._rev = a.rev;
					rev = a.rev;
					// JsDatabase.updateWork(param);
				});
			}else{
				JsDatabase.addWork(param).then(function(a){
					param._id = a.id;
					param._rev = a.rev;
					workId = a.id;
					rev = a.rev;
					// JsDatabase.updateWork(param);
				});
			}
			
			var url = 'http://api.jenjobs.local/jobseekers/work-experience';
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
				JsDatabase.updateWork(param);
			}).catch(function(e){
				console.log(e);
				
			});
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
	
	
})

.controller('EduCtrl', function($scope, $stateParams, $filter, $http, $location, $ionicLoading, JsDatabase){
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
			$scope.EducationLevel.push({
				id: i,
				name: e
			});
		});
	});
	
	JsDatabase.getParameter('educationField').then(function(educationField){
		delete(educationField._id);
		delete(educationField._rev);
		
		$scope.EducationField = [];
		angular.forEach(educationField, function(e,i){
			$scope.EducationField.push({
				id: i,
				name: e
			});
		});
	});
	
	$scope.years = [];
	var startYear = Number($filter('date')(new Date(), 'yyyy'));
	for(var i=startYear;i>startYear-50;i--){
		$scope.years.push({
			id: i,
			name: i
		});
	}
	
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
				JsDatabase.addEducation( param, id, rev );
			}else{
				JsDatabase.addEducation( param ).then(function(a){
					id = a.id;
					rev = a.rev;
					
					param._id = a.id;
					param._rev = a.rev;
					
					JsDatabase.addEducation(param, a.id, a.rev);
				});
			}
			
			var url = 'http://api.jenjobs.local/jobseekers/qualification';
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
					JsDatabase.addEducation(param, param._id, param._rev).then(function(){
						setTimeout(function(){
							$location.path('/tab/resume');
						}, 1500);
					});
				}
			});
			
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
})

.controller('AttachmentCtrl', function($scope, $http, JsDatabase){
	$scope.access_token = null;
	JsDatabase.getToken().then(function(token){
		if( token.length > 0 ){
			// console.log(token[0].access_token);
			$scope.access_token = token[0].access_token;
		}else{
			var alertPopup = $ionicPopup.alert({
				title: 'Notification',
				template: 'Failed to get access token!'
			});
		}
	});
	
	
})

.controller('AdditionalInfoCtrl',  function($scope, $http, JsDatabase){
	$scope.access_token = null;
	JsDatabase.getToken().then(function(token){
		if( token.length > 0 ){
			// console.log(token[0].access_token);
			$scope.access_token = token[0].access_token;
		}else{
			var alertPopup = $ionicPopup.alert({
				title: 'Notification',
				template: 'Failed to get access token!'
			});
		}
	});
	
	
})