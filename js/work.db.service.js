angular.module('jenjobs.db', [])
.factory('WorkDatabase', ['$q', function($q){
	var _work_db;
	var _work;
	
	return {
		initDB: initDB,
		
		// We'll add these later.
		getWork: getWork,
		addWork: addWork,
		updateWork: updateWork,
		deleteWork: deleteWork
	};
	
	function initDB(){
		// Creates the database or opens if it already exists
		// _work_db = new PouchDB('work');
		_work_db = new PouchDB('work', {adapter: 'websql'});
	};
	
	// profile start
	// get saved profile from local database
	function getWork(){
		// console.log(_work);
		// console.log(_work_db);
		
		// _work_db.info().then(console.log.bind(console));
		
		if (!_work) {
			return $q.when(_work_db.allDocs({ include_docs: true}))
			.then(function(docs) {
				// console.log(docs);
				
				// Each row has a .doc object and we just want to send an 
				// array of birthday objects back to the calling controller,
				// so let's map the array to contain just the .doc objects.

				// _work = docs.rows;
				_work = docs.rows.map(function(row) {
					// Dates are not automatically converted from a string.
					// row.doc.Date = new Date(row.doc.Date);
					return row.doc;
				});
				
				// Listen for changes on the database.
				_work_db.changes({
					live: true,
					since: 'now',
					include_docs: true
				}).on('change', onDatabaseChange);

				return _work;
			});
		} else {
			// Return cached data as a promise
			return $q.when(_work);
		}
	}
	
	function addWork(dbItem){
		return $q.when( _work_db.post( dbItem ) );
	};
	
	function updateWork(dbItem){
		return $q.when( _work_db.put( dbItem ) );
	};

	function deleteWork(dbItem){
		return $q.when( _work_db.remove( dbItem ) );
	};
	
	function onDatabaseChange(change) {
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