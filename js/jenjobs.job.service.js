angular.module('jenjobs.services', [])
.factory('JobSearch', function($q, $http, JsDatabase, $ionicLoading){
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
		applicationStatus: applicationStatus
	};

	function initDB(){
		_job_db = new PouchDB('job', {adapter: 'websql'});
		_bookmark_db = new PouchDB('bookmark', {adapter: 'websql'});
		_application_db = new PouchDB('application', {adapter: 'websql'});
	}

	// search the fetched jobs
	function searchJob( filter ){
		// handle the filter
		var param = {};
		param.page = 1;
		param.o = 'date_posted';

		if( filter ){
			if( filter.keyword ){
				param.keyword = filter.keyword;
			}
		}

		// fetch jobs from live web server
		return $http({
			method: 'GET',
			url: 'http://api.jenjobs.local/jobs/search',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			params: param
		}).then(function(response){
			// console.log(response);
			if( response.status == 200 ){
				_jobs = {};
				angular.forEach(response.data, function(e,i){
					response.data[i].date_closed = new Date(e.date_closed);
					// response.data[i].date_posted = new Date(e.date_posted);
					// response.data[i].advertiser = e.advertiser == "true" ? true : false;
					// response.data[i].recruitment_agency = e.recruitment_agency == "true" ? true : false;
					response.data[i].salary_display = e.salary_display == "true" ? true : false;

					// we populate each job into _job object, to simplify our search later
					_jobs[response.data[i].post_id] = response.data[i];
				});
				return _jobs;
			}else{
				return [];
			}
		}).catch(function(e){
			// display alert if ajax failed
			$ionicLoading.show({
				template: 'Data synchronization failed!',
				noBackdrop: true,
				duration: 1500
			});
		});
	}

	function getJobDetails( param ){

		var requestUrl = 'http://api.jenjobs.local/jobs/search/'+param.post_id;
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
			console.log(response);
			if( response.status == 200 ){
				response.data.date_closed = new Date(response.data.date_closed);
				response.data.date_posted = new Date(response.data.date_posted);
				return response.data;
			}
			return {};
		});
	}

	// bookmark
	function bookmarkJob( items, accessToken ){
		console.log('bookmarking...');
		console.log(items);
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
					url: 'http://api.jenjobs.local/jobseeker/bookmark',
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					params: param,
					data: data
				}).then(function(response){
					console.log(response);
				}).catch(function(err){
					console.log('http error');
					console.log(err);
				});
			}

			return doc;
		}).catch(function(e){
			console.log('local save error');
			console.log(e);
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
					url: 'http://api.jenjobs.local/jobseeker/bookmark/'+jid,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					params: param
				}).then(function(response){
					console.log(response);
				}).catch(function(err){
					console.log(err);
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
		console.log(application);
		return $q.when( _application_db.put( application, application.post_id ) )
		.then(function(doc){
			if( accessToken ){
				return $http({
					method: 'POST',
					url: 'http://api.jenjobs.local/jobseeker/application/'+application.post_id,
					headers: {
						'Accept': 'application/json',
						'Content-Type': 'application/json'
					},
					data: {},
					params: {
						'access-token': accessToken
					}
				}).then(function(response){
					console.log(response);
					return response;
				});
			}
			return {};
		}).catch(function(e){
			console.log(e);
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
						console.log(e);
					});
				});
			}
		});
	}
});
