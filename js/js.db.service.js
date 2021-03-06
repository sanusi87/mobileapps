angular.module('jenjobs.db', [])
.factory('JsDatabase', ['$q', '$filter', 'JobseekerLogin', 'JobSearch', function($q, $filter, JobseekerLogin, JobSearch){
	var _work_db, // js work
	_profile_db, // js profile
	_education_db, // js education
	_skill_db, // js skills
	_language_db, // js skills
	_parameter_db, // jenjobs variables
	_token_db, // access token
	//_application_db,
	_settings_db,

	_work,
	_profile,
	_education,
	_skill,
	_language,
	_parameter,
	_token,
	//_application,
	_settings;

	var connectionType = 'UNDEFINED';

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

		getSettings: getSettings,
		updateSettings: updateSettings,
		addSettings: addSettings,
		deleteSettings: deleteSettings,

		updateCompleteness: updateCompleteness,
		//updateAll: updateAll,

		setConnectionType: setConnectionType,
		getConnectionType: getConnectionType,
		connectionType: connectionType,
		checkNetworkConnection: checkNetworkConnection,
		periodicallyCheckNetworkConnection: periodicallyCheckNetworkConnection,
		vibrateDevice: vibrateDevice
	};

	function initDB(){
		_work_db = new PouchDB('work', {adapter: 'websql'});
		_profile_db = new PouchDB('profile', {adapter: 'websql'});
		_education_db = new PouchDB('education', {adapter: 'websql'});
		_parameter_db = new PouchDB('parameter', {adapter: 'websql'});
		_token_db = new PouchDB('token', {adapter: 'websql'});
		_skill_db = new PouchDB('skill', {adapter: 'websql'});
		_language_db = new PouchDB('language', {adapter: 'websql'});
		//_application_db = new PouchDB('application', {adapter: 'websql'});

		_settings_db = new PouchDB('settings', {adapter: 'websql'});
		$q.when( _settings_db.bulkDocs([
			{_id: 'sms_job_alert', value:0},
			// {_id: 'email_alert', value:0},
			{_id: 'notification_alert', value:0},

			{_id: 'newsletter_alert', value:0},
			{_id: 'promotion_alert', value:0},

			{_id: 'attachedResume', value:0},
			{
				_id: 'completeness',
				workExp:false,
				education:false,
				profile:false,
				jobseek:false,
				jobPref:false,
				attachment:false,
				language: false
			}
		]) );
	};

	// checking for network connection
	function setConnectionType( _connectionType ){
		connectionType = _connectionType;
	}

	function getConnectionType(){
		return connectionType;
	}

	// https://cordova.apache.org/docs/en/3.1.0/cordova/connection/connection.html
	function checkNetworkConnection(){
		if( navigator ){
			if( navigator.connection ){
				setConnectionType(navigator.connection.type);
			}else{
				setConnectionType('none');
				var i=0;
				var intv = setInterval(function(){
					if( navigator.connection && navigator.connection.type ){
						setConnectionType(navigator.connection.type);
						clearInterval(intv);
					}else{
						// try for 10 seconds, then stop
						if( i >= 10 ){
							clearInterval(intv);
						}
					}
					i++;
				}, 1000);
			}
		}
	}

	function periodicallyCheckNetworkConnection(){
		setInterval(function(){
			// console.log('checking network...');
			var _connectionType = 'none';
			if( navigator ){
				if( navigator.connection ){
					_connectionType = navigator.connection.type;
				}
			}
			setConnectionType( _connectionType );
			// connectionType = _connectionType;
			// console.log(connectionType);
		}, 5000);
	}
	// end checking

	// vibrate the device
	function vibrateDevice(){
		// https://cordova.apache.org/docs/en/3.0.0/cordova/notification/notification.html#link-1
		// vibrate the device
		if( navigator.vibrate ){
			navigator.vibrate(2000);
		}
	}
	// vibrate the device

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
				_profile.dob = (_profile.dob != null && _profile.dob != '') ? new Date(_profile.dob) : '';

				_profile_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', function(){});

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

		// add date updated for sync
		dbItem.date_updated = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss');

		return $q.when(_profile_db.put( dbItem, id, rev ))
		.then(function(){
			// update revision after updating record with custom ID
			return $q.when(_profile_db.get('profile')).then(function(profile){
				dbItem._rev = profile._rev;
				return true;
			}).catch(function(e){
				return false;
			});
		});
	};

	function deleteProfile(dbItem){
		return $q.when( _profile_db.remove( 'profile', dbItem._rev ) );
	};
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

	function addEducation(dbItem){
		return $q.when( _education_db.post( dbItem ) );
	};

	function updateEducation(dbItem){
		return $q.when( _education_db.put( dbItem, dbItem._id, dbItem._rev ) );
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
				}).on('change', function(){});

				return _language;
			});
		} else {
			return $q.when(_language);
		}
	}

	function getLanguageById( skillId ){
		return $q.when(_language_db.get( skillId ));
	}

	function addLanguage(dbItem){
		return $q.when( _language_db.post( dbItem ) );
	};

	function updateLanguage(dbItem){
		return $q.when( _language_db.put( dbItem, dbItem._id, dbItem._rev ) );
	};

	function deleteLanguage(dbItem){
		return $q.when( _language_db.remove( dbItem ) );
	};

	// function onLanguageDatabaseChange(change) {
	// 	var index = findIndex(_language, change.id);
	// 	var p = _language[index];
	//
	// 	if (change.deleted) {
	// 		if( p ){
	// 			_language.splice(index, 1); // delete
	// 		}
	// 	} else {
	// 		if (p && p._id === change.id) {
	// 			_language[index] = change.doc; // update
	// 		} else {
	// 			_language.splice(index, 0, change.doc) // insert
	// 		}
	// 	}
	// }
	/** end language */

	/** start parameter */
	function getParameter( docId ){
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
			}).catch(function(err){
				return false;
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

	function deleteSettings(){
		return $q.when(_settings_db.allDocs({ include_docs: true}))
		.then(function(docs) {
			angular.forEach(docs.rows, function(e,i){
				_settings_db.remove( e.doc._id, e.doc._rev );
			});
			return;
		}).then(function(){
			// restore default
			_settings_db.bulkDocs([
				{_id: 'sms_job_alert', value:0},
				{_id: 'email_alert', value:0},
				{_id: 'notification', value:0},
				{_id: 'attachedResume', value:0},
				{
					_id: 'completeness',
					workExp:false,
					education:false,
					profile:false,
					jobseek:false,
					jobPref:false,
					attachment:false,
					language: false
				}
			]);
		});
	}

	function updateCompleteness(key, status){
		return $q.when(_settings_db.get('completeness')).then(function(d){
			// console.log(d);
			d[key] = status;

			_settings_db.put(d, d._id, d._rev)
			.then(function(a){
				// console.log(key+' completeness updated');
				// console.log(a);
			}).catch(function(e){
				// console.log('failed to update completeness for '+key);
				// console.log(e);
			});
		});
	}
	/** end settings */

	// use for data synchronisation
	/*
	function updateAll(){
		getToken().then(function(token){
			JobseekerLogin.setAccessToken(token[0].access_token, function(){
				JobseekerLogin.downloadProfile(function(response){
					if( !response.error ){
						delete(response.data._links);
						response.data.no_work_exp = response.data.no_work_exp == 0 ? false : true;
						var completedItems = [];

						getProfile().then(function(profile){
							deleteProfile(profile).then(function(){
								addProfile(response.data).then(function(){
									if( response.data.mobile_no && response.data.dob ){
										completedItems.push('profile');
									}

									if( response.data.resume_file && response.data.resume_file.length > 5 ){
										completedItems.push('attachment');
									}

									if( response.data.availability ){
										completedItems.push('jobseek');
									}

									JobseekerLogin.downloadApplication(function(response){
										if( !response.error ){
											// delete prev application before adding new
											JobSearch.deleteAllApplication().then(function(){
												// deleted
												if( response.data.length > 0 ){
													angular.forEach(response.data, function(value, i){
														value._id = String(value.post_id);
														JobSearch.apply(value).then(function(doc){
															// console.log(doc);
														}).catch(function(err){
															// console.log(err);
														});
													});
												}

												JobseekerLogin.downloadWorkExperience(function(response){
													if( !response.error ){
														// delete existing work exp
														var works = [];
														JsDatabase.getWork().then(function(_works){
															works = _works;
															deleteWorkExp();
														}).catch(function(e){
															console.log(e);
															saveNewWorkExp();
														});

														// using loop to delete to make sure that all data has been deleted before adding new data
														function deleteWorkExp(){
															if( works.length > 0 ){
																JsDatabase.deleteWork(works[0]).then(function(){
																	works.splice(0,1);
																	deleteWorkExp();
																});
															}else{
																saveNewWorkExp();
															}
														}

														function saveNewWorkExp(){
															if( response.data.length > 0 ){
																angular.forEach(response.data, function(value, i){
																	JsDatabase.addWork(value);
																});
																completedItems.push('workExp');
															}

															JobseekerLogin.downloadQualification(function(response){
																if( !response.error ){
																	function deleteEdu(){

																	}

																	function saveNewEdu(){

																	}

																	if( response.data.length > 0 ){
																		angular.forEach(response.data, function(value, i){
																			JsDatabase.addEducation(value);
																		});
																		completedItems.push('education');
																	}


















																}
															});
														}
													}
												});
											}).catch(function(err){
												console.log(err);
											});
										}
									})
								});
							}).catch(function(err){
								console.log(err);
							});
						}).catch(function(err){
							console.log(err);
						});
					}
				});
			});
		}).catch(function(err){
			console.log(err);
		});
	}
	*/
}]);
