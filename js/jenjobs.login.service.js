angular.module('jenjobs.login', [])
.factory('JobseekerLogin', function($http, JsDatabase, $ionicLoading){
    var username = '',
    password = '',
    grant_type = 'password',
    client_id = 'testclient',
    client_secret = 'testpass';

    var accessToken = '';

    return {
        setUsername: function(user){
            username = user;
            return true;
        },
        getUsername: function(){
            return username;
        },
        setPassword: function(pass){
            password = pass;
            return true;
        },
        getPassword: function(){
            return password;
        },
        setAccessToken: function(at){
            accessToken = at;
        },
        login: function( cb ){
            $http({
    			method: 'POST',
    			url: 'http://api.jenjobs.local/oauth2/token',
    			headers: {
    				'Accept': 'application/json',
    				'Content-Type': 'application/json'
    			},
    			data: {
                    username: username,
                    password: password,
                    grant_type: grant_type,
                    client_id: client_id,
                    client_secret: client_secret
                }
    		}).then(function(response){
                cb( response ); // run callback
            });
        },

        // successful login subsequent action
        downloadParameter: function( cb ){
            $http({
                method: 'GET',
                url: 'http://api.jenjobs.local/parameters/others'
            }).then(function(response){
                cb( response );
            });
        },
        downloadLocation: function( cb ){
            $http({
                method: 'GET',
                url: 'http://api.jenjobs.local/parameters/locations'
            }).then(function(response){
                cb( response );
            });
        },
        downloadApplication: function( cb ){

            if( accessToken && accessToken.length > 0 ){
                cb({error: 'Access token is required.'});
            }else{
                $http({
                    method: 'GET',
                    url: 'http://api.jenjobs.local/jobseeker/profile',
                    params: {'access-token': accessToken}
                }).then(function(response){
                    cb( response );
                });
            }
        },
        downloadWorkExperience: function( accessToken, cb ){
            $http({
                method: 'GET',
                url: 'http://api.jenjobs.local/jobseeker/work-experience',
                params: {'access-token': accessToken}
            }).then(function(response){
                cb(response);
            });
        },
        downloadQualification: function( accessToken, cb ){
            $http({
                method: 'GET',
                url: 'http://api.jenjobs.local/jobseeker/qualification',
                params: {'access-token':accessToken}
            }).then(function(response){
                cb(response);
            });
        },
        downloadJobPreference: function( accessToken, cb ){
            $http({
                method: 'GET',
                url: 'http://api.jenjobs.local/jobseeker/job-preference',
                params: {'access-token':accessToken}
            }).then(function(response){
                cb(response);
            });
        },
        downloadSkill: function( accessToken, cb ){
            $http({
                method: 'GET',
                url: 'http://api.jenjobs.local/jobseeker/skill',
                params: {'access-token':accessToken}
            }).then(function(respo){

            });
        },
        downloadLanguage: function( cb ){

        },
        downloadBookmark: function( cb ){

        },

    }
});
