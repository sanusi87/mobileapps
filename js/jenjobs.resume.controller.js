angular.module('jenjobs.resume', [])
.controller('ResumeCtrl', function($scope, $http, $ionicPopup, $ionicModal, JsDatabase){
	$scope.countries = [];
	$scope.states = [];
	
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
					JsDatabase.getSkill().then(function(skills){
						$scope.skills = skills;
					});
				});
			}else{
				setTimeout(function(){
					JsDatabase.getSkill().then(function(skills){
						$scope.skills = skills;
					});
				}, 500);
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
	
	// setInterval(function(){
		// console.log( $scope.attachedResume );
	// }, 2000);
	
	JsDatabase.getParameter('attachedResume').then(function(attachedResume){
		$scope.attachedResume = attachedResume.name;
	}).catch(function(err){
		JsDatabase.addParameter({value:0}, 'attachedResume');
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
			JsDatabase.getParameter('attachedResume').then(function(attachedResume){
				attachedResume.name = response.data.resume;
				JsDatabase.updateParameter(attachedResume);
			});
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
	
})

.controller('JobPrefCtrl', function($scope, $http, $ionicModal, JsDatabase){
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
	
	$scope.selectedJobType = [];
	$scope.states = [];
	$scope.selectedState = [];
	$scope.selectedCountry = [];
	$scope.countries = [];
	
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
			
			$ionicModal.fromTemplateUrl('/templates/modal/states.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				$scope.stateModal = modal;
			});
			
			return;
		})
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

.controller('WorkExpCtrl', function($scope, $stateParams, $filter, $http, $ionicLoading, JsDatabase){
	
	var rev = null;
	var id = 0;
	
	// console.log($stateParams);
	if( $stateParams.workid ){
		JsDatabase.getWorkById($stateParams.workid).then(function(work){
			console.log(work);
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
			// param.id = id;
			
			console.log(param);
			
			// check if there is internet connectivity first before submitting
			if( $stateParams.workid ){
				JsDatabase.addWork( param, $stateParams.workid, rev );
			}else{
				JsDatabase.addWork(param);
			}
			
			var url = 'http://api.jenjobs.local/jobseekers/work-experience';
			if( Number(id) ){ url = +'/'+id; }
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
				console.log(response);
				
				$ionicLoading.show({
					template: 'Please complete the form.',
					noBackdrop: true,
					duration: 2000
				});
			});
			
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

.controller('EduSelectedCtrl', function($scope, $stateParams, $filter, $http, $ionicLoading, JsDatabase){
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
			
			// console.log(param);
			param.id = eduId;
			
			if( id && rev ){
				JsDatabase.addEducation( param, id, rev );
			}else{
				JsDatabase.addEducation( param );
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
					duration: 2000
				});
			});
			
		}else{
			$ionicLoading.show({
				template: 'Please complete the form.',
				noBackdrop: true,
				duration: 2000
			});
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