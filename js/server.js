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
		serverWin = w.get();

	APPWIN = window.open('http://localhost:' + httpPort, 'app', 'width=' + window.screen.width + ',height=' + window.screen.height);
	var appWin = w.get(APPWIN);
	appWin.show();
	appWin.focus();
	appWin.on('close', function() {
		serverWin.close();
	});
});

httpServer.listen(httpPort, 'localhost');
