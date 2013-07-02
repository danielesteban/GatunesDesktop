var fs = require('fs'),
	staticServer = new (require('node-static').Server)(process.cwd(), {cache: 0}),
	httpServer = require('http').createServer(function (request, response) {
	    request.addListener('end', function () {
	    	staticServer.serve(request, response, function (e, res) {
				e && e.status === 404 && staticServer.serveFile('/index.html', 200, {}, request, response);
			});
	    }).resume();
	}),
	httpPort = 28029,
	downloadPath = process.env.HOME + '/Downloads/Gatunes';

httpServer.on('error', function(e) {
	if(e.code !== "EADDRINUSE") return;
	httpPort++;
	setTimeout(function() {
		httpServer.listen(httpPort, 'localhost');
	}, 1);
});

httpServer.on('listening', function() {
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
		APPWIN.DOWNLOAD = function(url, id, title, playlist, callback, progress) {
			var path = downloadPath + '/';
			if(playlist.artist) {
				path += playlist.artist.name.replace(/\//g, '_') + '/';
				!fs.existsSync(path) && fs.mkdirSync(path);
			}
			path += playlist.title.replace(/\//g, '_');
			!fs.existsSync(path) && fs.mkdirSync(path);
			fs.readdir(path, function(err, list) {
				if(err) return callback(true);
				var already = false;
				list.forEach(function(item) {
					if(already) return;
					item.substr(item.length - 4 - id.length, id.length) === id && (already = item);
				});
				if(already) return callback(null, already);
				var dl = require('youtube-dl').download(url, path, ["-o" + title + '_' + id + ".%(ext)s"]);
				progress && dl.on('progress', progress);
				if(!callback) return;
				dl.on('error', function(err) {
					callback(err);
				});
				dl.on('end', function(data) {
					callback(null, data.filename);
				});
			});
		};
		APPWIN.RELOAD = function() {
			reloading = true;
			APPWIN.close();
			load();
		};
	};
}

httpServer.listen(httpPort, 'localhost');
