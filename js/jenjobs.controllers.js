angular.module('jenjobs.controllers', [])
.controller('ProfileCtrl', function($scope, $location, JsDatabase){
	$scope.js = {};
	
	JsDatabase.getProfile().then(function(profile){
		$scope.js = profile;
	});
	
	$scope.go = function(path){
		$location.path(path);
	}
})
.controller('ProfileUpdateCtrl', function($scope, $http, $filter, $ionicPopup, JsDatabase){
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
		// console.log( $scope.js.gender );
		// console.log( $scope.selectedGender );
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
				name: name,
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
	
	// update profile submit
	$scope.updateForm = function(){
		// console.log( $scope.js );
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
				url: 'http://api.jenjobs.local/jobseekers/profile?access-token='+$scope.access_token,
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				data: param
			}).then(function(response){
				// console.log('received response...');
				console.log(response);
			});
			// console.log('end form...');
		});
		return false;
	}
})
.controller('LoginCtrl', function($scope, $http, $location, $ionicPopup, JsDatabase){
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
				$http({method: 'GET', url: 'http://api.jenjobs.local/jobseekers/profile?access-token='+accessToken
				}).then(function(response){
					// remove _links from record, before saving, else it will cause bad special document member error, because _links is a reserved work in PouchDb
					// only for user profile/account
					delete(response.data._links);
					return response;
				}).then(function(response){
					console.log(response);
					JsDatabase.addProfile(response.data);
				}).then(function(){
					$location.path('/tab/profile');
				});
				
				// download job applications
				$http({method: 'GET', url: 'http://api.jenjobs.local/jobseekers/application?access-token='+accessToken})
				.then(function(response){
					if( response.data.items.length > 0 ){
						angular.forEach(response.data.items, function(value, i){
							JsDatabase.addApplication(value);
						});
					}
				});
				
				// download work experiences
				$http({method: 'GET', url: 'http://api.jenjobs.local/jobseekers/work-experience?access-token='+accessToken
				}).then(function(response){
					if( response.data.items.length > 0 ){
						angular.forEach(response.data.items, function(value, i){
							JsDatabase.addWork(value);
						});
					}
				});
				
				// download qualification/education
				$http({method: 'GET', url: 'http://api.jenjobs.local/jobseekers/qualification?access-token='+accessToken
				}).then(function(response){
					if( response.data.items.length > 0 ){
						angular.forEach(response.data.items, function(value, i){
							JsDatabase.addEducation(value);
						});
					}
				});
				
				// download job preferences
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
				// console.log('got token');
				$location.path('/tab/profile');
			}
		});
    });
})
.controller('WorkCtrl', function($scope, $http, $location, $ionicPopup, JsDatabase){
	// $scope.go = function ( path ) {
		// $location.path( path );
	// };
	
	$scope.jobs = [];
	
	$scope.test2 = function(){
		$http({
			method: 'GET',
			url: 'http://api.jenjobs.local/jobs',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		}).then(function(response){
			// success
			if( response.data && response.data.items.length > 0 ){
				angular.forEach(response.data.items, function(value, key){
					// console.log(value);
					// console.log(key);
					var added = JsDatabase.addWork(value);
					// console.log(added);
				});
			}
		}, function(response){
			// failed
		});
	}
	
	$scope.test = function(){
		// JsDatabase.getWork().then(function(job){
			// console.log(job);
			// $scope.jobs = job;
		// });
		
		$ionicPopup.confirm({
			title: "Internet Disconnected",
			content: "The internet is disconnected on your device."
		}).then(function(result){
			// what to do with the result?
		});
	}
	
	$scope.test3 = function(){
		JsDatabase.getToken().then(function(token){
			console.log(token);
			console.log(token.length);
			if( token.length > 0 ){
				/***
				$http({method: 'GET', url: 'http://api.jenjobs.local/jobseekers/application?access-token='+token[0].access_token})
				.then(function(response){
					console.log(response);
					if( response.data.items.length > 0 ){
						angular.forEach(response.data.items, function(value, i){
							JsDatabase.addApplication(value);
						});
					}
					
					setTimeout(function(){
						JsDatabase.getApplication().then(function(applications){
							console.log(applications);
						});
					}, 2000);
				});
				*/
				
				/***
				$http({method: 'GET', url: 'http://api.jenjobs.local/jobseekers/profile?access-token='+token[0].access_token
				}).then(function(response){
					delete(response.data._links); // remove _links from record, before saving, else it will cause bad special document member error, because _links is a reserved work in PouchDb
					
					JsDatabase.addProfile(response.data); // get only 1, the first item
					
					setTimeout(function(){
						JsDatabase.getProfile().then(function(profile){
							console.log(profile);
						});
					}, 2000);
				});
				*/
				
				/***
				$http({method: 'GET', url: 'http://api.jenjobs.local/jobseekers/work-experience?access-token='+token[0].access_token
				}).then(function(response){
					console.log(response);
					if( response.data.items.length > 0 ){
						angular.forEach(response.data.items, function(value, i){
							JsDatabase.addWork(value);
						});
					}
				});
				*/
				
				/**
				$http({method: 'GET', url: 'http://api.jenjobs.local/jobseekers/skill?access-token='+token[0].access_token
				}).then(function(response){
					console.log(response);
					if( response.data.items.length > 0 ){
						angular.forEach(response.data.items, function(value, i){
							JsDatabase.addSkill(value);
						});
					}
				});
				*/
				
				
			}
		});
		
		// $http({method: 'GET',url: 'http://api.jenjobs.local/parameters/locations'})
		// .then(function(response){
			// angular.forEach(response.data, function(value, i){
				// JsDatabase.addParameter(value, i);
			// });
		// });
	}
	
})
.controller('JobFilterCtrl', function($scope){
	
})
.controller('ApplicationCtrl', function($scope){
	
});