var sptrans = require('sptrans.js'),
	async = require('async'),
	fs = require('fs'),
	moment = require('moment'),
	_ = require('underscore');

require('moment-timezone');

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

			if(now.add(1, 'day').set('hour', 0).set('minute', 0).set('second', 0).isSame(getMoment().set('second', 0))) {
				setFile();
			}

			updateRoutes(routes);

		}, 1000 * 10);

	});

}

function setFile() {

	now = getMoment();

	if(fs.existsSync(filename)) {
		fs.renameSync(filename, filename + getFileDateFormat(now));
	}

	filename = 'data/' + getFileDateFormat(now);
	fs.writeFileSync(filename + '.csv', 'unitId,routeId,lat,lng,ts\r\n');

}

function getFileDateFormat(m) {
	return m.format('YYYY-MM-DD-HH-mm');
}

function getMoment() {

	return moment().tz('America/Sao_Paulo');

}

function updateRoutes(routes) {

	// _.each(routes, function(route) {
	// 	updateRoute(route);
	// });

	// Update only LINHA 1333 PCA RAMOS DE AZEVEDO - MERCADO DA LAPA
	updateRoute(_.find(routes, function(r) { return r['CodigoLinha'] == 1333; }));

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
						ts: getMoment().set('hour', data.hr.split(':')[0]).set('minute', data.hr.split(':')[1]).set('second', 0).format()
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
							ts: getMoment().set('hour', data.hr.split(':')[0]).set('minute', data.hr.split(':')[1]).set('second', 0).format()
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