var fs = require('fs'),
	join = require('path').join,
	downloadPath = join(process.env.HOME, 'Downloads'),
	mediaServer = new (require('node-static').Server)(downloadPath, {cache: 0}),
	staticServer = new (require('node-static').Server)(process.cwd(), {cache: 0}),
	httpServer = require('http').createServer(function (request, response) {
	    request.addListener('end', function () {
	    	if(request.url.substr(0, 7) === '/media/') mediaServer.serveFile(decodeURIComponent(request.url.substr(6)), 200, {}, request, response);
	    	else if(request.url === '/crossdomain.xml') {
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
	httpPort = 28029;

httpServer.on('error', function(e) {
	if(e.code !== "EADDRINUSE") return;
	httpPort++;
	setTimeout(function() {
		httpServer.listen(httpPort, 'localhost');
	}, 1);
});

httpServer.on('listening', function() {
	!fs.existsSync(downloadPath) && fs.mkdirSync(downloadPath);
	downloadPath = join(downloadPath, 'Gatunes');
	!fs.existsSync(downloadPath) && fs.mkdirSync(downloadPath);
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
			getPath : function(playlist, create) {
				var path = downloadPath;
				if(playlist.artist) {
					path = join(path, playlist.artist.name.replace(/\//g, '_').replace(/\\/g, '_').replace(/&/g, '_').replace(/\?/g, ''));
					create && !fs.existsSync(path) && fs.mkdirSync(path);
				}
				path = join(path, playlist.title.replace(/\//g, '_').replace(/\\/g, '_').replace(/&/g, '_').replace(/\?/g, ''));
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
					var dl = require('youtube-dl').download(url, path, ["-o" + title.replace(/\//g, '_').replace(/\\/g, '_').replace(/&/g, '_').replace(/\?/g, '') + '_' + id + ".%(ext)s", "--newline"]);
					progress && dl.on('progress', progress);
					if(!callback) return;
					dl.on('error', function(err) {
						callback(err);
					});
					dl.on('end', function(data) {
						callback(null, data.filename);
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
