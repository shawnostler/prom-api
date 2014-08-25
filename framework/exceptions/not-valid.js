function NotValidException(config) {
	
	this.content = JSON.stringify(config);
	
}

NotValidException.prototype.statusCode = 400;
NotValidException.prototype.content = 'Not Valid';

module.exports = NotValidException;