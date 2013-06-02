chrome.app.runtime.onLaunched.addListener(function() {
	var screenWidth = screen.availWidth,
		screenHeight = screen.availHeight,
		width = screenWidth, //1024,
		height = screenHeight; //768;

	chrome.app.window.create('index.html', {
		bounds: {
			width : width,
			height : height,
			left : Math.round((screenWidth - width) / 2),
			top : Math.round((screenHeight - height) / 2)
		}
	});
});
