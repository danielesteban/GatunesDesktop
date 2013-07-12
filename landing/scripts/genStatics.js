#!/usr/local/bin/node
/*

To run this forever while developing:
/usr/local/bin/supervisor --extensions 'less|handlebars' scripts/genStatics.js

*/
var exec = require('child_process').exec;
console.log('compiling less...');
var less = exec('lessc --yui-compress css/screen.less css/screen.css', function() {
	console.log('Done!');
	setInterval(function() {
		//Don't let the process die.. supervisor will kill it.
	}, 100000);
});
less.stderr.on('data', function (data) {
	console.log('less stderr: ' + data);
});
