var staticServer = new (require('node-static').Server)(process.cwd(), {cache: 0}),
	httpServer = require('http').createServer(function (request, response) {
	    request.addListener('end', function () {
	    	staticServer.serve(request, response, function (e, res) {
				e && e.status === 404 && staticServer.serveFile('/index.html', 200, {}, request, response);
			});
	    }).resume();
	}),
	httpPort = 10000;

httpServer.on('error', function(e) {
	if(e.code !== "EADDRINUSE") return;
	httpPort++;
	setTimeout(function() {
		httpServer.listen(httpPort, 'localhost');
	}, 1);
});

httpServer.on('listening', function() {
	var w = require('nw.gui').Window,
		serverWin = w.get(),
		downloadPath = process.env.HOME + '/Downloads/Gatunes',
		fs = require('fs');

	!fs.existsSync(downloadPath) && fs.mkdirSync(downloadPath);
	APPWIN = window.open('http://localhost:' + httpPort, 'app', 'width=' + window.screen.width + ',height=' + window.screen.height);
	var appWin = w.get(APPWIN);
	appWin.on('close', function() {
		serverWin.close();
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
		APPWIN.DOWNLOAD = function(url, callback, progress) {
			var dl = require('youtube-dl').download(url, downloadPath);
			progress && dl.on('progress', progress);
			if(!callback) return;
			dl.on('error', function(err) {
				callback(err);
			});
			dl.on('end', function(data) {
				callback(null, data);
			});
		};
	};
});

httpServer.listen(httpPort, 'localhost');
