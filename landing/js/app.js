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
		install = function() {
			var goToStore = function() {
					window.location.href = $('link[rel="chrome-webstore-item"]').attr('href');
				};

			return goToStore();
			/*
			Apparently this doesn't work.. so I'll comment it out 'til I fix it.
			if(!window.chrome) return goToStore();
			chrome.webstore.install('', function() {
				$('a.install button').remove();
				$('.install a').unbind('click', install);
				$('.install button').unbind('click', install);
			}, goToStore);*/
		};
	
	['en', 'es'].indexOf(lang) === -1 && (lang = 'en');
	$('[class*="lang-"]').hide();
	$('[class*="lang-' + lang + '"]').show();

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
	if(window.chrome && window.chrome.app && window.chrome.app.isInstalled) return $('a.install button').remove();
	$('.install a').bind('click', install);
	$('.install button').bind('click', install);
});
