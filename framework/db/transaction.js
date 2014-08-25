function Transaction(config) {
	
	this.connection = config.connection;
	
}

Transaction.prototype.commit = function () {
	
	return this.connection.commit();
	
};

Transaction.prototype.rollback = function () {
	
	return this.connection.rollback();
	
};

module.exports = Transaction;