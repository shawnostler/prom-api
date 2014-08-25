var base = process.env.PWD;

var Controller = require(base+'/framework/controller');
var Promise = require(base+'/framework/promise');

function HealthCheckController(config) {
	
	config = config || {};
	
	Controller.call(this,config);
	
}

HealthCheckController.prototype = Object.create(Controller.prototype);
HealthCheckController.prototype.constructor = HealthCheckController;

HealthCheckController.prototype.handle = function (request,response,scope) {
	
	response.statusCode = 200;
	
	response.write('Healthy');
	
	return Promise.resolve(true);
	
};

module.exports = HealthCheckController;