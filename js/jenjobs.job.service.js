angular.module('jenjobs.services', [])
.factory('JobSearch', function($q, $http, JsDatabase, $ionicLoading){
	var _jobs = {},
	_job,
	_job_db,
	_bookmark_db,
	
	_application,
	_application_db;
	
	_jobs[323687] = {
		advertiser: false,
		company: "CPI (Penang) Sdn Bhd",
		company_id: 6930,
		date_closed: new Date('2015-08-08'),
		date_posted: new Date('2015-11-08'),
		description: "<ul><li>general clerical duties</li><li>simple accounting</li><li>filing administration</li><li>computer skills</li></ul>",
		education: "Professional Certificate/Qualification or Secondary School/\"O\" Level/SPM in Finance/Accountancy/Banking or equivalent field",
		industry: "Manufacturing / Production",
		language: "Chinese",
		latitude: "0.00000000",
		level: "Entry Level",
		location: "Penang > Bayan Lepas",
		longitude: "0.00000000",
		post_id: 323687,
		recruitment_agency: false,
		salary_max: 2000,
		salary_min: 1000,
		show_salary: false,
		skills: "filing administration",
		specialisation: "Accounting & Auditing > General Cost Accounting & Bookkeeping",
		summary: "general clerical duties simple accounting filing administration computer skills",
		title: "Accounts Clerk",
		type: "Permanent",
		vacancy: 1,
		year_exp: 1,
		company_details: {
			emp_profile_id: 6930,
			industry_id: 76,
			company: "CPI (Penang) Sdn Bhd",
			registration_no: "191708-P",
			tel: "(+60)04-6476788",
			fax: "(+60)04-6444686",
			email: "anntan@cpi.com.my",
			website: "www.cpi.com.my",
			fb_page: "",
			logo_file: "CPI.jpg",
			header_file: null,
			work_hour: "",
			overview: "CPI was established in January 1990 and situated in the Bayan Lepas Industrial Zone, Phase 4 Penang. CPI utilizes the latest TOSHIBA & NISSEI Injection Moulding Machines with robotics arm controlled systems. These include the latest Injection Moulding Machines, which is the \"UH 1000 Series\" of Super Precision Ultra High Speed & Pressure Injection Moulding Systems (for Super - Thin Wall & Long Flow precision parts) which have the following features:-\r\n\r\n- 10 times injection speed than the ordinary machine.\r\n- Build in \"SPC\" control on moulding conditions. \r\n\r\nAs of today, CPI has produced over 1000 items of different products for various industries such as Telecommunication, Computer, Electrical & Electronics, Automotive, Leisure Marine Industry and also other Industrial plastics parts, that caters for local and as well as export market such as the United Kingdom, Australia, Germany, Switzerland, U.S.A, Italy, Japan, China, Taiwan and Indonesia. \r\n\r\nWe invite applications for the following position:-\r\n",
			info: "\u0000",
			lat: "5.32692390",
			lon: "100.27474810",
			map_image: null
		}
	};
	
	/*
	STATUS_UNPROCESSED = 0;
	STATUS_SHORTLISTED = 1;
	STATUS_INTERVIEW = 2;
	STATUS_UNKNOWN = 3;
	STATUS_REJECTED = 4;
	STATUS_CLOSE = 5;
	STATUS_KIV = 6;
	STATUS_INVITED = 7;
	STATUS_INVITATION_REJECTED = 8;
	STATUS_PRE_SCREENED = 9;
	STATUS_WITHDRAWN = 10;
	STATUS_HIRED = 11;
	*/
	
	var applicationStatus = ['Unprocessed', 'Shortlisted', 'Interview', 'Unknown', 'Rejected', 'Close', 'KIV', 'Invited', 'Invitation Rejected', 'Pre-Screened', 'Withdraw', 'Hired'];
	
	return {
		initDB: initDB,
		search: searchJob,
		get: function( jobId ) {
			if( _jobs[jobId] ){
				return _jobs[jobId];
			}
			return null;
		},
		
		getJob: getJob,
		deleteJob: deleteJob,
		
		bookmarkJob: bookmarkJob,
		deleteBookmark: deleteBookmark,
		
		apply: apply
	};
	
	function initDB(){
		_job_db = new PouchDB('job', {adapter: 'websql'});
		_bookmark_db = new PouchDB('bookmark', {adapter: 'websql'});
		_application_db = new PouchDB('application', {adapter: 'websql'});
	}
	
	// search the fetched jobs
	function searchJob( filter ){
		var param = {};
		param.page = 1;
		param.o = 'date_posted';
		
		if( filter ){
			if( filter.keyword ){
				param.keyword = filter.keyword;
			}
		}
		
		return $http({
			method: 'GET',
			url: 'http://api.jenjobs.local/jobs/search',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			},
			params: param
		}).then(function(response){
			if( response.status == 200 ){
				angular.forEach(response.data.items, function(e,i){
					response.data.items[i].date_closed = new Date(e.date_closed);
					response.data.items[i].date_posted = new Date(e.date_posted);
					
					response.data.items[i].advertiser = e.advertiser == "true" ? true : false;
					response.data.items[i].recruitment_agency = e.recruitment_agency == "true" ? true : false;
					response.data.items[i].show_salary = e.show_salary == "true" ? true : false;
					
					_jobs[response.data.items[i].post_id] = response.data.items[i];
				});
				return _jobs;
			}else{
				return [];
			}
		}).catch(function(e){
			$ionicLoading.show({
				template: 'Data synchronization failed!',
				noBackdrop: true,
				duration: 1500
			});
		});
	}
	
	// search local db for jobs by id
	function getJob( jid ){
		if( jid ){
			return $q.when(_job_db.get(jid)).then(function(docs){
				_job = docs;
				_job.date_closed = new Date(_job.date_closed);
				_job.date_posted = new Date(_job.date_posted);
				
				_job_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onProfileDatabaseChange);
				
				return _job;
			});
		}else{
			return $q.when(_job_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				_job = docs.rows.map(function(row) {
					row.doc.date_closed = new Date(row.doc.date_closed);
					row.doc.date_posted = new Date(row.doc.date_posted);
					return row.doc;
				});
				
				_job_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onProfileDatabaseChange);

				return _job;
			});
		}
	}
	
	function onProfileDatabaseChange(change) {
		change.doc;
		change.id;
	}
	
	function deleteJob(){}
	
	// bookmark
	function bookmarkJob( jid ){
		return $q.when( _bookmark_db.put({on:new Date()}, jid));
	}
	
	function deleteBookmark( jid, rev ){
		return $q.when( _bookmark_db.remove( jid, rev ) );
	};
	// bookmark
	
	// application
	function apply(){
		$q.when( _application_db.put({
			on: new Date(),
			status: 0
		}, jid));
	}
	
	function withdraw( application ){
		$q.when( _application_db.put({
			on: new Date(),
			status: 10
		}, application.jid, application.rev));
	}
	
	function getApplication( appId ){
		if( appId ){
			return $q.when(_application_db.get(appId)).then(function(docs){
				_application = docs;
				_application.on = new Date(_application.on);
				
				_application_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onProfileDatabaseChange);
				
				return _application;
			});
		}else{
			return $q.when(_application_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				_application = docs.rows.map(function(row) {
					row.doc.date_closed = new Date(row.doc.date_closed);
					row.doc.date_posted = new Date(row.doc.date_posted);
					return row.doc;
				});
				
				_application_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onProfileDatabaseChange);

				return _application;
			});
		}
	}
	// application
});