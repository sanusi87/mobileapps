angular.module('jenjobs.db', [])
.factory('JsDatabase', ['$q', function($q){
	var _work_db, // js work
	_profile_db, // js profile
	_education_db, // js education
	_skill_db, // js skills
	_language_db, // js skills
	_parameter_db, // jenjobs variables
	_token_db, // access token
	_application_db,
	_job_db,
	_settings_db,
	
	_work,
	_profile,
	_education,
	_skill,
	_language,
	_parameter,
	_token,
	_application,
	_job,
	_settings;
	
	return {
		initDB: initDB,
		
		getWork: getWork,
		addWork: addWork,
		updateWork: updateWork,
		deleteWork: deleteWork,
		getWorkById: getWorkById,
		
		getProfile: getProfile,
		addProfile: addProfile,
		updateProfile: updateProfile,
		deleteProfile: deleteProfile,
		
		getEducation: getEducation,
		getEducationById: getEducationById,
		addEducation: addEducation,
		updateEducation: updateEducation,
		deleteEducation: deleteEducation,
		
		getSkill: getSkill,
		getSkillById: getSkillById,
		addSkill: addSkill,
		updateSkill: updateSkill,
		deleteSkill: deleteSkill,
		
		getLanguage: getLanguage,
		addLanguage: addLanguage,
		updateLanguage: updateLanguage,
		deleteLanguage: deleteLanguage,
		
		getParameter: getParameter,
		addParameter: addParameter,
		updateParameter: updateParameter,
		deleteParameter: deleteParameter,
		
		getToken: getToken,
		addToken: addToken,
		updateToken: updateToken,
		deleteToken: deleteToken,
		
		getApplication: getApplication,
		addApplication: addApplication,
		updateApplication: updateApplication,
		deleteApplication: deleteApplication,
		
		getJob: getJob,
		addJob: addJob,
		deleteJob: deleteJob,
		
		getSettings: getSettings,
		updateSettings: updateSettings,
		addSettings: addSettings
	};
	
	function initDB(){
		_work_db = new PouchDB('work', {adapter: 'websql'});
		_profile_db = new PouchDB('profile', {adapter: 'websql'});
		_education_db = new PouchDB('education', {adapter: 'websql'});
		_parameter_db = new PouchDB('parameter', {adapter: 'websql'});
		_token_db = new PouchDB('token', {adapter: 'websql'});
		_skill_db = new PouchDB('skill', {adapter: 'websql'});
		_language_db = new PouchDB('language', {adapter: 'websql'});
		_application_db = new PouchDB('application', {adapter: 'websql'});
		_job_db = new PouchDB('job', {adapter: 'websql'});
		
		_settings_db = new PouchDB('settings', {adapter: 'websql'});
		$q.when( _settings_db.bulkDocs([
			{_id: 'sms_job_alert', value:0},
			{_id: 'email_alert', value:0},
			{_id: 'notification', value:0},
			{_id: 'attachedResume', value:0}
		]) );
	};
	
	// Binary search, the array is by default sorted by _id.
	function findIndex(array, id) {
		var low = 0, high = array.length, mid;
		while (low < high) {
			mid = (low + high) >>> 1;
			array[mid]._id < id ? low = mid + 1 : high = mid
		}
		return low;
	}
	
	/** start work */
	function getWork(){
		if (!_work) {
			return $q.when(_work_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				// _work = docs.rows;
				_work = docs.rows.map(function(row) {
					// Dates are not automatically converted from a string.
					// row.doc.Date = new Date(row.doc.Date);
					return row.doc;
				});
				
				_work_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onWorkDatabaseChange);

				return _work;
			});
		} else {
			return $q.when(_work);
		}
	}
	
	function getWorkById( workId ){
		return $q.when(_work_db.get(workId)).then(function(work){
			return work;
		});
	}
	
	function addWork(dbItem, id, rev){
		if( id && rev ){
			return $q.when( _work_db.put( dbItem, id, rev ) );
		}else{
			return $q.when( _work_db.post( dbItem ) );
		}
	};
	
	function updateWork(dbItem){
		return $q.when( _work_db.put( dbItem, dbItem._id, dbItem._rev ) );
	};

	function deleteWork(dbItem){
		return $q.when( _work_db.remove( dbItem ) );
	};
	
	function onWorkDatabaseChange(change) {
		var index = findIndex(_work, change.id);
		var p = _work[index];

		if (change.deleted) {
			if (p) {
				_work.splice(index, 1); // delete
			}
		} else {
			if (p && p._id === change.id) {
				_work[index] = change.doc; // update
			} else {
				_work.splice(index, 0, change.doc) // insert
			}
		}
	}
	/** end work */
	
	/** start profile */
	function getProfile(){
		if (!_profile) {
			return $q.when(_profile_db.get('profile')).then(function(docs){
				_profile = docs;
				_profile.dob = new Date(_profile.dob);
				
				_profile_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onProfileDatabaseChange);
				
				return _profile;
			});
		} else {
			return $q.when(_profile);
		}
	}
	
	function addProfile(dbItem){
		return $q.when( _profile_db.put( dbItem, 'profile' ) );
	};
	
	function updateProfile(dbItem){
		var rev = dbItem._rev;
		var id = dbItem._id;
		
		return $q.when(_profile_db.put( dbItem, id, rev ))
		.then(function(){
			// update revision after updating record with custom ID
			$q.when(_profile_db.get('profile')).then(function(profile){
				dbItem._rev = profile._rev;
			});
		});
	};

	function deleteProfile(dbItem){
		return $q.when( _profile_db.remove( 'profile', dbItem._rev ) );
	};
	
	function onProfileDatabaseChange(change) {
		// var index = findIndex(_profile, change.id);
		var p = _profile;

		if (change.deleted) {
			if (p) {
				// _profile.splice(index, 1); // delete
				_profile_db.remove( change.id, change.doc._rev );
			}
		} else {
			if (p && p._id === change.id) {
				// _profile[index] = change.doc; // update
				// _profile_db.remove( change.id, change.doc._rev );
				_profile = change.doc;
			} else {
				// _profile.splice(index, 0, change.doc) // insert
				// addProfile(change.doc);
			}
		}
	}
	/** end profile */
	
	
	
	/** start education */
	function getEducation(){
		if (!_education) {
			return $q.when(_education_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				_education = docs.rows.map(function(row) {
					return row.doc;
				});
				
				_education_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onEducationDatabaseChange);

				return _education;
			});
		} else {
			return $q.when(_education);
		}
	}
	
	function getEducationById( eduId ){
		return $q.when(_education_db.get(eduId)).then(function(edu){
			return edu;
		});
	}
	
	function addEducation(dbItem, id, rev){
		if( id && rev ){
			return $q.when( _education_db.put( dbItem, id, rev ) );
		}else{
			return $q.when( _education_db.post( dbItem ) );
		}
	};
	
	function updateEducation(dbItem){
		return $q.when( _education_db.put( dbItem ) );
	};

	function deleteEducation(dbItem){
		return $q.when( _education_db.remove( dbItem ) );
	};
	
	function onEducationDatabaseChange(change) {
		var index = findIndex(_education, change.id);
		var p = _education[index];

		if (change.deleted) {
			if( p ){
				_education.splice(index, 1); // delete
			}
		} else {
			if (p && p._id === change.id) {
				_education[index] = change.doc; // update
			} else {
				_education.splice(index, 0, change.doc) // insert
			}
		}
	}
	/** end education */
	
	/** start skill */
	function getSkill(){
		if( !_skill ){
			return $q.when(_skill_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				_skill = docs.rows.map(function(row) {
					return row.doc;
				});
				
				_skill_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onSkillDatabaseChange);

				return _skill;
			});
		} else {
			return $q.when(_skill);
		}
	}
	
	function getSkillById( skillId ){
		return $q.when(_skill_db.get( skillId ));
	}
	
	function addSkill(dbItem){
		return $q.when( _skill_db.post( dbItem ) );
	};
	
	function updateSkill(dbItem){
		return $q.when( _skill_db.put( dbItem, dbItem._id, dbItem._rev ) );
	};

	function deleteSkill(dbItem){
		return $q.when( _skill_db.remove( dbItem ) );
	};
	
	function onSkillDatabaseChange(change) {
		var index = findIndex(_skill, change.id);
		var p = _skill[index];

		if (change.deleted) {
			if( p ){
				_skill.splice(index, 1); // delete
			}
		} else {
			if (p && p._id === change.id) {
				_skill[index] = change.doc; // update
			} else {
				_skill.splice(index, 0, change.doc) // insert
			}
		}
	}
	/** end skill */
	
	/** start parameter */
	function getParameter( docId ){
		/**
		if( !_parameter ){
			return $q.when(_parameter_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				_parameter = docs.rows.map(function(row) {
					return row.doc;
				});
				
				_parameter_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onParameterDatabaseChange);

				return _parameter;
			});
		} else {
			return $q.when(_parameter);
		}
		*/
		
		return $q.when(_parameter_db.get(docId)).then(function(doc){
			return doc;
		});
		
	}
	
	function addParameter(dbItem, id){
		return $q.when( _parameter_db.put( dbItem, id ) );
	};
	
	function updateParameter(dbItem){
		return $q.when( _parameter_db.put( dbItem, dbItem._id, dbItem._rev ) );
	};

	function deleteParameter(dbItem){
		return $q.when( _parameter_db.remove( dbItem ) );
	};
	
	function onParameterDatabaseChange(change) {
		var index = findIndex(_parameter, change.id);
		var p = _parameter[index];

		if (change.deleted) {
			if( p ){
				_parameter.splice(index, 1); // delete
			}
		} else {
			if (p && p._id === change.id) {
				_parameter[index] = change.doc; // update
			} else {
				_parameter.splice(index, 0, change.doc) // insert
			}
		}
	}
	/** end parameter */
	
	/** start token */
	function getToken(){
		if( !_token ){
			return $q.when(_token_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				_token = docs.rows.map(function(row) {
					return row.doc;
				});
				
				_token_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onTokenDatabaseChange);

				return _token;
			});
		} else {
			return $q.when(_token);
		}
	}
	
	function addToken(dbItem){
		return $q.when( _token_db.post( dbItem ) );
	};
	
	function updateToken(dbItem){
		return $q.when( _token_db.put( dbItem ) );
	};

	function deleteToken(dbItem){
		return $q.when( _token_db.remove( dbItem ) );
	};
	
	function onTokenDatabaseChange(change) {
		var index = findIndex(_token, change.id);
		var p = _token[index];

		if (change.deleted) {
			if( p ){
				_token.splice(index, 1); // delete
			}
		} else {
			if (p && p._id === change.id) {
				_token[index] = change.doc; // update
			} else {
				_token.splice(index, 0, change.doc) // insert
			}
		}
	}
	/** end token */
	
	/** start language */
	function getLanguage(){
		if( !_language ){
			return $q.when(_language_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				_language = docs.rows.map(function(row) {
					return row.doc;
				});
				
				_language_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onLanguageDatabaseChange);

				return _language;
			});
		} else {
			return $q.when(_language);
		}
	}
	
	function addLanguage(dbItem){
		return $q.when( _language_db.post( dbItem ) );
	};
	
	function updateLanguage(dbItem){
		return $q.when( _language_db.put( dbItem ) );
	};

	function deleteLanguage(dbItem){
		return $q.when( _language_db.remove( dbItem ) );
	};
	
	function onLanguageDatabaseChange(change) {
		var index = findIndex(_language, change.id);
		var p = _language[index];

		if (change.deleted) {
			if( p ){
				_language.splice(index, 1); // delete
			}
		} else {
			if (p && p._id === change.id) {
				_language[index] = change.doc; // update
			} else {
				_language.splice(index, 0, change.doc) // insert
			}
		}
	}
	/** end language */
	
	/** start application */
	function getApplication(){
		if( !_application ){
			return $q.when(_application_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				_application = docs.rows.map(function(row) {
					return row.doc;
				});
				
				_application_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onApplicationDatabaseChange);

				return _application;
			});
		} else {
			return $q.when(_application);
		}
	}
	
	function addApplication(dbItem){
		return $q.when( _application_db.post( dbItem ) );
	};
	
	function updateApplication(dbItem){
		return $q.when( _application_db.put( dbItem ) );
	};

	function deleteApplication(dbItem){
		return $q.when( _application_db.remove( dbItem ) );
	};
	
	function onApplicationDatabaseChange(change) {
		var index = findIndex(_application, change.id);
		var p = _application[index];

		if (change.deleted) {
			if( p ){
				_application.splice(index, 1); // delete
			}
		} else {
			if (p && p._id === change.id) {
				_application[index] = change.doc; // update
			} else {
				_application.splice(index, 0, change.doc) // insert
			}
		}
	}
	/** end application */
	
	/** start job */
	function getJob(){
		if( !_job ){
			return $q.when(_job_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				_job = docs.rows.map(function(row) {
					return row.doc;
				});
				
				_job_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onJobDatabaseChange);

				return _job;
			});
		} else {
			return $q.when(_job);
		}
	}
	
	function addJob(dbItem, docId){
		return $q.when( _job_db.put( dbItem, docId ) );
	};
	
	function deleteJob(dbItem){
		return $q.when( _job_db.remove( dbItem ) );
	};
	
	function onJobDatabaseChange(change) {
		var index = findIndex(_job, change.id);
		var p = _job[index];

		if (change.deleted) {
			if( p ){
				_job.splice(index, 1); // delete
			}
		} else {
			if (p && p._id === change.id) {
				_job[index] = change.doc; // update
			} else {
				_job.splice(index, 0, change.doc) // insert
			}
		}
	}
	/** end job */
	
	/** start settings */
	function getSettings( key ){
		return $q.when(_settings_db.get(key)).then(function(docs){
			return docs;
		});
	}
	
	function updateSettings(dbItem){
		return $q.when( _settings_db.put(dbItem, dbItem._id, dbItem._rev) );
	}
	
	function addSettings(dbItem, id){
		return $q.when( _settings_db.put( dbItem, id ) );
	};
	/** end settings */
	
}]);