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
	var lang = navigator.language ? navigator.language.substr(0, 2).toLowerCase() : navigator.browserLanguage,
		install = function() {
			var goToStore = function() {
					window.location.href = $('link[rel="chrome-webstore-item"]').attr('href');
				};

			if(!window.chrome) return goToStore();
			chrome.webstore.install('', function() {
				$('a.install button').remove();
				$('.install a').unbind('click', install);
				$('.install button').unbind('click', install);
			}, goToStore);
		};
	
	$('[class*="lang-"]').hide();
	$('[class*="lang-' + lang + '"]').show();

	$('body').fadeIn();
	if(window.chrome && window.chrome.app && window.chrome.app.isInstalled) return $('a.install button').remove();
	$('.install a').bind('click', install);
	$('.install button').bind('click', install);
});
