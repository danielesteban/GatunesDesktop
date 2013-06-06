#!/usr/local/bin/node
/*
To run this you'll need:
- node.js with handlebars, uglifyjs & less npm packages (to recompile the templates & css)
- Also, it has been only tested on a Mac. Sorry ;{P
*/

var exec = require('child_process').exec,
	fs = require('fs');

function uglify(files, callback) {
	if(!files.length) return callback();
	var file = files.shift();
	console.log('uglifying ' + file + '...');
	exec('uglifyjs bundle/' + file + ' -nco bundle/' + file, function() {
		uglify(files, callback);
	});
}

function md5(files, path, callback, md5s) {
	if(!files.length) return callback(md5s);
	md5s = md5s || [];
	exec('md5 -q bundle' + path + files.shift(), function(err, stdout, stderr) {
		md5s.push(stdout.substr(0, stdout.length - 1));
		md5(files, path, callback, md5s);
	});
}

function compact(files, ext, callback) {
	exec('cat ' + files + ' > bundle/' + ext + '.' + ext, function() {
		md5([ext + '.' + ext], '/', function(md5) {
			exec('mv bundle/' + ext + '.' + ext + ' bundle/' + md5[0] + '.' + ext, function() {
				callback(md5[0]);
			});
		});
	});
}

function writeIndex(css, js) {
	var html = fs.readFileSync('bundle/index.html', 'utf8'),
		index = html.substr(0, html.indexOf('<link'));

	index = index.replace(/<html>/, '<html manifest="/app.manifest">');
	index += '<link href="/' + css + '.css" rel="stylesheet" />';
	index += '<script src="/' + js + '.js" charset="utf-8"></script>';
	index += html.substr(html.indexOf('<title>'));
	fs.writeFileSync('bundle/index.html', str_replace_array(index, ["\n", "\r", "\t"], ['', '', '']));
}

function genManifest(css, js, callback) {
	var imgs = fs.readdirSync('bundle/img'),
	manifest = "CACHE:\n" +
		"/\n" + 
		"/" + css + ".css\n" +
		"/" + js + ".js\n";

	md5(imgs.slice(), '/img/', function(md5s) { 
		for(var x=0; x<2; x++) {
			imgs.forEach(function(img, i) {
				if(x === 1) manifest += "/img/" + img + " ";
				manifest += "/img/" + img + "?" + md5s[i] + "\n"; 
			});

			x === 0 && (manifest += "\nFALLBACK:\n/ /\n");
		}
		
		manifest += "\nNETWORK:\n" +
			"/app.manifest\n" +
			"*";

		manifest = "CACHE MANIFEST\n\n# " + require('crypto').createHash('md5').update(manifest).digest('hex') + "\n\n" + manifest;

		fs.writeFileSync('bundle/app.manifest', manifest);
		callback();
	});
}

function str_replace(string, find, replace) {
	var i = string.indexOf(find),
		len;

	if(i !== -1) {
		len = find.length;
		do {
			string = string.substr(0, i) + replace + string.substr(i + len);

			i = string.indexOf(find);
		} while(i !== -1);
	}

	return string;
}

function str_replace_array(string, find, replace) {
	for(var i = find.length - 1; i >= 0; --i) {
		if(find[i] !== replace[i]) string = str_replace(string, find[i], replace[i]);
	}

	return string;
}

console.log("Creating bundle...");
exec('rm -rf bundle', function() {
	exec('mkdir bundle', function() {
		exec('cp -R * bundle/', function() {
			exec('rm -rf bundle/scripts bundle/css/* bundle/bundle bundle/js/_jquery.js bundle/img/brand.png && cp ../js/_jquery.js bundle/js && cp ../img/brand.png bundle/img', function() {
				console.log('compiling css...');
				exec('lessc --yui-compress css/screen.less bundle/css/screen.css', function() {		
					uglify([
						'js/app.js'
					], function() {
						console.log('compacting css...');
						compact('bundle/css/*.css', 'css', function(cssMD5) {
							console.log('compacting js...');
							compact('bundle/js/*.js', 'js', function(jsMD5) {
								console.log('cleaning bundle...');
								exec('rm -rf bundle/js bundle/css', function() {
									console.log('generating index & manifest...');
									writeIndex(cssMD5, jsMD5);
									genManifest(cssMD5, jsMD5, function() {
										console.log('Done!');
									});
								});
							});
						});
					});
				});
			});
		});
	});
});
