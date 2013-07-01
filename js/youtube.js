YT = {
	search : function(feed, param, page, callback) {
		var params = {
				alt : 'json',
				format : 5,
				'start-index' : (page * 50) + 1,
				'max-results' : 50
			}, url;

		switch(feed) {
			case 'videos':
				url = 'https://gdata.youtube.com/feeds/api/videos';
				params.vq = param;
			break;
			default:
				url = 'https://gdata.youtube.com/feeds/api/standardfeeds/' + feed + (param ? '_' + param : '');
		}
		$.get(url, params, function(data) {
			callback(data.feed);
		}, 'json');
	},
	get : function(id, callback) {
		var params = {
				alt : 'json'
			},
			url = 'https://gdata.youtube.com/feeds/api/videos/' + id;

		$.get(url, params, function(data) {
			callback(data.entry);
		});
	},
	player : function(song) {
		if(window.chrome && window.chrome.storage) return YT.chromeAppPlayer(song);
		
		var video_id = song.provider_id,
			callback = function() {
				var onStateChange = function(e) {
						PLAYER.onStateChange(e.data);
					},
					onError = function(e) {
						PLAYER.onError(e.data);
					},
					player = new YT.Player('YTPlayer', {
						height: '100%',
						width: '100%',
						videoId: video_id,
						events: {
							'onStateChange': onStateChange,
							'onError' : onError
						},
						playerVars: {
							autoplay: 1,
							controls: 0,
							showinfo: 0,
							modestbranding: 1,
							iv_load_policy: 3,
							rel: 0,
							hd: 1
						}
					});

				PLAYER.current = {
					song : song,
					play : function() {
						player.playVideo()
					},
					pause : function() {
						player.pauseVideo()
					},
					getCurrentTime : function(callback) {
						callback(player.getCurrentTime ? player.getCurrentTime() : 0);
					},
					getDuration : function(callback) {
						callback(player.getDuration ? player.getDuration() : song.time);
					},
					getLoadedFraction : function(callback) {
						callback(player.getVideoLoadedFraction ? player.getVideoLoadedFraction() : 0);
					},
					seekTo : function(fraction) {
						if(!player.getDuration) return;
						player.seekTo(player.getDuration() * fraction);
					},
					destruct : function() {
						player.destroy();
					}
				};
				TEMPLATE.playlist.setPlayingSong();
			};

		if(PLAYER.IframeAPILoaded) return callback();

		$.getScript('https://www.youtube.com/iframe_api');
		YT.IframeAPIReadyCallback = callback;
	},
	IframeAPIReady : function() {
		PLAYER.IframeAPILoaded = 1;
		YT.IframeAPIReadyCallback && YT.IframeAPIReadyCallback();
	},
	chromeAppPlayerCallback : 0,
	chromeAppPlayerCallbacks : {},
	chromeAppPlayer : function(song) {
		var video_id = song.provider_id,
			webview = document.querySelector('webview#YTPlayer'),
			sendMessage = function(data) {
				webview.contentWindow.postMessage(data, webview.src);
			},
			onMessage = function(e) {
				if(e.data.callback) {
					if(YT.chromeAppPlayerCallbacks[e.data.callback]) {
						YT.chromeAppPlayerCallbacks[e.data.callback](e.data.data);
						delete YT.chromeAppPlayerCallbacks[e.data.callback];
					}
					return;
				}
				switch(e.data.func) {
					case 'state':
						PLAYER.onStateChange(e.data.data);
					break;
					case 'error':
						PLAYER.onError(e.data.data);
					break;
				}
			}/*,
			onLoadStop = function() {
				webview.removeEventListener('loadstop', onLoadStop);
				PLAYER.chromeAppPlayerLoaded = 1;
				sendMessage({func: 'load', video: video_id});
			}*/;

		PLAYER.current = {
			song : song,
			play : function() {
				sendMessage({func: 'play'});
			},
			pause : function() {
				sendMessage({func: 'pause'});
			},
			getCurrentTime : function(callback) {
				var cbid = ++YT.chromeAppPlayerCallback;
				YT.chromeAppPlayerCallbacks[cbid] = callback;
				sendMessage({func: 'currentTime', callback: cbid});
			},
			getDuration : function(callback) {
				var cbid = ++YT.chromeAppPlayerCallback;
				YT.chromeAppPlayerCallbacks[cbid] = callback;
				sendMessage({func: 'duration', callback: cbid});
			},
			getLoadedFraction : function(callback) {
				var cbid = ++YT.chromeAppPlayerCallback;
				YT.chromeAppPlayerCallbacks[cbid] = callback;
				sendMessage({func: 'loadedFraction', callback: cbid});
			},
			seekTo : function(fraction) {
				sendMessage({func: 'seekTo', fraction: fraction});
			},
			destruct : function() {
				window.removeEventListener('message', onMessage);
				sendMessage({func: 'destruct'});
			}
		};

		TEMPLATE.playlist.setPlayingSong();

		window.addEventListener('message', onMessage);
		sendMessage({func: 'load', video: video_id});

		//if(PLAYER.chromeAppPlayerLoaded) return sendMessage({func: 'load', video: video_id});
		//webview.addEventListener('loadstop', onLoadStop);
	}
};

function onYouTubeIframeAPIReady() {
	YT.IframeAPIReady();
}
