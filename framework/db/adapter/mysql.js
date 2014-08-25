var mysql = require('mysql');

var Connection = require('../connection');
var Promise = require('../../promise');
var Transaction = require('../transaction');

/**
*	var config = {
*		connectionLimit: 10,
*		host: 'localhost',
*		port: 3306,
*		user: 'inclusivedv',
*		password: 'inclusivedv',
*		database: 'inclusivedv_development'
*	};
*/
function MysqlAdapter(config) {
	
	this.pool = mysql.createPool(config);
	
}

MysqlAdapter.prototype.commit = function (connection) {
	
	return new Promise(function (resolve,reject) {
		
		connection.connection.commit(function (err) {
			
			connection.transaction = undefined;
			
			if (err) {
				
				connection.connection.rollback(function () {
					
					return reject(err);
					
				});
				
			}
			
			return resolve(true);
			
		});
		
	});
	
};

MysqlAdapter.prototype.connection = function () {
	
	var adapter = this;
	
	return new Promise(function (resolve,reject) {
		
		this.pool.getConnection(function (err,con) {
			
			if (err) {
				
				return reject(err);
				
			}
			
			var connection = new Connection({
				adapter: this,
				connection: con
			});
			
			return resolve(connection);
			
		});
		
	});
	
};

MysqlAdapter.prototype.query = function (query,connection) {
	
	return new Promise(function (resolve,reject) {
		
		connection.query(query,function (err,res) {
			
			if (err) {
				
				return reject(err);
				
			}
			
			return resolve(res);
			
		});
		
	});
	
};

MysqlAdapter.prototype.rollback = function (connection) {
	
	return new Promise(function (resolve,reject) {
		
		connection.transaction = undefined;
		
		connection.connection.rollback(function () {
			
			return resolve(true);
			
		});
		
	});
	
};

MysqlAdapter.prototype.transaction = function (options,connection) {
	
	var adapter = this;
	
	return new Promise(function (resolve,reject) {
		
		connection.beginTransaction(options,function (err) {
			
			var transaction;
			
			if (err) {
				
				return reject(err);
				
			}
			
			transaction = new Transaction({
				connection: connection
			});
			
			return resolve(transaction);
			
		});
		
	});
	
};

module.exports = MysqlAdapter;