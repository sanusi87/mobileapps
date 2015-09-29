angular.module('jenjobs.db', [])
.factory('ProfileDatabase', ['$q', function($q){
	var _profile_db;
	// _work_db,
	// _education_db,
	// _job_db,
	// _skill_db,
	// _application_db;
	
	var _profile;
	// _work,
	// _education,
	// _job,
	// _skill,
	// _application;
	
	return {
		initDB: initDB,
		getProfile: getProfile,
		addProfile: addProfile,
		updateProfile: updateProfile,
		deleteProfile: deleteProfile
	};
	
	function initDB(){
		// Creates the database or opens if it already exists
		_profile_db = new PouchDB('profile', {adapter: 'websql'});
	};
	
	// profile start
	// get saved profile from local database
	function getProfile(){
		if (!_profile) {
			return $q.when(_profile_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				
				// Each row has a .doc object and we just want to send an 
				// array of birthday objects back to the calling controller,
				// so let's map the array to contain just the .doc objects.
				_profile = docs.rows.map(function(row) {
					// Dates are not automatically converted from a string.
					// row.doc.Date = new Date(row.doc.Date);
					return row.doc;
				});
				
				// Listen for changes on the database.
				_profile_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onDatabaseChange);

				return _profile;
			});
		} else {
			// Return cached data as a promise
			return $q.when(_profile);
		}
	}
	
	function addProfile(userProfile){
		return $q.when( _profile_db.post( userProfile ) );
	};
	
	function updateProfile(userProfile){
		return $q.when( _profile_db.put( userProfile ) );
	};

	function deleteProfile(userProfile){
		return $q.when( _profile_db.remove( userProfile ) );
	};
	
	function onDatabaseChange(change) {
		var index = findIndex(_profile, change.id);
		var p = _profile[index];

		if (change.deleted) {
			if (p) {
				_profile.splice(index, 1); // delete
			}
		} else {
			if (p && p._id === change.id) {
				_profile[index] = change.doc; // update
			} else {
				_profile.splice(index, 0, change.doc) // insert
			}
		}
	}

	// Binary search, the array is by default sorted by _id.
	function findIndex(array, id) {
		var low = 0, high = array.length, mid;
		while (low < high) {
			mid = (low + high) >>> 1;
			array[mid]._id < id ? low = mid + 1 : high = mid
		}
		return low;
	}


}]);