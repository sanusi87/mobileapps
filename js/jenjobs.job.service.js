angular.module('jenjobs.services', [])
.factory('JobSearch', function($q, $http, $ionicLoading){
	var _jobs = {},
	//_job,
	_job_db,
	_bookmark_db,

	_application,
	_application_db;

	var applicationStatus = ['Unprocessed', 'Shortlisted', 'Interview', 'Unknown', 'Rejected', 'Close', 'KIV', 'Invited', 'Invitation Rejected', 'Pre-Screened', 'Withdraw', 'Hired'];

	return {
		initDB: initDB,
		search: searchJob,
		get: getJobDetails,

		// getJob: getJob,
		deleteJob: deleteJob,
		deleteAllJob: deleteAllJob,
		saveJob: saveJob,

		getBookmark: getBookmark,
		getBookmarks: getBookmarks,
		bookmarkJob: bookmarkJob,
		deleteBookmark: deleteBookmark,
		deleteAllBookmark: deleteAllBookmark,

		apply: apply,
		checkApplication: checkApplication,
		deleteAllApplication: deleteAllApplication,
		getApplication: getApplication,
		applicationStatus: applicationStatus,
		getSavedJob: getSavedJob
	};

	function initDB(){
		_job_db = new PouchDB('job', {adapter: 'websql'});
		_bookmark_db = new PouchDB('bookmark', {adapter: 'websql'});
		_application_db = new PouchDB('application', {adapter: 'websql'});
	}

	// search the fetched jobs
	function searchJob( filter, callback ){
		// handle the filter
		var param = {};
		param.page = 1;
		param.o = 'date_posted';

		if( filter ){
			/*
			relevance - Sort by relevance
			date_posted - Sort by date posted
			job_location - Sort by location
			company_name - Sort by employers' name
			title - Sort by job title
			*/
			param.o = 'date_posted';
			// param.b = 'DESC';

			// keyword
			if( filter.keyword ){
				param.keyword = filter.keyword;
				param.o = 'relevance';
			}

			if( filter.page ){ param.page = filter.page; } // pagination

			// if( filter.o ){ param.o = filter.o; } // order
			// if( filter.b ){ param.b = filter.b; } // by

			// 1 = Position Title
			// 2 = Company Name
			// 3 = Skills
			// 4 = Job Description
			if( filter.search_by ){ param.search_by = filter.search_by; }

			if( filter.emid ){ param.emid = filter.emid; }

			if( filter.job_level_id ){
				param['job_level_id[]'] = [];
				angular.forEach(filter.job_level_id, function(e,i){
					param['job_level_id[]'].push(e);
				});
			}

			if( filter.industry_id ){ param.industry_id = filter.industry_id; }

			// multiple
			if( filter.job_spec_id ){
				param['job_spec_id[]'] = [];
				angular.forEach(filter.job_spec_id, function(e,i){
					param['job_spec_id[]'].push(e);
				});
			}
			if( filter.job_role_id ){
				param['job_role_id[]'] = [];
				angular.forEach(filter.job_role_id, function(e,i){
					param['job_role_id[]'].push(e);
				});
			}

			if( filter.country_id ){
				param['country_id[]'] = [];
				angular.forEach(filter.country_id, function(e,i){
					param['country_id[]'].push(e);
				});
			}

			if( filter.state_id ){
				param['state_id[]'] = [];
				angular.forEach(filter.state_id, function(e,i){
					param['state_id[]'].push(e);
				});
			}

			if( filter.job_type_id ){
				param['job_type_id[]'] = [];
				angular.forEach(filter.job_type_id, function(e,i){
					param['job_type_id[]'].push(e);
				});
			}

			if( filter.salary_min ){ param.salary_min = filter.salary_min; }
			if( filter.salary_max ){ param.salary_max = filter.salary_max; }
			if( filter.seostate ){ param.seostate = filter.seostate; }
			if( filter.advertiser ){ param.advertiser = filter.advertiser; }
			if( filter.direct_employer ){ param.direct_employer = filter.direct_employer; }
		}

		// fetch jobs from live web server
		_jobs = {};
		return $http({
			method: 'GET',
			url: 'http://api.jenjobs.com/jobs/search',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			params: param
		}).then(function(response){
			if( response.status == 200 ){
				angular.forEach(response.data.data, function(e,i){
					response.data.data[i].date_closed = new Date(e.date_closed);
					// response.data[i].date_posted = new Date(e.date_posted);
					// response.data[i].advertiser = e.advertiser == "true" ? true : false;
					// response.data[i].recruitment_agency = e.recruitment_agency == "true" ? true : false;
					response.data.data[i].salary_display = e.salary_display == 1 ? true : false;

					// we populate each job into _job object, to simplify our search later
					_jobs[response.data.data[i].post_id] = response.data.data[i];
				});
			}

			if( callback ){
				callback();
			}

			return _jobs;
		}).catch(function(e){
			// display alert if ajax failed
			$ionicLoading.show({
				template: 'Sorry, we failed to fetch the jobs listing!',
				noBackdrop: true,
				duration: 1500
			});

			if( callback ){
				callback();
			}
		});
	}

	function getJobDetails( param ){

		var requestUrl = 'http://api.jenjobs.com/jobs/search/'+param.post_id;
		if( param.closed == 1 ){
			requestUrl += '?closed=1';
		}

		return $http({
			method: 'GET',
			url: requestUrl,
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
		}).then(function(response){
			// console.log(response);
			if( response.status == 200 ){
				response.data.date_closed = new Date(response.data.date_closed);
				response.data.date_posted = new Date(response.data.date_posted);
				response.data.salary_display = response.data.show_salary == "true" ? true : false;
				response.data.advertiser = response.data.advertiser == "true" ? true : false;

				response.data.longitude = Number(response.data.longitude);
				response.data.latitude = Number(response.data.latitude);

				return response.data;
			}
			return {};
		});
	}

	// bookmark
	function bookmarkJob( items, accessToken ){
		// console.log('bookmarking...');
		// console.log(items);
		return $q.when( _bookmark_db.put({
			_id: String(items.post_id),
			on: items.on ? items.on : new Date(),
			title: items.title,
			date_closed: items.date_closed
		})).then(function(doc){
			if( accessToken ){
				var param = {},
				data = {};

				param['access-token'] = accessToken;
				data.post_id = items.post_id;

				$http({
					method: 'POST',
					url: 'http://api.jenjobs.com/jobseeker/bookmark',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					params: param,
					data: data
				}).then(function(response){
					// console.log(response);
				}).catch(function(err){
					// console.log('http error');
					// console.log(err);
				});
			}

			return doc;
		}).catch(function(e){
			// console.log('local save error');
			// console.log(e);
			return {};
		});
	}

	function deleteBookmark( jid, rev, accessToken ){
		return $q.when( _bookmark_db.remove( String(jid), rev ) ).then(function(doc){
			if( accessToken ){
				var param = {};
				param['access-token'] = accessToken;
				$http({
					method: 'DELETE',
					url: 'http://api.jenjobs.com/jobseeker/bookmark/'+jid,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					params: param
				}).then(function(response){
					// console.log(response);
				}).catch(function(err){
					// console.log(err);
				});
			}
			return doc;
		});
	};

	function getBookmarks(){
		return $q.when(_bookmark_db.allDocs({ include_docs: true}))
		.then(function(docs){
			if( docs.rows.length > 0 ){
				bookmarks = docs.rows.map(function(row) {
					row.doc.on = new Date(row.doc.on);
					row.doc.date_closed = new Date(row.doc.date_closed);
					return row.doc;
				});
				return bookmarks;
			}
			return;
		})
	}

	function getBookmark( jid ){
		return $q.when(_bookmark_db.get(jid)).then(function(docs){
			return docs;
		});
	}
	// bookmark

	/**
	application = {
		id: xxx,
		post_id: xxx,
		date_created: xxx,
		status: xxx
	}
	*/
	function apply( application, accessToken ){
		// console.log(application);
		return $q.when( _application_db.put( application, application.post_id ) )
		.then(function(doc){
			if( accessToken ){
				return $http({
					method: 'POST',
					url: 'http://api.jenjobs.com/jobseeker/application/'+application.post_id,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					data: {},
					params: {
						'access-token': accessToken
					}
				}).then(function(response){
					// console.log(response);
					return response;
				});
			}
			return {};
		}).catch(function(e){
			// console.log(e);
		});
	}

	function withdraw( application ){
		application.status = 10;
		$q.when( _application_db.put(application, application._id, application._rev));
	}

	function getApplication( appId ){
		if( appId ){
			return $q.when(_application_db.get(appId)).then(function(docs){
				_application = docs;
				_application.date_created = new Date(_application.date_created);

				_application_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', function(){});

				return _application;
			});
		}else{
			return $q.when(_application_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				_application = docs.rows.map(function(row) {
					row.doc.date_created = new Date(row.doc.date_created);
					return row.doc;
				});

				_application_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', function(){});

				return _application;
			});
		}
	}

	function checkApplication( appId ){
		return $q.when(_application_db.get(appId)).then(function(docs){
			return docs;
		}).catch(function(err){
			return false;
		});
	}
	// application

	// save/d jobs for later reference, after 1)bookmarked/2)applied
	function saveJob( job ){
		job._id = String(job.post_id); // set the post_id to be doc_id
		return $q.when( _job_db.put(job))
		.then(function(doc){
			job._rev = doc.rev;
			return doc;
		});
	}

	function getSavedJob( id ){
		return $q.when(_job_db.get(id)).then(function(job){
			return job;
		});
	}

	// delete saved jobs
	function deleteJob( job ){
		return $q.when( _job_db.remove( job._id, job._rev ) )
		.then(function(doc){
			job._rev = doc.rev;
			return doc;
		});
	}

	function deleteAllJob(){
		return $q.when(_job_db.allDocs({ include_docs: true}))
		.then(function(docs){
			if( docs.rows.length > 0 ){
				angular.forEach(docs.rows, function(e,i){
					_job_db.remove(e.doc._id, e.doc._rev);
				});
			}
		});
	}

	function deleteAllBookmark(){
		return $q.when(_bookmark_db.allDocs({ include_docs: true}))
		.then(function(docs){
			if( docs.rows.length > 0 ){
				angular.forEach(docs.rows, function(e,i){
					_bookmark_db.remove(e.doc._id, e.doc._rev);
				});
			}
		});
	}

	function deleteAllApplication(){
		return $q.when(_application_db.allDocs({ include_docs: true}))
		.then(function(docs){
			if( docs.rows.length > 0 ){
				angular.forEach(docs.rows, function(e,i){
					$q.when(_application_db.remove(e.doc._id, e.doc._rev)).then(function(a){
						return a;
					}).catch(function(e){
						// console.log(e);
					});
				});
			}
		});
	}
})

.factory('Profile', ['$http', function($http, JsDatabase){
	var profile;

	return {
		updateNoWorkExp: updateNoWorkExp
	};

	function updateNoWorkExp(status){
		JsDatabase.getProfile().then(function(profile){
			profile = profile;

			profile.no_work_exp
		});
	}
}])
