var Promise = require('bluebird');

var Exception = require('./exception');
var Exceptions = require('./exceptions');

function Model(config) {
	
	this.attributes = config.attributes || {};
	this._deleted = false;
	this._modified = {};
	this.new = false;
	this._original = config.data || {};
	this._primary = config.primary || [];
	this._privileges = [];
	this._resourceId = config.resourceId;
	this.service = config.service;
	
	if (config.new) {
		
		this.new = true;
		
		for (var i in this.attributes) {
			
			if (undefined !== this.attributes[i].default) {
				
				//console.log('Model',i);
				
				this._modified[i] = this.attributes[i].default;
				
			}
			
		}
		
	}
	
}

Model.prototype.delete = function (scope,bypass) {
	
	var model = this;
	
	return this.service.delete(model,scope,bypass).then(function (result) {
		
		return model.deleted();
		
	});
	
};

Model.prototype.deleted = function () {
	
	this._deleted = true;
	
	return this;
	
};

Model.prototype.diff = function () {
	
	var diff = {};
	
	for (var i in this._modified) {
		
		if (this._modified[i] != this._original[i]) {
			
			diff[i] = this._modified[i];
			
		}
		
	}
	
	return diff;
	
};

Model.prototype.get = function (attribute,scope,bypass) {
	
	var model = this, promise;
	
	if (bypass) {
		
		promise = Promise.resolve(true);
		
	} else {
		
		promise = this.service.acl.isAllowed(model,attribute+'::get',scope);
		
	}
	
	return promise.then(function () {
		
		var value = model._modified[attribute];
		
		//console.log('Model.get',attribute,value);
		
		if (undefined === value) {
			
			value = model._original[attribute];
			
		}
		
		//console.log('Model.get',attribute,value);
		
		return value;
		
	});
	
};

Model.prototype.getResourceId = function () {
	
	return this._resourceId;
	
};

Model.prototype.isDiff = function () {
	
	var diff = this.diff();
	
	for (var attribute in diff) {
		
		if (diff.hasOwnProperty(attribute)) {
			
			return true;
			
		}
		
	}
	
	return false;
	
};

Model.prototype.primary = function () {
	
	var model = this, props = {};
	
	for (var i in model._primary) {
		
		props[model._primary[i]] = model.get(model._primary[i],undefined,true);
		
	}
	
	return Promise.props(props);
	
};

Model.prototype.privileges = function () {
	
	return this._privileges;
	
};

Model.prototype.save = function (data,scope,bypass) {
	
	var promise;
	
	if (data) {
		
		promise = this.set(data);
		
	} else {
		
		promise = Promise.resolve(this);
		
	}
	
	return promise.then(function (model) {
		
		if (model.isDiff()) {
			
			return model.validate().then(function (model) {
				
				return model.service.save(model,scope,bypass).then(function (model) {
					
					return model.saved();
					
				});
				
			});
			
		} else {
			
			return model;
			
		}
		
	});
	
};

Model.prototype.saved = function () {
	
	for (var i in this._modified) {
		
		this._original[i] = this._modified[i];
		
	}
	
	this._modified = [];
	this._requiredPrivileges = [];
	
	return this;
	
};

Model.prototype.set = function (attribute,value,bypass) {
	
	var model = this;
	
	if (typeof(attribute) == 'object') {
		
		var promises = [];
		
		for (var i in attribute) {
			
			promises.push(model.set(i,attribute[i]));
		}
		
		return Promise.all(promises).then(function () {
			
			return model;
			
		});
		
	} else {
		
		if (model.attributes.hasOwnProperty(attribute)
			&& model._original[attribute] !== value) {
				
			model._modified[attribute] = value;
			
			if (!bypass) {
			
				model._privileges.push(attribute+'::set');
			
			}
			
		}
		
		return Promise.resolve(model);
		
	}
	
};

Model.prototype.toData = function (scope,bypass) {
	
	var data = {};
	
	for (var i in this.attributes) {
		
		data[i] = this.get(i,scope,bypass).catch(function () {
			
			return undefined;
			
		});
		
	}
	
	return Promise.props(data);
	
};

Model.prototype.toJson = function (scope) {
	
	return this.toData(scope).then(function (data) {
		
		return JSON.stringify(data);
		
	});
	
};

Model.prototype.validate = function () {
	
	var messages = {}, model = this, promises = [];
	
	for (var i in model.attributes) {
		
		(function (i) {
			
			promises.push(model.get(i,undefined,true).then(function (value) {
				
				return model.attributes[i].validate(value);
				
			}).catch(function (exception) {
				
				console.log('model.validate',i,exception);
				
				messages[i] = exception;
				
				throw exception;
				
			}));
			
		})(i);
		
	}
	
	return Promise.all(promises).then(function () {
		
		return model;
		
	}).catch(function (exception) {
		
		console.error('Model.validate',exception,exception.stack);
		
		throw new Exceptions.NotValid({
			resource: model.getResourceId(),
			errors: messages
		});
		
	});
	
};

module.exports = Model;