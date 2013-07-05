var fs = require('fs'),
	join = require('path').join,
	downloadPath = process.env.HOME || process.env.USERPROFILE,
	httpPort = 28029,
	httpServer = require('http').createServer(function (request, response) {
	    request.addListener('end', function () {
	    	if(request.url.substr(0, 7) === '/media/') {
	    		request.url = request.url.substr(6);
	    		mediaServer.serve(request, response);
	    	} else if(request.url === '/crossdomain.xml') {
				response.writeHead(200, {'Content-Type': 'application/xml'});
				return response.end('<?xml version="1.0"?>'+
					'<!DOCTYPE cross-domain-policy SYSTEM "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">'+
					'<cross-domain-policy>'+
					'  <allow-access-from domain="*" secure="false"/>'+
					'  <site-control permitted-cross-domain-policies="master-only"/>'+
					'</cross-domain-policy>');
	    	} else staticServer.serve(request, response, function (e, res) {
				e && e.status === 404 && staticServer.serveFile('/index.html', 200, {}, request, response);
			});
	    }).resume();
	}),
	staticServer = new (require('node-static').Server)(process.cwd(), {cache: 0}),
	mediaServer;

httpServer.on('error', function(e) {
	if(e.code !== "EADDRINUSE") return;
	httpPort++;
	setTimeout(function() {
		httpServer.listen(httpPort, 'localhost');
	}, 1);
});

httpServer.on('listening', function() {
	fs.existsSync(join(downloadPath, 'Music')) && (downloadPath = join(downloadPath, 'Music'));
	downloadPath = join(downloadPath, 'Gatunes');
	!fs.existsSync(downloadPath) && fs.mkdirSync(downloadPath);
	mediaServer = new (require('node-static').Server)(downloadPath, {cache: 0});
	load();
});

function load() {
	APPWIN = window.open('http://localhost:' + httpPort, 'app', 'width=' + window.screen.width + ',height=' + window.screen.height);
	var w = require('nw.gui').Window,
		serverWin = w.get(),
		appWin = w.get(APPWIN),
		reloading = false;

	appWin.on('close', function() {
		!reloading && serverWin.close();
		this.close(true);
	});
	APPWIN.onload = function() {
		appWin.show();
		appWin.focus();
		APPWIN.FULLSCREEN = {
			active : function() {
				return appWin.isFullscreen;
			},
			request : function() {
				appWin.enterFullscreen();
				APPWIN.FULLSCREEN.onFullscreen();
			},
			cancel : function() {
				appWin.leaveFullscreen();
				APPWIN.FULLSCREEN.onFullscreen();
			}
		};
		APPWIN.DOWNLOAD = {
			cleanPath : function(path) {
				var	find = [
						"á","à","ä","â","ã","å","ą",
						"é","è","ë","ê",
						"í","ì","ï","î",
						"ó","ò","ö","ô","ø",
						"ú","ù","ü","û",
						"ñ","ç",
						"ß","œ","æ",
						"/","\\","&",
						"?","`","´","'","’"
					],
					replaces = [
						"a","a","a","a","a","a","a",
						"e","e","e","e",
						"i","i","i","i",
						"o","o","o","o","o",
						"u","u","u","u",
						"n","c",
						"ss","oe","ae",
						"_","_","_",
						"","","","",""
					],
					replace = function() {
						find.forEach(function(find, index) {
							var replace = replaces[index],
								i = path.indexOf(find),
								len;

							if(i !== -1) {
								len = find.length;
								do {
									path = path.substr(0, i) + replace + path.substr(i + len);
									i = path.indexOf(find);
								} while(i !== -1);
							}
						});
					};

				replace();
				find.forEach(function(a, i) {
					find[i] = find[i].toUpperCase();
					replaces[i] = replaces[i].toUpperCase();
				});
				replace();
				
				return path;
			},
			getPath : function(playlist, create) {
				var path = downloadPath;
				if(playlist.artist) {
					path = join(path, APPWIN.DOWNLOAD.cleanPath(playlist.artist.name));
					create && !fs.existsSync(path) && fs.mkdirSync(path);
				}
				path = join(path, APPWIN.DOWNLOAD.cleanPath(playlist.title));
				create && !fs.existsSync(path) && fs.mkdirSync(path);
				return path;
			},
			check : function(id, playlist, callback) {
				var path = APPWIN.DOWNLOAD.getPath(playlist);
				if(!fs.existsSync(path)) return callback();
				fs.readdir(path, function(err, list) {
					if(err) return callback();
					var already = false;
					list.forEach(function(item) {
						if(already) return;
						item.substr(item.length - 4 - id.length, id.length) === id && (already = item);
					});
					callback(already, path.substr(downloadPath.length).replace(/\\/g, '/'));
				});
			},
			start : function(url, id, title, playlist, callback, progress) {
				var path = APPWIN.DOWNLOAD.getPath(playlist, true);
				APPWIN.DOWNLOAD.check(id, playlist, function(already) {
					if(already) return callback(null, already);
					var dl = require('youtube-dl').download(url, path, ["-o" + APPWIN.DOWNLOAD.cleanPath(title) + '_' + id + ".%(ext)s", "--newline"]);
					progress && dl.on('progress', progress);
					if(!callback) return;
					dl.on('error', function(err) {
						callback(err);
					});
					dl.on('end', function(data) {
						callback(null, data.filename);
					});
				});
			},
			cover : function(playlist, callback) {
				var path = APPWIN.DOWNLOAD.getPath(playlist, true);
				require('http').get(playlist.image, function(res){
					var data = '';
					res.setEncoding('binary');
					res.on('data', function(chunk){
						data += chunk;
					});
					res.on('end', function(){
						var filename = 'cover' + playlist.image.substr(playlist.image.lastIndexOf('.'));
						fs.writeFile(join(path, filename), data, 'binary', function(err) {
							callback(err ? null : path.substr(downloadPath.length).replace(/\\/g, '/') + '/' + filename);
						});
					});
				});
			}
		};
		APPWIN.RELOAD = function() {
			reloading = true;
			APPWIN.close();
			load();
		};
	};
}

httpServer.listen(httpPort, 'localhost');
