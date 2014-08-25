var crypto = require('crypto');

var Exceptions = require('./exceptions');
var Promise = require('./promise');
var Set = require('./set');

function Service(config) {
	
	this.acl = config.acl;
	this.adapter = config.adapter;
	this.application = config.application;
	this.forms = config.forms || {};
	this.idLength = config.idLength;
	this.model = config.model;
	
}

Service.prototype.add = function (data,scope) {
	
	return this.adapter.insert(data,scope).then(function (result) {
		
		if (result.affectedRows) {
			
			return true;
			
		} else {
			
			throw false;
			
		}
		
	});
	
};

Service.prototype.cache = function (scope,id,result) {
	
	if (undefined === scope.cache) {
		
		return Promise.reject(false);
		
	} else {
		
		if (result) {
			
			return scope.cache.save(id,result);
			
		} else {
			
			return scope.cache.get(id);
			
		}
		
	}
	
};

Service.prototype.createId = function (length) {
	
	length = length || this.idLength;
	
	return crypto.randomBytes(length).toString('hex').substr(0,length);
	
};

Service.prototype.delete = function (model,scope,bypass) {
	
	var promise, service = this;
	
	if (bypass) {
		
		promise = Promise.resolve(true);
		
	} else {
		
		promise = service.acl.isAllowed(model,'delete',scope);
		
	}
	
	return promise.then(function () {
		
		return model.primary().then(function (primary) {
			
			return service.adapter.delete(primary,1,0,scope).then(function (result) {
				
				if (result.affectedRows) {
					
					return true;
					
				} else {
					
					throw false;
					
				}
				
			});
			
		});
		
	});
	
};

Service.prototype.edit = function (data,where,scope) {
	
	return this.adapter.update(data,where,scope).then(function (result) {
		
		if (result.affectedRows) {
			
			return true;
			
		} else {
			
			throw false;
			
		}
		
	});
	
};

Service.prototype.fetchAll = function (where,limit,offset,scope,bypass) {
	
	var promise, service = this;
	
	if ('fetchAll' in this.forms) {
	
		promise = this.forms.fetchAll.validate(where);
	
	} else {
		
		promise = Promise.resolve(where);
		
	}
	
	return promise.then(function (where) {
		
		return service.adapter.fetchAll(where,limit,offset,scope).then(function (results) {
			
			var promises = [], set = new Set();
			
			set.actualLength = results.length;
			
			for (var i = 0, length = results.length; i < length; i++) {
				
				var model = new service.model({
						data: results[i],
						service: service
					}),
					promise;
				
				if (bypass) {
					
					promise = Promise.resolve(model);
					
				} else {
					
					promise = service.acl.isAllowed(model,'view',scope);
					
				}
				
				promises.push(promise.then(function (model) {
					
					set.push(model);
					
				}));
				
			}
			
			return Promise.settle(promises).then(function () {
				
				return set;
				
			});
			
		});
		
	});
	
};

Service.prototype.fetchNew = function () {

	var model = new this.model({
		new: true,
		service: this
	});
	
	return Promise.resolve(model);
	
};

Service.prototype.fetchOne = function (where,scope,bypass,cache) {
	
	var promise, service = this;
	
	if ('fetchOne' in service.forms) {
		
		promise = service.forms.fetchOne.validate(where);
		
	} else {
		
		promise = Promise.resolve(where);
		
	}
	
	return promise.then(function (where) {
		
		if (cache) {
			
			var id = service.adapter.table+':'+JSON.stringify(where);
			
			promise = service.cache(scope,id);
			
		} else {
			
			promise = Promise.reject(false);
			
		}
		
		return promise.catch(function () {
			
			return service.adapter.fetchRow(where,0,scope).then(function (result) {
				
				var model;
				
				if (result) {
					
					if (cache) {
						
						service.cache(scope,id,result);
						
					}
					
					model = new service.model({
						data: result,
						service: service
					});
					
					if (bypass) {
						
						return model;
						
					} else {
						
						return service.acl.isAllowed(model,'view',scope);
						
					}
					
				} else {
					
					throw new Exceptions.NotFound();
					
				}
				
			});
			
		});
		
	});
	
};

Service.prototype.save = function (model,scope,bypass) {
	
	var privileges = model.privileges(),
		promise,
		service = this;
	
	if (model.new) {
		
		privileges.push('add');
		
	} else {
		
		privileges.push('edit');
		
	}
	
	if (bypass) {
		
		promise = Promise.resolve(model);
		
	} else {
		
		promise = service.acl.isAllowed(model,privileges,scope);
		
	}
	
	return promise.then(function (model) {
		
		var diff = model.diff();
		
		if (model.new) {
			
			promise = service.add(diff,scope);
			
		} else {
			
			promise = model.primary().then(function (primary) {
				
				return service.edit(diff,primary,scope);
				
			});
			
		}
		
		return promise.then(function () {
			
			return model;
			
		});
		
	});
	
};

Service.prototype.service = function (name) {
	
	return this.application.service(name);
	
};

module.exports = Service;