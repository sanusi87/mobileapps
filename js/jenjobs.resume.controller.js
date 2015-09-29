angular.module('jenjobs.resume', [])
.controller('ResumeCtrl', function($scope, $http, $location, $ionicPopup, JsDatabase){
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
			// console.log(token[0].access_token);
			$scope.access_token = token[0].access_token;
		}else{
			var alertPopup = $ionicPopup.alert({
				title: 'Notification',
				template: 'Failed to get access token!'
			});
		}
	});
	
	JsDatabase.getProfile().then(function(profile){
		console.log(profile);
		$scope.js = profile;
		
		$scope.jsJobseekingStatus = profile.js_jobseek_status_id;
		$scope.availability = profile.availability;
		$scope.selectedavailabilityUnit = {
			id: profile.availability_unit
		};
		if(profile.availability_unit == 'D'){
			$scope.selectedavailabilityUnit.name = 'Day(s)';
		}else if(profile.availability_unit == 'W'){
			$scope.selectedavailabilityUnit.name = 'Week(s)';
		}else if(profile.availability_unit == 'M'){
			$scope.selectedavailabilityUnit.name = 'Month(s)';
		}
		
		$scope.drivingLicense = profile.driving_license;
		$scope.ownTransport = profile.transport;
		
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
	
	// $scope.jsJobseekingStatus
	JsDatabase.getParameter('jobseekingStatus').then(function(statuses){
		delete(statuses._id)
		delete(statuses._rev)
		
		$scope.jobseekingStatus = statuses;
	});
	
	// country onChange
	$scope.countryChanged = function(){
		$scope.selectedCountry = this.selectedCountry; // update scope
		// $scope.js.country = $scope.selectedCountry.name;
		// $scope.js.country_id = $scope.selectedCountry.id;
	}
	// end countries
	
	$scope.stateChanged = function(){
		$scope.selectedState = this.selectedState;
		
		// var currentlySelectedState = tempStates[$scope.selectedState.id];
		// $scope.cities = [];
		// angular.forEach(currentlySelectedState.cities, function(name, id){
			// $scope.cities.push({
				// name: name,
				// id: id
			// });
		// });
	}
	// end states
	
	// $scope.availability;
	// $scope.selectedavailabilityUnit
	$scope.availabilityUnit = [
		{id: 'D', name: 'Day(s)'},
		{id: 'W', name: 'Week(s)'},
		{id: 'M', name: 'Month(s)'},
		{id: 'I', name: 'Immedietly'},
	];
	
	// $scope.drivingLicense;
	// $scope.drivingLicenseUpdated = function(){}
	
	// $scope.ownTransport;
	// $scope.ownTransportUpdated = function(){}
	// end jobseeking
	
	
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
		
		console.log('saving...');
		// console.log( $scope.selectedCountry );
		// console.log( $scope.selectedState );
		
		JsDatabase.updateProfile( $scope.js )
		// .then(function(){
			// if( typeof( $scope.address ) == 'undefined' ){
				// $scope.address = {};
			// }
			// $scope.address.country_id = $scope.selectedCountry.id;
			// JsDatabase.updateAddress($scope.address);
		// });
		
		console.log('ajaxing...');
		console.log(param);
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

.controller('WorkExpCtrl', function($scope, $http, JsDatabase){
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

.controller('EduCtrl', function($scope, $http, JsDatabase){
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

.controller('SkillCtrl', function($scope, $http, JsDatabase){
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