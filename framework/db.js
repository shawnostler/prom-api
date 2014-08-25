var Connection = require('./db/connection');

function Db(config) {
	
	this.adapter = config.adapter;
	
}

Db.prototype.connection = function () {
	
	return this.adapter.connection();
	
};

module.exports = Db;