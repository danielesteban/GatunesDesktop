SC = {
	client_id : 'b22ce9318bc327c4809a53c660c43781',
	artworks : {},
	artworks_err : {},
	artworks_req : [],
	artworks_req_callbacks : [],
	search : function(query, callback) {
		var params = {
				client_id : SC.client_id,
				filter : 'streamable',
				q : query
			};

		$.get('//api.soundcloud.com/tracks.json', params, function(data) {
			callback(data);
		}, 'json');
	},
	get : function(id, callback) {
		$.get('//api.soundcloud.com/tracks/' + id + '.json', {client_id : SC.client_id}, function(data) {
			callback(data);
		}, 'json');
	},
	reqArtworks : function() {
		if(SC.artworks_req.length > 0) {
			var params = {
					client_id : SC.client_id,
					ids : SC.artworks_req.join(',')
				},
				cbs = SC.artworks_req_callbacks;
			
			$.get('//api.soundcloud.com/tracks.json', params, function(data) {
				data.forEach(function(t) {
					if(t.artwork_url || (t.user.avatar_url && t.user.avatar_url.indexOf('default_avatar_large.png') === -1)) {
						SC.artworks[t.id] = (t.artwork_url || t.user.avatar_url).replace(/large.jpg/, 'crop.jpg');
						$('img.scart' + t.id, 'section, div.modal.replace').attr('src', SC.artworks[t.id].replace(/crop.jpg/, 'large.jpg'));
					} else SC.artworks_err[t.id] = true;
				});
				
				for(i in cbs) cbs[i]();
			}, 'json');

			SC.artworks_req = [];
			SC.artworks_req_callbacks = [];
		}
	},
	player : function(song) {
		if(!SoundManager.ready) {
			!SoundManager.callbacks && (SoundManager.callbacks = []);
			return SoundManager.callbacks.push(function() {SC.player(song)});
		}
		/*if(song.provider === DATA.providers.remotestorage && !song.url) return remoteStorage.music.getUrl(song, function(url) {
			song.url = url + '?.' + url.substr(url.lastIndexOf('-') + 1); //ogg files don't work without this fake extension hack
			SC.player(song);
		});*/
		PLAYER.onStateChange(3);
		var sound = soundManager.createSound({
			id : 'sound' + song.provider + song.provider_id,
			url : song.localMatch ? '//' + window.location.host + '/media' + song.localMatch : '//api.soundcloud.com/tracks/' + song.provider_id + '/stream?client_id=' + SC.client_id,
			autoPlay: true,
			multiShot: false,
			/*useEQData: true,*/
			onfinish : function() {
				PLAYER.onStateChange(PLAYER.states.ended);
			},
			onplay : function() {
				PLAYER.onStateChange(PLAYER.states.playing);
			},
			onresume : function() {
				PLAYER.onStateChange(PLAYER.states.playing);
			},
			onpause : function() {
				PLAYER.onStateChange(PLAYER.states.paused);
			},
			onload : function(ok) {
				!ok && PLAYER.onError();
			}
		});
		PLAYER.current = {
			song : song,
			play : function() {
				sound.resume();
			},
			pause : function() {
				sound.pause();
			},
			getCurrentTime : function(callback) {
				callback(sound.position ? sound.position / 1000 : 0);
			},
			getDuration : function(callback) {
				callback(!sound.bytesTotal || sound.bytesTotal > sound.bytesLoaded ? (song.time || sound.durationEstimate) : sound.duration / 1000);
			},
			getLoadedFraction : function(callback) {
				PLAYER.current.getDuration(function(duration) {
					callback(sound.buffered && sound.buffered.length ? sound.buffered[0].end / 1000 / duration : 0);
				});
			},
			seekTo : function(fraction) {
				PLAYER.current.getDuration(function(duration) {
					sound.setPosition(duration * 1000 * fraction);
				});
			},
			destruct : function() {
				sound.destruct();
				$('#SCPlayer').remove();
			}
		};
		if(song.provider === DATA.providers.soundcloud && SC.artworks_req.indexOf(song.provider_id) === -1) {
			SC.artworks_req.push(song.provider_id);
			SC.artworks_req_callbacks.push(function() {
				if(!SC.artworks[song.provider_id]) return;
				var div = $('<div id="SCPlayer" />'),
					i = $('<img src="' + SC.artworks[song.provider_id] + '" />');

				div.append(i);
				$('body').append(div);
			});
			SC.reqArtworks();
		}
		TEMPLATE.playlist.setPlayingSong();
	}
};

