/* AppCache handler */
window.applicationCache && window.applicationCache.addEventListener('updateready', function(e) {
	if(window.applicationCache.status !== window.applicationCache.UPDATEREADY) return;
	try {
		window.applicationCache.swapCache();
	} catch(e) {}
	window.location.reload();
}, false);

/* Start the app */
$(window).load(function() {
	var lang = navigator.language ? navigator.language.substr(navigator.language.length - 2).toLowerCase() : navigator.browserLanguage,
		version = '1.1.7',
		sizes = {
			darwin : 41,
			win32 : 40,
			'linux-ia32' : 42,
			'linux-x64' : 45
		},
		platformNames = {
			darwin : 'Mac OS X',
			win32 : 'Windows',
			'linux-ia32' : 'GNU/Linux (32bit)',
			'linux-x64' : 'GNU/Linux (64bit)'
		},
		platform = navigator.appVersion.indexOf("Win") != -1 ? 'win32' : navigator.appVersion.indexOf("Mac") != -1 ? 'darwin' : 'linux-x64',
		link = function(a, platform) {
			var url = '/releases/Gatunes.v' + version + '-' + platform + '.' + (platform === 'darwin' ? 'zip' : platform === 'win32' ? 'exe' : 'tar.bz2');
			a.attr('href', url)
				.click(function(e) {
					e.stopPropagation();
					e.preventDefault();
					$.ajax({
						url : 'https://api.mongolab.com/api/1/databases/landing/collections/downloads?apiKey=M8bGkRgnxrTJ-Y5pBW7c1GsKF901Fb6g',
						data : JSON.stringify({
							platform : platform,
							date : Math.round((new Date()).getTime() / 1000)
						}),
						type : 'POST',
						contentType : 'application/json'
					}).always(function() {
						window.location.href = url;
					});
				});
		};
	
	['en', 'es'].indexOf(lang) === -1 && (lang = 'en');
	$('[class*="lang-"]').hide();
	$('[class*="lang-' + lang + '"]').show();

	link($('.download a'), platform);
	link($('.download button'), platform);
	$('.download button .version').text('v' + version);
	$('.download button .platform').text(platformNames[platform]);
	$('.download button .size').text(sizes[platform] + 'MB');

	var p = $('.download .alternative'),
		c = 0;

	for(var i in platformNames) {
		if(i === platform) continue;
		c++ > 0 && p.append('&nbsp; • &nbsp;');
		var a = $('<a>' + platformNames[i] + '</a>');
		link(a, i);
		p.append(a);
	}

	var canvas = $('canvas')[0],
		ctx = canvas.getContext('2d'),
		draw = function(e, forceFiller) {
			canvas.width = $('body').width();
			
			ctx.beginPath();
			for(var x=0; x<=Math.ceil(canvas.width / 40); x++) {
				ctx.arc(x * 40, -3, 20, 0, Math.PI, false);
			}
			ctx.shadowOffsetX = 2;   
		    ctx.shadowOffsetY = 2;   
		    ctx.shadowBlur = 2;   
		    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
			ctx.fillStyle = '#0b0c0e';
			ctx.fill();
			ctx.lineWidth = 5;
			ctx.strokeStyle = '#fff';
			ctx.lineJoin = 'round';
			ctx.stroke();

			var p = $(window).height() - 500;
			$('section').css('paddingBottom', p > 60 ? p : 60);
			(forceFiller || $('footer').css('position') !== 'static') && $('div.filler').css('height', Math.max($('footer').height(), $(window).height()) + canvas.height);
		};
	
	$(window).resize(draw);
	$(window).scroll(function() {
		if($(window).scrollTop() >= ($('header').height() + $('section').height() + parseInt($('section').css('paddingBottom'), 10) + 125)) {
			$('div.filler').css('height', 'auto');
			$('footer').css('position', 'static');
		} else {
			draw(null, true);
			$('footer').css('position', '');
		}
	});
	$('body').fadeIn();
	draw();draw();
});
