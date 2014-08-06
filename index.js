var sptrans = require('sptrans.js'),
	async = require('async'),
	fs = require('fs'),
	moment = require('moment'),
	_ = require('underscore');

sptrans = sptrans({
	api_key: '7ec6172b29856483524db5f1ff99a051fc6ec7041954990ac61d25e56b720570'
});

var filename;
var now;

function init() {

	sptrans.initRoutes(function(routes) {

		setFile();
		updateRoutes(routes);

		setInterval(function() {

			if(now.add(1, 'day').set('hour', 0).set('minute', 0).set('second', 0).is(moment().set('second', 0))) {
				setFile();
			}

			updateRoutes(routes);

		}, 1000 * 60);

	});

}

function setFile() {

	now = moment();

	if(fs.existsSync(filename)) {
		fs.renameSync(filename, filename + getFileDateFormat(now));
	}

	filename = 'data/' + getFileDateFormat(now);
	fs.writeFileSync(filename + '.csv', 'unitId,routeId,lat,lng,ts\r\n');

}

function getFileDateFormat(m) {
	return m.format('YYYY-MM-DD-HH-mm');
}

function updateRoutes(routes) {

	// _.each(routes, function(route) {
	// 	updateRoute(route);
	// });

	// Update only first route, file gets too big
	updateRoute(routes[0]);

}

var fleet = {};

function updateRoute(route) {
	sptrans.getPositionsOnRoute(route['CodigoLinha'], function(err, data) {
		if(!err) {
			_.each(data['vs'], function(pos) {
				if(!fleet[pos.p]) {
					fleet[pos.p] = {
						unitId: pos.p,
						routeId: route['CodigoLinha'],
						lat: pos.py,
						lng: pos.px,
						ts: moment().set('hour', data.hr.split(':')[0]).set('minute', data.hr.split(':')[1]).set('second', 0).format()
					};
					appendToCSV(fleet[pos.p]);
				} else {
					var unitPos = fleet[pos.p];
					if(unitPos.lat != pos.py || unitPos.lng != pos.px) {
						fleet[pos.p] = {
							unitId: pos.p,
							routeId: route['CodigoLinha'],
							lat: pos.py,
							lng: pos.px,
							ts: moment().set('hour', data.hr.split(':')[0]).set('minute', data.hr.split(':')[1]).set('second', 0).format()
						};
						appendToCSV(fleet[pos.p]);
					}
				}
			});
		}
	});
}

function appendToCSV(data) {

	fs.appendFileSync(filename + '.csv', _.values(data).join(',') + '\r\n');

}

init();