PLAYER = {
	init : function() {
		/* SoundManager SETUP */
		soundManager.setup({
			url : '/swf/',
			flashVersion : 9,
			debugMode : 0,
			useEQData : true,
			onready : function(){
				SoundManager.ready = 1;
				SoundManager.callbacks && SoundManager.callbacks.forEach(function(cb){cb()});
				delete SoundManager.callbacks;
			}
		});

		/* Slider */
		var controls = $('footer'),
			slider = $('div.slider', controls);

		LIB.preventSelection(slider, function(e) {
			if(!PLAYER.current) return;
			var mm = function(e) {
					PLAYER.setSlider({
						progress : e.clientX / slider.width(),
						fromSlider : true
					});
				},
				mu = function() {
					$(window).unbind('mousemove', mm);
					$(window).unbind('mouseup', mu);
					controls.removeClass('sliding');
					PLAYER.sliding = false;
					PLAYER.current.seekTo(PLAYER.sliderValue);
				};
			
			PLAYER.sliding = true;
			mm(e);
			$(window).bind('mousemove', mm);
			$(window).bind('mouseup', mu);
			controls.addClass('sliding');
		});

		/* Buttons */
		['play', 'prev', 'next', 'love', 'settings', 'fullscreen'].forEach(function(bt) {
			$('menu li.' + bt + ' button', controls).click(function() {
				PLAYER[bt]();
			});
		});

		$('body').append('<div id="YTPlayer" />');
	},
	load : function(queueId) {
		var song = PLAYER.queue[queueId],
			id = song.provider + ':' + song.provider_id;

		if(song.provider === DATA.providers.lastfm) {
			if(!song.bestMatch) return PLAYER.next();
			song.bestMatch.albumSong = song;
			song = song.bestMatch;
		}
		PLAYER.queueId = queueId;
		PLAYER.onStateChange(-1);
		PLAYER.current && PLAYER.current.destruct && PLAYER.current.destruct();
		switch(song.provider) {
			case DATA.providers.youtube:
				if(song.localMatch) {
					if(song.localMatch.substr(song.localMatch.length - 4) === '.mp3') SC.player(song);
					else DANIPLAYA.player(song);
				} else YT.player(song);
			break;
			default:
				SC.player(song);
		}
		PLAYER.setPlay();
		PLAYER.setTitle(song);
		PLAYER.setTimes(0, song.time);
		PLAYER.setSlider({
			progress : 0,
			loading : 0
		});
		DATA.loved.check(id, function(loved) {
			$('menu li.love button i').attr('class', 'icon-' + (loved ? 'ok' : 'heart'));
		});
	},
	startInterval : function() {
		PLAYER.stopInterval();
		PLAYER.interval = setInterval(function() {
			if(!PLAYER.current) return;
			PLAYER.current.getCurrentTime(function(currentTime) {
				PLAYER.current.getDuration(function(duration) {
					PLAYER.current.getLoadedFraction(function(loadedFraction) {
						//LIB.setTitle('(' + LIB.formatTime(Math.round(currentTime)) + ') ' + PLAYER.current.song.title);
						PLAYER.setTimes(Math.round(currentTime), Math.round(duration));
						PLAYER.setSlider({
							progress : currentTime / duration,
							loading : loadedFraction
						});
					});
				});
			});
		}, 50);
	},
	stopInterval : function() {
		PLAYER.interval && clearInterval(PLAYER.interval);
	},
	states : {ended: 0, playing: 1, paused: 2, buffering: 3},
	onStateChange : function(state) {
		PLAYER.state = state;
		switch(state) {
			case PLAYER.states.paused:
			case PLAYER.states.ended:
				PLAYER.setPlay(1);
				PLAYER.stopInterval();
		}
		switch(state) {
			case PLAYER.states.playing:
			case PLAYER.states.buffering:
				PLAYER.startInterval();
				PLAYER.setPlay();
			break;
			case PLAYER.states.ended:
				PLAYER.setTitle();
				PLAYER.setTimes();
				PLAYER.setSlider({
					progress : 0,
					loading : 0
				});
				$('footer').removeClass('playing');
				//LIB.setFavicon();
				if(PLAYER.current) {
					//HISTORY.add(PLAYER.current.song);
					PLAYER.current.destruct && PLAYER.current.destruct();
					delete PLAYER.current;
				}	
				PLAYER.next();
		}
	},
	onError : function(code) {
		//for now we just skip the song...
		PLAYER.next();
	},
	play : function() {
		if(!PLAYER.current) return;

		if(PLAYER.state === PLAYER.states.playing) {
			PLAYER.current.pause();
		} else {
			PLAYER.current.play();
		}
	},
	prev : function() {
		var cb = function(currentTime) {
				if(currentTime > 3) return PLAYER.current.seekTo(0);
				var q = PLAYER.queue;
				if(!q) return;

				PLAYER.queueId--;
				PLAYER.queueId < 0 && (PLAYER.queueId = q.length - 1);
				
				PLAYER.load(PLAYER.queueId);
			};

		if(PLAYER.current) return PLAYER.current.getCurrentTime(cb);
		cb();
	},
	next : function() {
		var q = PLAYER.queue;
		if(!q || q.length === 1) return;

		PLAYER.queueId++;
		PLAYER.queueId >= q.length && (PLAYER.queueId = 0);
		
		PLAYER.load(PLAYER.queueId);
	},
	setPlay : function(paused) {
		var controls = $('footer');
		$('li.play i', controls).attr('class', 'icon-' + (paused ? 'play' : 'pause'));
		!controls.hasClass('playing') && controls.addClass('playing');
		//LIB.setFavicon(paused ? 'pause' : 'play');
	},
	setTitle : function(song) {
		$('li.title a', 'footer').text(song ? song.title : '');
		//LIB.setTitle(song ? '(0:00) ' + song.title : null);
	},
	setTimes : function(current, duration) {
		typeof current !== 'undefined' && (current = LIB.formatTime(current));
		typeof duration !== 'undefined' && (duration = LIB.formatTime(duration));
		$('li.time', 'footer').text((current || '') + (current && duration ? ' / ' : '') + (duration || ''));
	},
	setSlider : function(data) {
		var s = $('footer div.slider'),
			p = data.loading;
		
		if(p || p === 0) {
			if(p > 1) p = 1;
			if(p < 0) p = 0;
			s.children().first().css('width', s.width() * p);
		}
		
		p = data.progress;		
		if(((p || p === 0) && !PLAYER.sliding) || data.fromSlider) {
			if(p > 1) p = 1;
			if(p < 0) p = 0;
			var div = s.children().first().next();
			div.css('width', s.width() * p);
			div = div.next();
			div.css('left', s.width() * p);
			PLAYER.sliderValue = p;
		}
	},
	love : function() {
		if(!PLAYER.current) return;
		var s = PLAYER.current.song.albumSong || PLAYER.current.song,
			id = s.provider + ':' + s.provider_id,
			cb = function(loved) {
				return function() {
					$('menu li.love button i').attr('class', 'icon-' + (loved ? 'ok' : 'heart'));
				}
			};

		DATA.loved.check(id, function(loved) {
			if(loved) return DATA.loved.remove(id, cb(false));
			else DATA.loved.add([s], cb(true));
		});
	},
	settings : function() {
		if(ROUTER.url === '/settings') return;
		ROUTER.update('/settings');
	},
	fullscreen : function() {
		if(FULLSCREEN.active()) FULLSCREEN.cancel();
		else FULLSCREEN.request();
	},
	onFullscreen : function() {
		var a = FULLSCREEN.active();
		$('body')[(a ? 'add' : 'remove') + 'Class']('fullscreen');
		$(window)[a ? 'bind' : 'unbind']('mousemove', PLAYER.fullscreenMouseMove);
		if(a) PLAYER.fullscreenMouseMove({clientY : 0});
		else {
			clearTimeout(PLAYER.controlsTimeout);
			$('footer').stop().css('bottom', 0);
		}
	},
	fullscreenMouseMove : function(e) {
		$('footer').css('bottom') === '-50px' && $('footer').stop().animate({
			bottom: 0
		});
		clearTimeout(PLAYER.controlsTimeout);
		e.clientY <= $(window).height() - 50 && (PLAYER.controlsTimeout = setTimeout(function() {
			$('footer').stop().animate({
				bottom: -50
			});
		}, 3000));
	}
};
