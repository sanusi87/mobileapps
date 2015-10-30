angular.module('jenjobs.login', [])
.factory('JobseekerLogin', function($http, JsDatabase, $ionicLoading){
    var username = '',
    password = '',
    grant_type = 'password',
    client_id = 'testclient',
    client_secret = 'testpass',
	accessToken = '';

    return {
		setUsername: setUsername,
		getUsername: getUsername,
		setPassword: setPassword,
		getPassword: getPassword,
		setAccessToken: setAccessToken,

		login: login,
		downloadParameter: downloadParameter,
		downloadLocation: downloadLocation,
		downloadProfile: downloadProfile,
		downloadApplication: downloadApplication,
		downloadWorkExperience: downloadWorkExperience,
		downloadQualification: downloadQualification,
		downloadJobPreference: downloadJobPreference,
		downloadSkill: downloadSkill,
		downloadLanguage: downloadLanguage,
		downloadBookmark: downloadBookmark
    };

	function setUsername(user){
		username = user;
		return true;
	};

	function getUsername(){
		return username;
	};

	function setPassword(pass){
		password = pass;
		return true;
	};

	function getPassword(){
		return password;
	};

	function setAccessToken(at, cb){
		accessToken = at;
		console.log(accessToken);
		// setTimeout(function(){
			cb();
		// }, 1000);
	};

	// this function is used to get the access token for the jobseeker, when he/she had supplied his/her username and password
	function login( cb ){
		if( username.length == 0 || password.length == 0 ){
			cb({error: 'Username and password are required.'});
		}else{
			$http({
				method: 'POST',
				url: 'http://api.jenjobs.com/oauth2/token',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				data: {
					username: username, // required
					password: password, // required
					grant_type: grant_type,
					client_id: client_id,
					client_secret: client_secret
				}
			}).then(function(response){
				cb( response ); // run callback
			}).catch(function(error){
				console.log(error);
				cb({error: 'Wrong username or password!'});
			});
		}
	};

	// successful login subsequent action
	function downloadParameter( cb ){
		$http({
			method: 'GET',
			url: 'http://api.jenjobs.com/parameters/others'
		}).then(function(response){
			cb( response );
		}).catch(function(error){
			console.log(error);
			cb({error: 'A problem occur.[code 2]'});
		});
	};

	function downloadLocation( cb ){
		$http({
			method: 'GET',
			url: 'http://api.jenjobs.com/parameters/locations'
		}).then(function(response){
			cb( response );
		}).catch(function(error){
			console.log(error);
			cb({error: 'A problem occur.[code 3]'});
		});
	};

	function downloadProfile( cb ){
		console.log(this);
		console.log(accessToken);
		if( accessToken && accessToken.length > 0 ){
			$http({
				method: 'GET',
				url: 'http://api.jenjobs.com/jobseeker/profile',
				params: {'access-token': accessToken}
			}).then(function(response){
				cb(response);
			});
		}else{
			cb({error: 'Access token is required.'});
		}
	}

	function downloadApplication( cb ){
		if( accessToken && accessToken.length > 0 ){
			$http({
				method: 'GET',
				url: 'http://api.jenjobs.com/jobseeker/profile',
				params: {'access-token': accessToken}
			}).then(function(response){
				cb( response );
			}).catch(function(error){
				console.log(error);
				cb({error: 'A problem occur.[code 4]'});
			});
		}else{
			cb({error: 'Access token is required.'});
		}
	};

	function downloadWorkExperience( cb ){
		if( accessToken && accessToken.length > 0 ){
			$http({
				method: 'GET',
				url: 'http://api.jenjobs.com/jobseeker/work-experience',
				params: {'access-token': accessToken}
			}).then(function(response){
				cb(response);
			}).catch(function(error){
				console.log(error);
				cb({error: 'A problem occur.[code 5]'});
			});
		}else{
			cb({error: 'Access token is required.'});
		}
	};

	function downloadQualification( cb ){
		if( accessToken && accessToken.length > 0 ){
			$http({
				method: 'GET',
				url: 'http://api.jenjobs.com/jobseeker/qualification',
				params: {'access-token':accessToken}
			}).then(function(response){
				cb(response);
			}).catch(function(error){
				console.log(error);
				cb({error: 'A problem occur.[code 6]'});
			});
		}else{
			cb({error: 'Access token is required.'});
		}
	};

	function downloadJobPreference( cb ){
		if( accessToken && accessToken.length > 0 ){
			$http({
				method: 'GET',
				url: 'http://api.jenjobs.com/jobseeker/job-preference',
				params: {'access-token':accessToken}
			}).then(function(response){
				cb(response);
			}).catch(function(error){
				console.log(error);
				cb({error: 'A problem occur.[code 7]'});
			});
		}else{
			cb({error: 'Access token is required.'});
		}
	};

	function downloadSkill( cb ){
		if( accessToken && accessToken.length > 0 ){
			$http({
				method: 'GET',
				url: 'http://api.jenjobs.com/jobseeker/skill',
				params: {'access-token':accessToken}
			}).then(function(response){
				cb(response);
			}).catch(function(error){
				console.log(error);
				cb({error: 'A problem occur.[code 8]'});
			});
		}else{
			cb({error: 'Access token is required.'});
		}
	};

	function downloadLanguage( cb ){
		if( accessToken && accessToken.length > 0 ){
			$http({
				method: 'GET',
				url: 'http://api.jenjobs.com/jobseeker/language',
				params: {'access-token':accessToken}
			}).then(function(response){
				cb(response);
			}).catch(function(error){
				console.log(error);
				cb({error: 'A problem occur.[code 9]'});
			});
		}else{
			cb({error: 'Access token is required.'});
		}
	};

	function downloadBookmark( cb ){
		if( accessToken && accessToken.length > 0 ){
			$http({
				method: 'GET',
				url: 'http://api.jenjobs.com/jobseeker/bookmark',
				params: {'access-token':accessToken}
			}).then(function(response){
				cb(response);
			}).catch(function(error){
				console.log(error);
				cb({error: 'A problem occur.[code 10]'});
			});
		}else{
			cb({error: 'Access token is required.'});
		}
	};


});
