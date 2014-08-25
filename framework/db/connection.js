var Transaction = require('./transaction');

function Connection(config) {
	
	this.adapter = config.adapter;
	this.connection = config.connection;
	this.transaction = undefined;
	
}

Connection.prototype.commit = function () {
	
	if (this.transaction) {
		
		return this.adapter.commit(this);
		
	} else {
		
		return Promise.resolve(this);
		
	}
	
};

Connection.prototype.query = function (query) {
	
	return this.adapter.query(query);
	
};

Connection.prototype.release = function () {
	
	return this.connection.release();
	
};

Connection.prototype.rollback = function () {
	
	if (this.transaction) {
		
		return this.adapter.rollback(this);
		
	} else {
		
		return Promise.resolve(this);
		
	}
	
};

Connection.prototype.transaction = function (options) {
	
	var connection = this;
	
	if (connection.transaction) {
		
		return Promise.resolve(connection.transaction);
		
	} else {
		
		return connection.adapter.transaction(options,connection).then(function (transaction) {
			
			connection.transaction = transaction;
			
			return transaction;
			
		});
		
	}
	
};

module.exports = Connection;