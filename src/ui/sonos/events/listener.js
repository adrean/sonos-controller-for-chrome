import xml2js from '../helpers/xml2js';
import request from '../helpers/request';
import ip from '../helpers/ip';

import Stream from './IncomingStream';

import _ from 'lodash';


var listeners = {};

chrome.sockets.tcpServer.onAccept.addListener(function (info) {
	var stream = new Stream(info.clientSocketId, function (request) {

		if(listeners[info.socketId]) {
			listeners[info.socketId]._messageHandler(request);
		}

	});
});



class Listener {

	constructor (device) {
		this.device = device;
		this.parser = new xml2js.Parser();
		this.services = {};
	}


	_startInternalServer (callback) {
		var self = this;

		chrome.sockets.tcpServer.create(null, function (info) {
			 chrome.sockets.tcpServer.listen(info.socketId, ip.address(), 0, null, function () {

					chrome.sockets.tcpServer.getInfo(info.socketId, function (i) {

						self.server = true;
						self.port = i.localPort;

						listeners[info.socketId] = self;

						// TODO: figure why this throws 412
						//setInterval(self._renewServices.bind(self), 1 * 1000);
						callback();
					});

			 });
		});
	}


	_messageHandler (req) {

		if (req.method.toUpperCase() === 'NOTIFY' && req.uri.toLowerCase() === '/notify') {

			if (!this.services[req.headers.sid])
				return;

			var thisService = this.services[req.headers.sid];

			var items = thisService.data || {};
			this.parser.parseString(req.body.toString(), function(error, data) {
				_.each(data['e:propertyset']['e:property'], function(element) {
					_.each(_.keys(element), function(key) {
						items[key] = element[key][0];
					});
				});

				this.serviceEventCallback(thisService.endpoint, req.headers.sid, thisService.data);
			}.bind(this));

		}
	}

	_renewServices () {
		var sid;

		var now = new Date().getTime();

		var renew = function(sid) {
			return function(err, response) {
				var serviceEndpoint = this.services[sid].endpoint;

				if (err || ((response.statusCode !== 200) && (response.statusCode !== 412))) {
					this.emit('error', err || response.statusMessage, serviceEndpoint, sid);
				} else if (response.statusCode === 412) { // restarted, this is why renewal is at most 300sec
					delete this.services[sid];
					this.addService(serviceEndpoint, function(err, sid) {
						if (!!err) this.emit('error', err, serviceEndpoint, sid);
					});
				} else {
					this.services[sid].renew = this.renew_at(response.headers.timeout);
				}
			};
		};

		for (sid in this.services) {
			var thisService = this.services[sid];

			if (now < thisService.renew) continue;

			var opt = {
				url: 'http://' + this.device.host + ':' + this.device.port + thisService.endpoint,
				method: 'SUBSCRIBE',
				headers: {
					SID: sid,
					Timeout: 'Second-600'
				}
			};

			request(opt, renew(sid).bind(this));

		}
	}

	onServiceEvent (f) {
		this.serviceEventCallback = f;
	}

	addService (serviceEndpoint, callback) {
		if (!this.server) {
			throw 'Service endpoints can only be added after listen() is called';
		} else {

			var opt = {
				url: 'http://' + this.device.host + ':' + this.device.port + serviceEndpoint,
				method: 'SUBSCRIBE',
				headers: {
					callback: '<http://' + ip.address() + ':' + this.port + '/notify>',
					NT: 'upnp:event',
					Timeout: 'Second-600'
				}
			};

			request(opt, function(err, response) {
				if (err || response.statusCode !== 200) {
					console.log(response.message || response.statusCode);
					callback(err || response.statusMessage);
				} else {
					callback(null, response.headers.sid);

					this.services[response.headers.sid] = {
						// TODO: figure why this throws 412
						// renew: this.renew_at(response.headers.timeout),
						endpoint: serviceEndpoint,
						data: {}
					};
				}
			}.bind(this));

		}
	}

	renew_at (timeout) {
		var seconds;

		if ((!!timeout) && (timeout.indexOf('Second-') === 0)) timeout = timeout.substr(7);
		seconds = (((!!timeout) && (!isNaN(timeout))) ? parseInt(timeout, 10) : 3600) - 15;
		if (seconds < 0) seconds = 15; else if (seconds > 300) seconds = 300;

		return (new Date().getTime() + (seconds * 1000));
	}

	listen (callback) {
		if (!this.server) {
			this._startInternalServer(callback);
		} else {
			throw 'Service listener is already listening';
		}
	}

	removeService (sid, callback) {
		if (!this.server) {
			throw 'Service endpoints can only be modified after listen() is called';
		} else if (!this.services[sid]) {
			throw 'Service with sid ' + sid + ' is not registered';
		} else {

			var opt = {
				url: 'http://' + this.device.host + ':' + this.device.port + this.services[sid].endpoint,
				method: 'UNSUBSCRIBE',
				headers: {
					sid: sid
				}
			};

			request(opt, function(err, response) {
				if (err || response.statusCode !== 200) {
					callback(err || response.statusCode);
				} else {

					callback(null, true);
				}
			});

		}
	}

}

export default Listener;
