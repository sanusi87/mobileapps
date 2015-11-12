angular.module('jenjobs.sync', [])
.factory('Sync', function($http, JsDatabase){
    var _token;

	return {
        setToken: function(token){ _token = token; },
        updateSubscription: updateSubscription
    };

    function updateSubscription(subscription_id, status, cb){
        if( _token && _token.length > 0 ){
            var data = {
                subscription_id: subscription_id,
                status: status
            };

			return $http({
				method: 'POST',
				url: 'http://api.jenjobs.com/jobseeker/subscription',
				params: {'access-token':_token},
                headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
                data: data
			}).then(function(response){
				cb(response);
			}).catch(function(error){
				// console.log(error);
				cb({error: 'A problem occur.[code 10]'});
			});
		}else{
			cb({error: 'Access token is required.'});
		}
    }


    function updateAlert(alert_id, status, cb){
        if( _token && _token.length > 0 ){
			return $http({
				method: 'POST',
				url: 'http://api.jenjobs.com/jobseeker/alert',
				params: {'access-token':_token},
                data: {
                    subscription_id: subscription_id,
                    status: status
                }
			}).then(function(response){
				cb(response);
			}).catch(function(error){
				// console.log(error);
				cb({error: 'A problem occur.[code 10]'});
			});
		}else{
			cb({error: 'Access token is required.'});
		}
    }
});
