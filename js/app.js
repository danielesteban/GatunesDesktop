DATA = {
	providers : {
		youtube : 1,
		soundcloud : 2,
		lastfm : 3
	},
	getItem : function(id, callback) {
		if(!window.chrome || !window.chrome.storage) callback(JSON.parse(window.localStorage.getItem(id)));
		else window.chrome.storage.sync.get(id, function(items) {
			callback(items[id]);
		});
	},
	setItem : function(id, value, callback) {
		var onChange = function() {
				var collection = id.split(':')[0];
				!DATA[collection] && (collection += 's');
				DATA[collection] && DATA[collection].onChange && DATA[collection].onChange(id.substr(id.split(':')[0].length + 1) || true);
				callback && callback();
			};
		
		if(!window.chrome || !window.chrome.storage) {
			window.localStorage.setItem(id, JSON.stringify(value));
			onChange();
		} else {
			var items = {};
			items[id] = value;
			window.chrome.storage.sync.set(items, onChange);
		}
	},
	removeItem : function(id, callback) {
		var onChange = function() {
				var collection = id.split(':')[0];
				!DATA[collection] && (collection += 's');
				DATA[collection] && DATA[collection].onChange && DATA[collection].onChange(id.substr(id.split(':')[0].length + 1) || true);
				callback && callback();
			};

		if(!window.chrome || !window.chrome.storage) {
			window.localStorage.removeItem(id);
			onChange();
		} else window.chrome.storage.sync.remove(id, onChange);
	},
	playlists : {
		getAll : function(callback) {
			DATA.getItem('playlists', function(playlists) {
				var data = [],
					cb = function() {
						count--;
						if(count > 0) return;
						callback(data);
					};

				if(!playlists || !playlists.length) return callback(data);
				var count = playlists.length;
				playlists.forEach(function(id, index) {
					DATA.getItem('playlist:' + id, function(p) {
						p.id = id;
						p.dataKey = 'playlist:' + id;
						p.link = '/playlist/' + id;
						data[index] = p;
						cb();
					});
				});
			});
		},
		get : function(id, callback) {
			var dataKey = 'playlist:' + id;
			DATA.getItem(dataKey, function(playlist) {
				var cb = function() {
						count--;
						if(count > 0) return;
						callback(playlist);
					};

				if(!playlist) return callback && callback();
				playlist.dataKey = dataKey;
				if(!playlist.songs.length) return callback(playlist);
				var count = playlist.songs.length;
				playlist.songs.forEach(function(id, index) {
					DATA.getItem('song:' + id, function(s) {
						s.provider = parseInt(id.split(':')[0], 10);
						s.provider_id = id.split(':')[1];
						playlist.songs[index] = s;
						if(!s.bestMatch) return cb();
						DATA.getItem('song:' + s.bestMatch, function(bm) {
							bm.provider = parseInt(s.bestMatch.split(':')[0], 10);
							bm.provider_id = s.bestMatch.split(':')[1];
							s.bestMatch = bm;
							cb();
						});
					});
				});
			});
		},
		add : function(title, callback) {
			DATA.getItem('playlists', function(playlists) {
				playlists = playlists || [];
				var newId = 1;
				playlists.forEach(function(id) {
					id >= newId && (newId = id + 1);
				});
				playlists.unshift(newId);
				DATA.setItem('playlist:' + newId, {
					title : LIB.escapeHTML(title),
					songs : []
				}, function() {
					DATA.setItem('playlists', playlists, function() {
						callback && callback(newId);
					});
				});
			});
		},
		remove : function(id, callback) {
			DATA.getItem('playlists', function(playlists) {
				var index = playlists.indexOf(id);
				if(index === -1) return callback && callback();
				playlists.splice(index, 1);
				DATA.setItem('playlists', playlists, function() {
					DATA.removeItem('playlist:' + id, callback);
				});
			});
		},
		reorder : function(playlistId, below, album, callback) {
			var dataKey = album ? 'albums' : 'playlists';
			DATA.getItem(dataKey, function(playlists) {
				var ids = [],
					indexes = [],
					reordered = [];

				playlists.forEach(function(id, i) {
					id === below && reordered.push(playlistId);
					id !== playlistId && reordered.push(id);
				});
				below === null && reordered.push(playlistId);
				DATA.setItem(dataKey, reordered, callback);
			});
		},
		addSongs : function(id, songs, callback, index) {
			var playlist_id = 'playlist:' + id,
				cb = function(playlist) {
					DATA.setItem(playlist_id, playlist, callback);
				};

			DATA.getItem(playlist_id, function(playlist) {
				index = index === 0 || index > 0 ? index : playlist.songs.length;
				var count = songs.length;

				songs.forEach(function(s) {
					var id = parseInt(s.provider, 10) + ':' + LIB.escapeHTML(s.provider_id),
						add = function() {
							playlist.songs.splice(index, 0, id);
							PLAYER.queueDataKey === playlist_id && PLAYER.queueId >= index && PLAYER.queueId++;
							index++;
							count--;
							if(count > 0) return;
							cb(playlist);
						};

					DATA.getItem('song:' + id, function(song) {
						if(song) return add();
						song = {
							title : LIB.escapeHTML(s.title),
							time : parseInt(s.time, 10)
						};
						s.artist && (song.artist = {
							mbid : LIB.escapeHTML(s.artist.mbid),
							name : LIB.escapeHTML(s.artist.name)
						});
						DATA.setItem('song:' + id, song, add);
					});
				});
			});
		},
		removeSong : function(id, index, provider, provider_id, callback) {
			var playlist_id = 'playlist:' + id;
			DATA.getItem(playlist_id, function(playlist) {
				var sid = playlist.songs[index];
				if(!sid || parseInt(sid.split(':')[0], 10) !== provider || sid.split(':')[1] !== provider_id) return callback(playlist.songs);
				playlist.songs.splice(index, 1);
				PLAYER.queueDataKey === playlist_id && index <= PLAYER.queueId && PLAYER.queueId--;
				DATA.setItem(playlist_id, playlist, callback);
			});
		},
		reorderSongs : function(id, songs, callback, index) {
			var playlist_id = 'playlist:' + id;
			DATA.getItem(playlist_id, function(playlist) {
				var ids = [],
					indexes = [],
					reordered = [],
					queue_id = false;

				songs.forEach(function(s, i) {
					var id = s.provider + ':' + s.provider_id;
					if(playlist.songs[s.index] !== id) return;
					ids.push(id);
					indexes.push(s.index);
					if(s.index === PLAYER.queueId) queue_id = i;
				});

				playlist.songs.forEach(function(id, i) {
					i === index && ids.forEach(function(id, i) {
						if(queue_id === i) queue_id = -reordered.length;
						reordered.push(id);
					});
					if(queue_id === false && i === PLAYER.queueId) PLAYER.queueId = reordered.length;
					indexes.indexOf(i) === -1 && reordered.push(id);
				});
				if(queue_id !== false) {
					PLAYER.queueId = -queue_id
				}
				index === null && ids.forEach(function(id) {
					reordered.push(id);
				});
				playlist.songs = reordered;
				DATA.setItem(playlist_id, playlist, callback);
			});
		}
	},
	albums : {
		getAll : function(callback) {
			DATA.getItem('albums', function(albums) {
				var data = [],
					cb = function() {
						count--;
						if(count > 0) return;
						callback(data);
					};

				if(!albums || !albums.length) return callback(data);
				var count = albums.length;
				albums.forEach(function(id, index) {
					DATA.getItem('album:' + id, function(a) {
						a.id = id;
						a.dataKey = 'album:' + id;
						a.fullTitle = a.artist.name + ' - ' + a.title;
						a.link = '/album/' + id;
						data[index] = a;
						cb();
					});
				});
			});
		},
		get : function(id, callback) {
			var dataKey = 'album:' + id;
			DATA.getItem(dataKey, function(album) {
				if(!album) return callback(null);
				var cb = function() {
						count--;
						if(count > 0) return;
						callback(album);
					};

				album.dataKey = dataKey;
				album.stored = true;
				album.artist.link = '/artist/' + album.artist.mbid;
				if(!album.songs.length) return callback(album);
				var count = album.songs.length;
				album.songs.forEach(function(id, index) {
					DATA.getItem('song:' + id, function(s) {
						s.provider = parseInt(id.split(':')[0], 10);
						s.provider_id = id.split(':')[1];
						album.songs[index] = s;
						if(!s.bestMatch) return cb();
						DATA.getItem('song:' + s.bestMatch, function(bm) {
							bm.provider = parseInt(s.bestMatch.split(':')[0], 10);
							bm.provider_id = s.bestMatch.split(':')[1];
							s.bestMatch = bm;
							cb();
						});
					});
				});
			});
		},
		add : function(data, callback) {
			DATA.getItem('albums', function(albums) {
				albums = albums || [];
				if(albums.indexOf(data.id) !== -1) return callback && callback(data.id);
				albums.unshift(data.id);
				var album = {
						artist : {
							mbid : LIB.escapeHTML(data.artist.mbid),
							name : LIB.escapeHTML(data.artist.name)
						},
						title : LIB.escapeHTML(data.title),
						image : LIB.escapeHTML(data.image),
						songs : [],
						tags : []
					},
					count = data.songs.length,
					cb = function() {
						DATA.setItem('album:' + data.id, album, function() {
							DATA.setItem('albums', albums, function() {
								callback && callback(data.id);
							});
						});
					};

				data.tags.forEach(function(t) {
					album.tags.push(LIB.escapeHTML(t.name));
				});
				if(count === 0) return cb();
				data.songs.forEach(function(s, index) {
					var id = DATA.providers.lastfm + ':' + LIB.escapeHTML(s.provider_id),
						add = function() {
							album.songs[index] = id;
							count--;
							if(count > 0) return;
							cb();
						};

					DATA.getItem('song:' + id, function(song) {
						if(song) return add();
						DATA.setItem('song:' + id, {
							title : LIB.escapeHTML(s.title),
							time : parseInt(s.time, 10),
							artist : {
								mbid : LIB.escapeHTML(s.artist.mbid),
								name : LIB.escapeHTML(s.artist.name)
							}
						}, add);
					});
				});
			});
		},
		remove : function(id, callback) {
			DATA.getItem('albums', function(albums) {
				var index = albums.indexOf(id);
				if(index === -1) return callback && callback();
				albums.splice(index, 1);
				DATA.setItem('albums', albums, function() {
					DATA.removeItem('album:' + id, callback);
				});
			});
		}
	},
	loved : {
		getAll : function(callback) {
			DATA.getItem('loved', function(loved) {
				var cb = function() {
						count--;
						if(count > 0) return;
						callback(loved);
					};

				loved = loved || [];
				if(!loved.length) return callback(loved);
				var count = loved.length;
				loved.forEach(function(id, index) {
					DATA.getItem('song:' + id, function(s) {
						s.provider = parseInt(id.split(':')[0], 10);
						s.provider_id = id.split(':')[1];
						loved[index] = s;
						if(!s.bestMatch) return cb();
						DATA.getItem('song:' + s.bestMatch, function(bm) {
							bm.provider = parseInt(s.bestMatch.split(':')[0], 10);
							bm.provider_id = s.bestMatch.split(':')[1];
							s.bestMatch = bm;
							cb();
						});
					});
				});
			});
		},
		add : function(songs, callback) {
			DATA.getItem('loved', function(loved) {
				loved = loved || [];

				var index = 0, //TODO: This will be used for adding into a defined position (dragging)
					count = songs.length;
				
				songs.forEach(function(s) {
					var id = parseInt(s.provider, 10) + ':' + LIB.escapeHTML(s.provider_id),
						add = function() {
							loved.splice(index, 0, id);
							index++;
							count--;
							if(count > 0) return;
							DATA.setItem('loved', loved, callback);
						};

					if(loved.indexOf(id) !== -1) {
						count--;
						return;
					}

					DATA.getItem('song:' + id, function(song) {
						if(song) return add();
						song = {
							title : LIB.escapeHTML(s.title),
							time : parseInt(s.time, 10)
						};
						s.artist && (song.artist = {
							mbid : LIB.escapeHTML(s.artist.mbid),
							name : LIB.escapeHTML(s.artist.name)
						});
						DATA.setItem('song:' + id, song, add);
					});
				});
			});
		},
		remove : function(id, callback) {
			DATA.getItem('loved', function(loved) {
				loved = loved || [];
				var index = loved.indexOf(id);
				if(index === -1) return callback && callback();
				loved.splice(index, 1);
				DATA.setItem('loved', loved, callback);
			});
		},
		check : function(id, callback) {
			DATA.getItem('loved', function(loved) {
				loved = loved || [];
				var index = loved.indexOf(id);
				if(index === -1) return callback(false);
				callback(true);
			});
		}
	},
	clear : function() {
		if(!window.chrome || !window.chrome.storage) window.localStorage.clear();
		else window.chrome.storage.sync.clear();
	},
	import : function() {
		$('<input type="file" />')
			.change(function(e) {
				if(!e.target.files[0]) return;
		        var r = new FileReader();
		        r.onload = function(e) {
		        	try {
						var backup = JSON.parse(e.target.result);
					} catch(e) { return; }
					
					DATA.clear(); //Be careful!.. this will delete all your data ;P
					backup.songs && backup.songs.forEach(function(s) {
						var id = s.provider + ':' + s.provider_id;
						delete s.provider;
						delete s.provider_id;
						DATA.setItem('song:' + id, s);
					});
					if(backup.playlists) {
						var playlists = [];
						backup.playlists.forEach(function(p, i) {
							var id = backup.playlists.length - i;
							playlists.push(id);
							DATA.setItem('playlist:' + id, p);
						});
						DATA.setItem('playlists', playlists);
					}
					if(backup.albums) {
						var albums = [];
						backup.albums.forEach(function(a) {
							var id = a.id;
							delete a.id;
							albums.push(id);
							DATA.setItem('album:' + id, a);
						});
						DATA.setItem('albums', albums);
					}
					backup.loved && DATA.setItem('loved', backup.loved);
					backup.lovedOffline && DATA.setItem('lovedOffline', true);
					RELOAD();
				};
				r.readAsText(e.target.files[0]);
			})
			.click();
	},
	export : function() {
		DATA.playlists.getAll(function(playlistData) {
			DATA.albums.getAll(function(albumData) {
				DATA.getItem('loved', function(lovedData) {
					var backup = {},
						songs = function(data, callback, i) {
							i = i || 0;
							if(!data.length || i >= data.length) return callback(data);
							!backup.songs && (backup.songs = []);
							var id = data[i],
								provider = parseInt(id.split(':')[0], 10),
								provider_id = id.split(':')[1],
								already = false;

							backup.songs.forEach(function(s) {
								if(already) return;
								if(s.provider === provider && s.provider_id === provider_id) return already = true;
							});
							if(already) return songs(data, callback, ++i);
							DATA.getItem('song:' + id, function(s) {
								if(!s) {
									data.splice(i, 1);
									return songs(data, callback, i);
								}
								var song = {
										provider : provider,
										provider_id : provider_id,
										title : LIB.escapeHTML(s.title),
										time : parseInt(s.time, 10)
									},
									cb = function() {
										backup.songs.push(song);
										songs(data, callback, ++i);
									};

								s.artist && (song.artist = {
									mbid : LIB.escapeHTML(s.artist.mbid),
									name : LIB.escapeHTML(s.artist.name)
								});

								if(!s.bestMatch) return cb();
								songs([s.bestMatch], function(match) {
									match[0] && (song.bestMatch = match[0]);
									cb();
								});
							});
						},
						playlists = function() {
							if(!playlistData.length) return albums();
							var data = playlistData.shift(),
								playlist = {
									title : LIB.escapeHTML(data.title)
								};

							data.offline && (playlist.offline = true);
							songs(data.songs, function(songs) {
								playlist.songs = songs;
								!backup.playlists && (backup.playlists = []);
								backup.playlists.push(playlist);
								playlists();
							});
						},
						albums = function() {
							if(!albumData.length) return loved();
							var data = albumData.shift(),
								album = {
									id : data.id,
									artist : {
										mbid : LIB.escapeHTML(data.artist.mbid),
										name : LIB.escapeHTML(data.artist.name)
									},
									title : LIB.escapeHTML(data.title),
									image : LIB.escapeHTML(data.image),
									tags : []
								};
							
							data.offline && (album.offline = true);	
							data.tags.forEach(function(t) {
								album.tags.push(LIB.escapeHTML(t));
							});
							songs(data.songs, function(songs) {
								album.songs = songs;
								!backup.albums && (backup.albums = []);
								backup.albums.push(album);
								albums();
							});
						},
						loved = function() {
							songs(lovedData || [], function(loved) {
								loved.length && (backup.loved = loved);
								DATA.getItem('lovedOffline', function(offline) {
									offline && (backup.lovedOffline = true);
									done();
								});
							});
						},
						done = function() {
							var date = new Date();
							saveAs(new Blob([JSON.stringify(backup)], {type: "text/plain;charset=utf-8"}), 'GatunesBackup-' + date.getFullYear() + LIB.addZero(date.getMonth() + 1) + LIB.addZero(date.getDate()) + '.json');
						};

					playlists();
				});
			});
		});
	}
};

TEMPLATE = {
	playlist : {
		data : function(params, callback) {
			var id = parseInt(params[0], 10);
			delete TEMPLATE.playlist.selectedSongs;
			if(!id) return callback({
				title : L.newPlaylist.replace(/{{date}}/, LIB.formatDate(new Date()))
			});
			DATA.playlists.get(id, function(p) {
				if(!p) return ROUTER.update('/');
				callback(p);
			});
		},
		render : function(data) {
			var form = $('section form');
			form.submit(TEMPLATE.playlist.search);
			$('section div.half menu li a').each(function(i, a) {
				a = $(a);
				a.click(function() {
					$('li', a.parents('menu').first()).removeClass('selected');
					a.parent().addClass('selected');
					var p = i + 1,
						pi = $('input[name="provider"]', form); 
					
					if(parseInt(pi.val(), 10) === p) return;
					pi.val(p);
					form.submit();
				});
			});
			var actions = $('div.header menu.actions');
			$('a.remove', actions).click(function() {
				$(this).parent().hide().next().show();
			});
			$('a.cancel', actions).click(function() {
				$(this).parent().hide().prev().show();
			});
			$('a.ok', actions).click(function() {
				DATA.playlists.remove(parseInt(data.dataKey.split(':')[1], 10), function() {
					ROUTER.update('/');
				});
			});
			$('button.offline', actions).click(function() {
				DATA.getItem(data.dataKey, function(playlist) {
					if(playlist.offline) delete playlist.offline;
					else playlist.offline = true;
					DATA.setItem(data.dataKey, playlist, function() {
						ROUTER.update('/playlist/' + data.dataKey.substr(9), true);
					});
				});
			});
			$('button.offline span', actions).html(L.availableOffline + ': ' + (data.offline ? '<strong>ON</strong>' : 'OFF'));
			$('aside menu li' + (data.dataKey ? '[key="' + data.dataKey + '"]' : '.create')).addClass('selected');
			TEMPLATE.playlist.renderSongs(data);
			$('section input').first().focus();
			$(window).bind('mousedown', TEMPLATE.playlist.resetSelection);
			ROUTER.onUnload = function() {
				$(window).unbind('mousedown', TEMPLATE.playlist.resetSelection);
			};
		},
		renderSongs : function(playlist) {
			var dest = $('section table').first(),
				songs = playlist.songs;

			dest.empty();
			if(!songs || !songs.length) {
				var tr = $('<tr><td class="empty">' + L.emptyPlaylist + '</td></tr>');
				TEMPLATE.song.hookDrop(tr);
				return dest.append(tr);
			}
			DATA.getItem('loved', function(loved) {
				loved = loved || [];
				songs.forEach(function(s, i) {
					s.num = LIB.addZero(i + 1);
					loved.indexOf(s.provider + ':' + s.provider_id) !== -1 && (s.love = true);
					TEMPLATE.playlist.song(s, dest, playlist);
				});
				TEMPLATE.playlist.setPlayingSong();
			});
		},
		search : function(e) {
			LIB.cancelHandler(e);
			var dest = $('section div.border table').first(),
				query = $(e.target.query).val(),
				provider = parseInt($(e.target.provider).val(), 10) || DATA.providers.youtube;

			if(query === '') return;
			$(e.target).next().show();
			dest.empty();
			switch(provider) {
				case DATA.providers.youtube:
					var renderYT = function(feed, query, page, r, count, dest) {
							if(r.entry) {
								r.entry.forEach(function(e) {
									if(count === 100 /*|| (e.app$control && e.app$control.yt$state && e.app$control.yt$state.name === 'restricted')*/) return;
									var s = {
											num : LIB.addZero(count + 1),
											id : 'searchYT' + feed + (query || '') + count,
											provider : DATA.providers.youtube,
											provider_id : e.id.$t.substr(e.id.$t.lastIndexOf('/') + 1),
											title : e.title.$t,
											time : parseInt(e.media$group.yt$duration ? e.media$group.yt$duration.seconds : 0, 10),
											search : true
										};
									
									e.yt$hd && (s.hd = true);
									TEMPLATE.playlist.song(s, dest);
									count++;
								});
								
								page++;
								if(count < 100 && r.openSearch$totalResults.$t > page * 50) {
									setTimeout(function() {
										YT.search(feed, query, page, function(r) {
											renderYT(feed, query, page, r, count, dest);
										});
									}, 10 * page);
								}
							} else if(page === 0 && count === 0) dest.text("no youtube videos found.");
						};
					
					YT.search('videos', query, 0, function(r) {
						renderYT('videos', query, 0, r, 0, dest);
						dest.parent().show();
					});
				break;
				case DATA.providers.soundcloud:
					SC.search(query, function(r) {
						r.forEach(function(t, i) {
							var s = {
									num : LIB.addZero(i + 1),
									id : 'searchSC' + query + i,
									provider : DATA.providers.soundcloud,
									provider_id : t.id,
									title : t.user.username + ' - ' + t.title,
									time : Math.round(t.duration / 1000),
									search : true
								};

							TEMPLATE.playlist.song(s, dest);
						});
						if(r.length === 0) {
							dest.text("no soundcloud songs found.");
						} else {
							SC.reqArtworks();
						}
						dest.parent().show();
					});
				break;
			}
		},
		song : function(song, dest, playlist) {
			var tr = $(Handlebars.partials.song(song)),
				h1 = $('section .header h1'),
				download = function() {
					--playlist.songsToMatch === 0 && playlist.offline && navigator.onLine && TEMPLATE.playlist.download(playlist);
				},
				lmf = function(match, play) {
					TEMPLATE.song.localMatch(match, playlist, function(localMatch) {
						!play && download();
						if(!localMatch && !navigator.onLine) return tr.addClass('error');
						if(!play) return;
						PLAYER.queue = playlist.songs;
						PLAYER.queueDataKey = playlist.dataKey;
						PLAYER.load(tr[0].rowIndex);
						$('li.title a', 'footer').attr('href', '/playlist/' + playlist.id);
					});
				},
				cf = function(play) {
					if(!song.search) {
						if(song.provider !== DATA.providers.lastfm) return lmf(song, play);
						return TEMPLATE.song.bestMatch(song, function(match) {
							if(!match) {
								!play && download();
								return tr.addClass('error');
							}
							lmf(match, play);
						});
					}

					var dataKey = h1.attr("key"),
						add = function() {
							var id = dataKey.split(':')[1];
							DATA.playlists.addSongs(id, [song], function() {
								DATA.playlists.get(id, function(playlist) {
									TEMPLATE.playlist.renderSongs(playlist);
								});
							});
						};
					
					if(dataKey === 'undefined') return DATA.playlists.add(h1.attr("value"), function(id) {
						dataKey = 'playlist:' + id; 
						h1.attr("key", dataKey);
						add();
					});
					add();
				};

			$(tr).dblclick(cf);
			$('a.play', tr).click(cf);
			TEMPLATE.song.hookDrag(tr, song);
			if(!song.search) {
				TEMPLATE.song.hookLove(tr, song);
				TEMPLATE.song.hookReplace(tr, song);
				if(!song.album) {
					$('a.remove', tr).click(function() {
						var dataKey = h1.attr("key");
						if(dataKey === 'undefined') return;
						var id = dataKey.split(':')[1];
						DATA.playlists.removeSong(id, tr[0].rowIndex, song.provider, song.provider_id, function() {
							DATA.playlists.get(id, function(playlist) {
								TEMPLATE.playlist.renderSongs(playlist);
							});
						});
					});
					TEMPLATE.song.hookDrop(tr, song);
				}
			}
			dest.append(tr);
			!song.search && setTimeout(function() {
				!playlist.songsToMatch && (playlist.songsToMatch = 0);
				playlist.songsToMatch++;
				cf();
			}, song.provider !== DATA.providers.lastfm || song.bestMatch ? 0 : tr[0].rowIndex * 100);
		},
		resetSelection : function() {
			var sel = TEMPLATE.playlist.selectedSongs;
			if(!sel) return;
			sel.forEach(function(s) {
				s.tr.removeClass('selected');
			});
			delete TEMPLATE.playlist.selectedSongs;
		},
		setPlayingSong : function() {
			if(!PLAYER.current) return;
			var t = $('section#playlist table').first();
			!t.length && (t = $('section#album table').first());
			!t.length && (t = $('section#loved table').first());
			if(!t.length || PLAYER.queueDataKey !== $('section .header h1').attr("key")) return;
			$('tr', t).removeClass('playing');
			$('tr a.play i', t).attr('class', 'icon-play');
			var tr = $('tr:nth-child(' + (PLAYER.queueId + 1) + ')', t);
			tr.addClass('playing');
			$('a.play i', tr).attr('class', 'icon-headphones');
		},
		downloadQueue : [],
		download : function(playlist, force) {
			var songs = playlist.songs.slice(0),
				i = 0,
				download = function() {
					if(!songs.length) return downloadCover();
					var song = songs.shift(),
						progress,
						err,
						cb = function(url) {
							var tmout = setTimeout(function() {
								if($('section .header h1').attr("key") !== playlist.dataKey) return;
								$('td.time', $('tr:nth-child(' + i + ')', $('section table').first())).children().first().before(progress = $('<div class="progress progress-striped active"><div class="bar"></div></div>'));
							}, 100);
							DOWNLOAD.start(url, s.provider + '_' + s.provider_id, LIB.addZero(i) + ' ' + song.title, playlist, function(e, file) {
								if(err) return;
								err = true;
								progress && progress.remove();
								clearTimeout(tmout);
								download();
							}, function(data) {
								if(!progress) return;
								progress.children().first().text(data.percent + '%' + (data.eta !== '--:--' ? ' (' + data.eta + ')' : ''));
							});
						};
					
					var s = song;
					s.provider === DATA.providers.lastfm && (s = s.bestMatch);

					i++;

					if(!s || s.localMatch) return download();

					switch(s.provider) {
						case DATA.providers.youtube:
							cb('http://youtube.com/watch?v=' + s.provider_id);
						break;
						case DATA.providers.soundcloud:
							SC.get(s.provider_id, function(data) {
								if(!data) return download();
								cb(data.permalink_url);
							});
						break;
						default:
							return download();
					}	
				},
				downloadCover = function() {
					if(!playlist.image || playlist.offlineImage) return done();
					DOWNLOAD.cover(playlist, function(cover) {
						if(!cover) return done();
						DATA.getItem(playlist.dataKey, function(data) {
							data.offlineImage = cover;
							DATA.setItem(playlist.dataKey, data, done);
						});
					});
				},
				done = function() {
					TEMPLATE.playlist.downloadQueue.shift();
					TEMPLATE.playlist.downloadQueue.length && TEMPLATE.playlist.download(TEMPLATE.playlist.downloadQueue.shift(), true);
				};

			var already = false;
			TEMPLATE.playlist.downloadQueue.forEach(function(p) {
				if(already) return;
				p.dataKey === playlist.dataKey && (already = p);
			});
			if(already) return;
			TEMPLATE.playlist.downloadQueue.push(playlist);
			if(!force && TEMPLATE.playlist.downloadQueue.length > 1) return;
			download();
		}
	},
	song : {
		hookDrag : function(tr, song) {
			LIB.preventSelection(tr, function(e) {
				var sel = TEMPLATE.playlist.selectedSongs,
					data = {
						song : song,
						tr : tr
					};

				!sel && (sel = []);
				var already = false;
				sel.forEach(function(s, i) {
					if(already !== false) return;
					s.tr[0].parentNode === tr[0].parentNode && s.tr[0].rowIndex === tr[0].rowIndex && (already = i);
				});
				if(e.metaKey || e.controlKey || e.shiftKey) { //case for e.shiftKey should be different...
					if(already !== false) {
						sel[already].tr.removeClass('selected');
						sel.splice(already, 1);
					} else {
						tr.addClass('selected');
						sel.push(data);
					}
				} else if(already === false) {
					TEMPLATE.playlist.resetSelection();
					tr.addClass('selected');
					sel = [data];
				}
				sel.sort(function(a, b) {
					var x = a.tr[0].rowIndex,
						y = b.tr[0].rowIndex;

					return ((x < y) ? -1 : ((x > y) ? 1 : 0));
				});
				TEMPLATE.playlist.selectedSongs = sel;

				var ltr;
				LIB.drag(e, {
					title : sel.length > 1 ? sel.length + ' songs' : sel.length ? sel[0].song.title : '',
					type : 'songs',
					data : sel
				}, function() {
					if(song.album || song.loved) return;
					ltr = $('<tr class="ltr"><td colspan="3"/></tr>');
					$('section table').first().append(ltr);
					TEMPLATE.song.hookDrop(ltr);
				}, function() {
					ltr && ltr.remove();
					ltr = null;
				});
			});
		},
		hookDrop : function(tr, song) {
			tr[0].drop = {
				types : ['songs'],
				check : function(o) {
					var sel = TEMPLATE.playlist.selectedSongs,
						inSel = false;

					sel.forEach(function(s) {
						if(inSel) return;
						s.tr[0].parentNode === tr[0].parentNode && s.tr[0].rowIndex === tr[0].rowIndex && (inSel = 1);
					});
					return inSel === false && (sel[sel.length - 1].song.search || sel[sel.length - 1].tr[0].rowIndex !== tr[0].rowIndex - 1);
				},
				cb : function(o) {
					var h1 = $('section .header h1'),
						dataKey = h1.attr("key"),
						songs_add = [],
						songs_reorder = [],
						add = function() {
							if(!songs_add.length) return done();
							var cb = function() {
									DATA.playlists.addSongs(dataKey.split(':')[1], songs_add, done, song ? tr[0].rowIndex : null);
								};

							if(dataKey === 'undefined') return DATA.playlists.add(h1.attr("value"), function(id) {
								dataKey = 'playlist:' + id; 
								h1.attr("key", dataKey);
								cb();
							});
							cb();
						},
						done = function() {
							DATA.playlists.get(dataKey.split(':')[1], function(playlist) {
								TEMPLATE.playlist.renderSongs(playlist);
							});
						};
					
					o.data.forEach(function(d) {
						if(d.song.search || d.song.album || d.song.loved) songs_add.push(d.song);
						else {
							d.song.index = d.tr[0].rowIndex;
							songs_reorder.push(d.song);
						}
					});

					TEMPLATE.playlist.resetSelection();

					if(!songs_reorder.length) return add();
					DATA.playlists.reorderSongs(dataKey.split(':')[1], songs_reorder, add, song ? tr[0].rowIndex : null);
				}
			}
		},
		localMatch : function(s, p, callback) {
			if(s.localMatch) return callback && callback(s.localMatch);
			DOWNLOAD.check(s.provider + '_' + s.provider_id, p, function(localMatch, path) {
				localMatch && (s.localMatch = path + '/' + localMatch);
				callback && callback(s.localMatch);
			});
		},
		bestMatch : function(s, callback, replace) {
			if(!replace && s.bestMatch) return callback && callback(s.bestMatch);
			if(!navigator.onLine) return callback && callback();
			var title = s.artist.name + ' ' + s.title,
				getWords = function(str) {
					var ws = [];
					str.split(' ').forEach(function(w) {
						w = w.toLowerCase().trim();
						ws.indexOf(w) === -1 && ws.push(w);
					});
					return ws;
				},
				words = getWords(title),
				titleWords = getWords(s.title),
				badWords = function() {
					var bw = [
							'cover',
							'live',
							'edit',
							'remix',
							'reversed',
							'backwards',
							'lesson',
							'tribute'
						], l = bw.length;

					for(var x=0; x<l; x++) {
						if(words.indexOf(bw[x]) !== -1) {
							bw.splice(x, 1);
							x--;
							l--;
						}
					}
					return bw;
				}(),
				songs = [],
				c = 0,
				process = function() {
					c++;
					if(c < 2) return;
					songs.forEach(function(ss) {
						var sWords = getWords(ss.title.replace(/ - /g, ' ').replace(/ \/ /g, ' ')),
							wCount = 0,
							titleWCount = 0,
							bwCount = 0;

						words.forEach(function(w) {
							if(sWords.indexOf(w) === -1) return;
							wCount++; 
							titleWords.indexOf(w) !== -1 && titleWCount++;
							
						});

						badWords.forEach(function(w) {
							sWords.indexOf(w) !== -1 && bwCount++;		
						});

						ss.timeDiff = Math.abs(ss.time - s.time);
						ss.wCount = wCount;
						ss.bwCount = bwCount;
						ss.exactMatch = wCount === sWords.length;
						ss.titleMatch = titleWCount === titleWords.length;
					});
					songs.sort(function(a, b) {
						return b.bwCount > a.bwCount ? -1 : (b.bwCount < a.bwCount ? 1 : 
							(a.exactMatch > b.exactMatch ? -1 : (a.exactMatch < b.exactMatch ? 1 : 
								(a.titleMatch > b.titleMatch ? -1 : (a.titleMatch < b.titleMatch ? 1 : 
									(a.wCount > b.wCount ? -1 : (a.wCount < b.wCount ? 1 : 
										(b.timeDiff > a.timeDiff ? -1 : (b.timeDiff < a.timeDiff ? 1 : 
											(a.hd > b.hd ? -1 : (a.hd < b.hd ? 1 :
												(b.providerRanking > a.providerRanking ? -1 : (b.providerRanking < a.providerRanking ? 1 :
							0)))))))))))));
					});
					if(replace) callback(songs);
					else {
						if(songs[0] && songs[0].wCount >= titleWords.length) {
							s.bestMatch = songs[0];
							DATA.getItem('song:' + s.bestMatch.provider + ':' + s.bestMatch.provider_id, function(match) {
								if(!match) DATA.setItem('song:' + s.bestMatch.provider + ':' + s.bestMatch.provider_id, {
									title : LIB.escapeHTML(s.bestMatch.title),
									time : parseInt(s.bestMatch.time, 10)
								});
								DATA.getItem('song:' + s.provider + ':' + s.provider_id, function(song) {
									if(!song) song = {
										title : LIB.escapeHTML(s.title),
										time : parseInt(s.time, 10),
										artist : {
											mbid : LIB.escapeHTML(s.artist.mbid),
											name : LIB.escapeHTML(s.artist.name)
										}
									};
									song.bestMatch = s.bestMatch.provider + ':' + s.bestMatch.provider_id;
									DATA.setItem('song:' + s.provider + ':' + s.provider_id, song);
								});
							});
						}
						callback && callback(s.bestMatch);
					}
				};

			YT.search('videos', title, 0, function(r) {
				r.entry && r.entry.forEach(function(e, i) {
					var provider_id = e.id.$t.substr(e.id.$t.lastIndexOf('/') + 1);
					if(replace && replace.provider === DATA.providers.youtube && replace.provider_id === provider_id) return;
					songs.push({
						providerRanking : i,
						provider : DATA.providers.youtube,
						provider_id : provider_id,
						title : e.title.$t,
						time : parseInt(e.media$group.yt$duration ? e.media$group.yt$duration.seconds : 0, 10),
						hd : e.yt$hd ? true : false
					});
				});
				process();
			});
			SC.search(title, function(r) {
				r.forEach(function(t, i) {
					if(replace && replace.provider === DATA.providers.soundcloud && replace.provider_id === t.id) return;
					songs.push({
						providerRanking : i,
						provider : DATA.providers.soundcloud,
						provider_id : t.id,
						title : t.user.username + ' - ' + t.title,
						time : Math.round(t.duration / 1000)
					});
				});
				process();
			});
		},
		hookLove : function(tr, song) {
			$('a.love', tr).click(function() {
				var i = $('i', this),
					id = song.provider + ':' + song.provider_id,
					cb = function(loved) {
						return function() {
							i.attr('class', 'icon-' + (loved ? 'ok' : 'heart'));
						}
					};
							
				DATA.loved.check(id, function(loved) {
					if(loved) return DATA.loved.remove(id, cb(false));
					else DATA.loved.add([song], cb(true));
				});
			});
		},
		hookReplace : function(tr, song) {
			$('a.replace', tr).click(function() {
				if(!song.bestMatch) return;
				var close = function() {
						$('div.modal-backdrop').remove();
						$('div.modal').remove();
					},
					backdrop = $('<div class="modal-backdrop hidden" />'),
					modal = $(Handlebars.partials.replace({})),
					table = $('table tbody', modal);

				backdrop.click(close);
				close();
				$('h2', modal).text(L.replace + ' ' + song.title);
				$('body').append(backdrop);
				$('body').append(modal);
				TEMPLATE.song.bestMatch(song, function(matches) {
					table.empty();
					if(!matches.length) {
						table.append($('<tr><td class="empty">No matches found!</td></tr>'));
						return tr.addClass('error');
					}
					matches.forEach(function(s, i) {
						s.num = LIB.addZero(i + 1);
						s.search = true;
						var tr = $(Handlebars.partials.song(s)),
							td = $('<td class="image" />'),
							div = $('<div />'),
							img = $('<img />');

						switch(s.provider) {
				    		case DATA.providers.youtube:
				    			img.attr('src', 'http://i.ytimg.com/vi/' + s.provider_id + '/default.jpg');
				    		break;
				    		case DATA.providers.soundcloud:
				    			if(SC.artworks[s.provider_id]) img.attr('src', SC.artworks[s.provider_id].replace(/crop.jpg/, 'large.jpg'));
								else if(!SC.artworks_err[s.provider_id]) {
									if(SC.artworks_req.indexOf(s.provider_id) === -1) SC.artworks_req.push(s.provider_id);
									img.addClass('scart' + s.provider_id);
								}
				    	}
				    	img.load(function() {
				    		var s = 50;
				    		if(img.width() > img.height()) {
				    			var w = img.width() * s / img.height();
				    			img.css('height', s);
				    			img.css('width', w);
				    			img.css('left', (w - s) / -2);
				    		} else {
				    			var h = img.height() * s / img.width();
				    			img.css('width', s);
				    			img.css('height', h);
				    			img.css('top', (h - s) / -2);
				    		}
				    	});
				    	div.append(img);
				    	td.append(div);
						$(tr).children().first().after(td);
						$(tr).click(function() {
							song.bestMatch = s;
							DATA.getItem('song:' + s.provider + ':' + s.provider_id, function(match) {
								if(!match) DATA.setItem('song:' + s.provider + ':' + s.provider_id, {
									title : LIB.escapeHTML(s.title),
									time : parseInt(s.time, 10)
								});
								DATA.getItem('song:' + song.provider + ':' + song.provider_id, function(cache) {
									if(!cache) cache = {
										title : LIB.escapeHTML(song.title),
										time : parseInt(song.time, 10),
										artist : {
											mbid : LIB.escapeHTML(song.artist.mbid),
											name : LIB.escapeHTML(song.artist.name)
										}
									};
									cache.bestMatch = s.provider + ':' + s.provider_id;
									DATA.setItem('song:' + song.provider + ':' + song.provider_id, cache);
									close();
								});
							});
						});
						table.append(tr);
					});
					SC.reqArtworks();
				}, song.bestMatch);
				setTimeout(function() {
					backdrop.removeClass('hidden');
					modal.removeClass('hidden');
				}, 0);
			});
		}
	},
	album : {
		data : function(params, callback) {
			var id = params[0];
			delete TEMPLATE.playlist.selectedSongs;
			DATA.albums.get(id, function(album) {
				var cb = function(album) {
						DATA.getItem('loved', function(loved) {
							loved = loved || [];
							album.id = id;
							album.songs.forEach(function(s, i) {
								s.num = LIB.addZero(i + 1);
								s.album = true;
								loved.indexOf(s.provider + ':' + s.provider_id) !== -1 && (s.love = true);
							});
							album.tags.forEach(function(t, i) {
								album.tags[i] = {
									name : t.substr(0, 1).toUpperCase() + t.substr(1),
									link : '/explore/' + t
								};
							});
							callback(album);
						});
					};

				if(album) return cb(album);
				LASTFM.getAlbum(id, function(a) {
					if(!a) return ROUTER.update('/');
					LASTFM.getArtist(null, function(artist) {
						var album = {
								dataKey : 'album:' + id,
								artist : {
									mbid : LIB.escapeHTML(artist.mbid),
									name : LIB.escapeHTML(artist.name),
									link : '/artist/' + LIB.escapeHTML(artist.mbid)
								},
								title : LIB.escapeHTML(a.name),
								image : LIB.escapeHTML(a.image[3]['#text']),
								songs : [],
								tags : []
							},
							tracks = a.tracks.track.length ? a.tracks.track : [a.tracks.track],
							getTracks = function() {
								if(!tracks.length) return cb(album);
								var t = tracks.shift();
								if(!t.mbid) return getTracks();
								DATA.getItem('song:' + DATA.providers.lastfm + ':' + t.mbid, function(s) {
									!s && (s = {
										title : LIB.escapeHTML(t.name),
										time : parseInt(t.duration, 10),
										artist : {
											mbid : LIB.escapeHTML(t.artist.mbid),
											name : LIB.escapeHTML(t.artist.name)
										}
									});
									s.provider = DATA.providers.lastfm;
									s.provider_id = t.mbid;	
									album.songs.push(s);
									if(!s.bestMatch) return getTracks();
									DATA.getItem('song:' + s.bestMatch, function(bm) {
										bm.provider = parseInt(s.bestMatch.split(':')[0], 10);
										bm.provider_id = s.bestMatch.split(':')[1];
										s.bestMatch = bm;
										getTracks();
									});
								});
							};

						a.toptags.tag && (a.toptags.tag.length ? a.toptags.tag : [a.toptags.tag]).forEach(function(t) {
							album.tags.push(LIB.escapeHTML(t.name));
						});
						
						getTracks();
					}, a.artist);
				});
			});
		},
		render : function(data) {
			var songsToMatch = data.songs.length,
				download = function() {
					--songsToMatch === 0 && data.offline && navigator.onLine && TEMPLATE.playlist.download(data);
				};

			data.songs.forEach(function(s, i) {
				var tr = $('section table tr:nth-child(' + (i + 1) + ')'),
					cf = function(play) {
						TEMPLATE.song.bestMatch(s, function(match) {
							if(!match) {
								!play && download();
								return tr.addClass('error');
							}
							TEMPLATE.song.localMatch(match, data, function(localMatch) {
								!play && download();
								if(!localMatch && !navigator.onLine) return tr.addClass('error');
								if(!play) return;
								PLAYER.queue = data.songs;
								PLAYER.queueDataKey = data.dataKey;
								PLAYER.load(i);
								$('li.title a', 'footer').attr('href', '/album/' + data.id);
							});
						});
					};

				tr.dblclick(cf);
				$('a.play', tr).click(cf);
				TEMPLATE.song.hookDrag(tr, s);
				TEMPLATE.song.hookLove(tr, s);
				TEMPLATE.song.hookReplace(tr, s);
				setTimeout(function() {
					cf();
				}, s.bestMatch ? 0 : i * 100);
			});
			TEMPLATE.playlist.setPlayingSong();
			$('section button.store, section button.remove').click(function() {
				var cb = function() {
						ROUTER.update('/album/' + data.id, true);
					};

				if(data.stored) DATA.albums.remove(data.id, cb);
				else DATA.albums.add(data, cb)
			});
			$('section button.offline').click(function() {
				DATA.getItem('album:' + data.id, function(album) {
					if(album.offline) delete album.offline;
					else album.offline = true;
					DATA.setItem('album:' + data.id, album, function() {
						ROUTER.update('/album/' + data.id, true);
					});
				});
			});
			$('section button.offline span').html(L.availableOffline + ': ' + (data.offline ? '<strong>ON</strong>' : 'OFF'));
			$('aside menu li[key="' + data.dataKey + '"]').addClass('selected');
			var cover = $('<img src="' + (data.offlineImage ? '/media' + data.offlineImage : data.image) + '" />'),
				errorHandler = function() {
					DATA.getItem(data.dataKey, function(a) {
						delete a.offlineImage;
						DATA.setItem(data.dataKey, a);
					});
					cover.attr('src', data.image);
					cover.unbind('error', errorHandler);
				};

			data.offlineImage && cover.bind('error', errorHandler);
			$('section div.cover').append(cover);
			navigator.onLine && !data.songs.length && LASTFM.getTopAlbums(data.artist.name, function(albums) {
				var c = 0,
					dest = $('div.empty div');

				dest.empty();
				albums.forEach(function(a) {
					if(c >= 8 || !a.mbid || a.mbid === data.id) return;
					var div = $(Handlebars.partials.album({
							title : a.name,
							link : '/album/' + a.mbid,
							mini : true
						}));

					$('div.img', div).append('<img src="' + a.image[2]['#text'] + '" />');
					dest.append(div);
					c++;
				});
				LIB.handleLinks(dest);
				c > 0 && dest.parent().show().fadeIn('fast');
			}, 16);
			navigator.onLine && LASTFM.similarArtistsAlbums(data.artist.mbid, function(albums) {
				var dest = $('section div.similarAlbums'),
					c = 0;

				dest.empty();
				albums.forEach(function(a) {
					if(c > 5 || !a.mbid || data.id === a.mbid) return;
					var div = $(Handlebars.partials.album({
							title : a.name,
							link : '/album/' + a.mbid,
							mini : true
						}));

					$('div.img', div).append('<img src="' + a.image[1]['#text'] + '" />');
					dest.append(div);
					c++;
				});
				LIB.handleLinks(dest);
			}, 0, 12);
			$(window).bind('mousedown', TEMPLATE.playlist.resetSelection);
			ROUTER.onUnload = function() {
				$(window).unbind('mousedown', TEMPLATE.playlist.resetSelection);
			};
		}
	},
	loved : {
		data : function(params, callback) {
			DATA.loved.getAll(function(songs) {
				songs.forEach(function(s, i) {
					s.num = LIB.addZero(i + 1);
					s.loved = true;
				});
				DATA.getItem('lovedOffline', function(offline) {
					var data = {
							songs : songs,
							dataKey : 'loved',
							title : L.loved //For the downloader...
						};

					offline && (data.offline = true);
					callback(data);
				});
			});
		},
		render : function(data) {
			var songsToMatch = data.songs.length,
				download = function() {
					--songsToMatch === 0 && data.offline && navigator.onLine && TEMPLATE.playlist.download(data);
				};

			data.songs.forEach(function(s, i) {
				var tr = $('section table tr:nth-child(' + (i + 1) + ')'),
					lmf = function(match, play) {
						TEMPLATE.song.localMatch(match, data, function(localMatch) {
							!play && download();
							if(!localMatch && !navigator.onLine) return tr.addClass('error');
							if(!play) return;
							PLAYER.queue = data.songs;
							PLAYER.queueDataKey = data.dataKey;
							PLAYER.load(i);
							$('li.title a', 'footer').attr('href', '/loved');
						});
					},
					cf = function(play) {
						if(s.provider !== DATA.providers.lastfm) return lmf(s, play);
						TEMPLATE.song.bestMatch(s, function(match) {
							if(!match) {
								!play && download();
								return tr.addClass('error');
							}
							lmf(match, play);
						});
					};

				tr.dblclick(cf);
				$('a.play', tr).click(cf);
				TEMPLATE.song.hookDrag(tr, s);
				TEMPLATE.song.hookReplace(tr, s);
				$('a.remove', tr).click(function() {
					DATA.loved.remove(s.provider + ':' + s.provider_id);
				});
				setTimeout(function() {
					cf();
				}, s.provider !== DATA.providers.lastfm || s.bestMatch ? 0 : i * 100);
			});
			TEMPLATE.playlist.setPlayingSong();
			$('section button.offline').click(function() {
				var cb = function() {
						ROUTER.update('/loved', true);
					};

				if(data.offline) DATA.removeItem('lovedOffline', cb);
				else DATA.setItem('lovedOffline', true, cb);
			});
			$('section button.offline span').html(L.availableOffline + ': ' + (data.offline ? '<strong>ON</strong>' : 'OFF'));
			$('aside menu li.loved').addClass('selected');
			$(window).bind('mousedown', TEMPLATE.playlist.resetSelection);
			ROUTER.onUnload = function() {
				$(window).unbind('mousedown', TEMPLATE.playlist.resetSelection);
			};
		}
	},
	explore : {
		data : function(params, callback) {
			callback({
				tag : params[0],
				offline : !navigator.onLine
			});
		},
		render : function(data) {
			var dest = $('section div.padding'),
				page = 1,
				getAlbums = function() {
					if(data.tag) {
						LASTFM.getTagAlbums(data.tag, renderAlbums, page);
					} else {
						LASTFM.getTopArtistsAlbums(renderAlbums, page);
					}
				},
				renderAlbums = function(albums) {
					DATA.getItem('albums', function(userAlbums) {
						userAlbums = userAlbums || [];
						albums.forEach(function(a) {
							if(!a.mbid || userAlbums.indexOf(a.mbid) !== -1) return;
							var div = $(Handlebars.partials.album({
									title : a.artist.name + ' - ' + a.name,
									link : '/album/' + a.mbid
								}));

							$('div.img', div).append('<img src="' + a.image[2]['#text'] + '" />');
							dest.append(div);
						});
						LIB.handleLinks('section');
						!$('a', dest).length && dest.append('<p class="empty">' + L.emptyHomeTag + '</p>');
						LIB.onSectionScroll(albums.length === 50, function() {
							page++;
							getAlbums();
						});
					});
				};

			getAlbums();
			
			var renderTags = function(tags) {
					var dest = $('section div.tags');
					dest.empty();
					tags.forEach(function(t) {
						dest.append('<a href="/explore/' + t.name.replace(/"/g, '') + '">' + t.name.substr(0, 1).toUpperCase() + t.name.substr(1) + '</a>')
					});
					LIB.handleLinks(dest);
				};

			if(data.tag) LASTFM.getSimilarTags(data.tag, renderTags);
			else LASTFM.getTopTags(renderTags);
		},
		initSearch : function() {
			var autofill = $('aside form ul'),
				input = $('aside form input[type="text"]'),
				timeout,
				lastQuery,
				submit = function() {
					var query = input.val().trim();
					if(query === '') return;
					autofill.scrollTop(0);
					if(query === lastQuery) {
						autofill.parent().addClass('autofill');
						$(window).bind('mouseup', hide);
						return;
					}
					lastQuery = query;
					var ah = $('<li class="header" style="display:none">' + L.artists + '</li>'),
						gh = $('<li class="header" style="display:none">' + L.genres + '</li>'),
						handleLink = function(a) {
							a.click(function(e) {
								$('li', autofill).removeClass('selected');
								a.parent().addClass('selected');
								LIB.handleLink(e, true);
							});
						};

					autofill.empty()
						.append(ah)
						.append(gh)
						.parent().removeClass('autofill');
					
					LASTFM.searchArtists(query, function(artists) {
						var c = 0,
							tophit;

						artists && artists.forEach(function(artist) {
							if(c > 3 || !artist.mbid) return;
							var li = $('<li' + (c === 0 ? ' class="selected"' : '') + '></li>'),
								a = $('<a href="/artist/' + artist.mbid + '">' + artist.name + '</a>');

							handleLink(a);
							li.append(a);
							gh.before(li);
							c === 0 && (tophit = artist.mbid);
							c++;
						});
						if(c === 0) return;
						ah.show();
						autofill.parent().addClass('autofill');
						tophit && ROUTER.update('/artist/' + tophit);
					});
					LASTFM.searchTags(query, function(tags) {
						var c = 0;
						tags && tags.forEach(function(t) {
							if(c > 3) return;
							var li = $('<li></li>'),
								a = $('<a href="/explore/' + t.name.replace(/"/g, "'") + '">' + t.name.substr(0, 1).toUpperCase() + t.name.substr(1) + '</a>');

							handleLink(a);
							li.append(a);
							autofill.append(li);
							c++;
						});
						if(c === 0) return;
						gh.show();
						autofill.parent().addClass('autofill');
					});
					$(window).bind('mouseup', hide);
				},
				hide = function(e) {
					if(e.target === input[0]) return;
					$(window).unbind('mouseup', hide);
					autofill.parent().removeClass('autofill');
				};

			input.keyup(function(e) {
				timeout && clearTimeout(timeout);
				switch(e.keyCode) {
					case 13:
						if(!autofill.parent().hasClass('autofill')) return submit();
						$('li.selected a', autofill).click();
						hide({});
					break;
					case 38:
						var sel = $('li.selected', autofill);
						if(sel.prev().length) {
							sel.prev().hasClass('header') && (sel = sel.prev());
							if(!sel.prev().length) return;
							$('li', autofill).removeClass('selected');
							sel.prev().addClass('selected')[0].scrollIntoView();
							LIB.cancelHandler(e);
						}
					break;
					case 40:
						if(!autofill.parent().hasClass('autofill')) return submit();
						var sel = $('li.selected', autofill);
						if(sel.next().length) {
							sel.next().hasClass('header') && (sel = sel.next());
							if(!sel.next().length) return;
							$('li', autofill).removeClass('selected');
							sel.next().addClass('selected')[0].scrollIntoView();
							LIB.cancelHandler(e);
						}
					break;
					default:
						timeout = setTimeout(submit, 500);
				}
			});
			input.click(function(e) {
				if(input.val() === '') return;
				timeout && clearTimeout(timeout);
				submit();
			});
			$('aside form').submit(function(e) {
				LIB.cancelHandler(e);
				submit();
			});
		}
	},
	artist : {
		data : function(params, callback) {
			var id = params[0];
			LASTFM.getArtist(id, function(a) {
				if(!a) return ROUTER.update('/');
				var bio = LIB.escapeHTML(a.bio.content),
					p = bio.indexOf('Read more about ' + a.name + ' on Last.fm.'),
					artist = {
						name : a.name,
						bio : bio,
						image : LIB.escapeHTML(a.image[a.image.length - 1]['#text']),
						members : a.bandmembers ? (a.bandmembers.member.length ? a.bandmembers.member : [a.bandmembers.member]) : [],
						tags : []
					};

				p !== -1 && (artist.bio = artist.bio.substr(0, p - 10));
				a.tags.tag.forEach(function(t) {
					t = t.name;
					artist.tags.push({
						name : t.substr(0, 1).toUpperCase() + t.substr(1),
						link : '/explore/' + t
					});
				});
				callback(artist);
			});
		},
		render : function(data) {
			var dest = $('section div.padding'),
				page = 1,
				getAlbums = function() {
					LASTFM.getTopAlbums(data.name, function(albums) {
						albums.forEach(function(a) {
							if(!a.mbid) return;
							var div = $(Handlebars.partials.album({
									title : a.artist.name + ' - ' + a.name,
									link : '/album/' + a.mbid
								}));

							$('div.img', div).append('<img src="' + a.image[2]['#text'] + '" />');
							dest.append(div);
						});
						LIB.handleLinks('section');
						LIB.onSectionScroll(albums.length === 50, function() {
							page++;
							getAlbums();
						});
					}, false, page);
				};

			getAlbums();
			var members = $('section ul.members');
			data.members.forEach(function(m, i) {
				LASTFM.getArtist(null, function(artist) {
					if(!artist || !artist.mbid) return;
					var li = $('li:nth-child(' + (i + 1) + ')', members),
						a = $('<a href="/artist/' + artist.mbid + '" />');

					a.html(li.html());
					LIB.handleLinks(a);
					li.empty().append(a);
				}, m.name);
			});
		}
	},
	settings : function() {
		var i = $('section input[name="downloadPath"]'),
			f = i.next();

		i.val(DOWNLOAD.getDownloadPath()).click(function() {
			f.click();
		});
		f.attr('nwworkingdir', i.val()).change(function(e) {
			if(!e.target.files[0]) return;
			i.val(e.target.files[0].path);
			e.target.nwworkingdir = i.val();
			DOWNLOAD.setDownloadPath(i.val());
		});
		$('section input[name="extractAudio"]')
			.attr('checked', DOWNLOAD.getExtractAudio)
			.change(function(e) {
				DOWNLOAD.setExtractAudio(e.target.checked);
			});

		$('section button.import').click(DATA.import);
		$('section button.export').click(DATA.export);
		$('section select[name="lang"]')
			.val(L.lang)
			.change(function(e) {
				DATA.setItem('lang', $(e.target).val(), RELOAD);
			});
	}
};

/* Appcache */
window.applicationCache.addEventListener('updateready', function(e) {
	if(window.applicationCache.status !== window.applicationCache.UPDATEREADY) return;
	try {
		window.applicationCache.swapCache();
	} catch(e) {}
	RELOAD();
}, false);

$(window).load(function() {
	/* Handlebars Helpers */
	Handlebars.registerHelper('L', function(id) {
		return L[id] || id;
	});

	Handlebars.registerHelper('or', function(val1, val2, options) {
		if(val1 || val2) return options.fn(this);
		else return options.inverse(this);
	});

	Handlebars.registerHelper('equals', function(val1, val2, options) {
		if(val1 === val2) return options.fn(this);
		else return options.inverse(this);
	});

	Handlebars.registerHelper('empty', function(data, options) {
		if(!data || !data.length) return options.fn(this);
		else return options.inverse(this);
	});

	Handlebars.registerHelper('a', function(title, href, className, icon) {
		title = L[title] || LIB.escapeHTML(title);
		return new Handlebars.SafeString('<a' + (typeof href === 'string' ? ' href="' + href + '"' : '') + (typeof className === 'string' ? ' class="' + className + '"' : '') + '>' + (typeof icon === 'string' ? '<i class="icon-' + icon + '"></i> ' : '') + title + '</a>');
	});

	Handlebars.registerHelper('inline', function(text, key, field, tag) {
		typeof tag !== 'string' && (tag = 'span');
		text = LIB.escapeHTML(text);
		var edit = true;
		return new Handlebars.SafeString('<' + tag + ' ' + (edit ? 'contenteditable="true" key="' + key +'" field="' + field +'" value="' + text.replace(/"/g, "'") + '"' : '') + '>' + text + '</' + tag + '>');
	});

	Handlebars.registerHelper('timeFormatted', function(data) {
		return LIB.formatTime(this.time || 0);
	});

	/* DATA handlers */
	DATA.playlists.onChange = DATA.albums.onChange = function() {
		/* Update Menu */
		DATA.playlists.getAll(function(playlists) {
			DATA.albums.getAll(function(albums) {
				var menu = $('aside menu').last(),
					selected = $('section .header h1').attr("key"),
					h = menu.css('height');

				menu.replaceWith(Handlebars.partials.playlistsMenu({playlists : playlists, albums: albums}));
				menu = $('aside menu').last();
				menu.css('height', h);
				albums.concat(playlists).forEach(function(p) {
					var lnk = $('li[key="' + p.dataKey + '"] a', menu),
						album = p.dataKey.substr(0, 6) === 'album:';

					if(lnk[0]) {
						lnk[0].drop = {
							types : album ? ['albums'] : ['playlists', 'songs'],
							check : function(o) {
								switch(o.type) {
					        		case 'songs':
					        			lnk[0].drop.className = 'dropping';
					        			var err = false;
										o.data.forEach(function(d) {
											var from = $('h1', d.tr.parents('section')).attr("key");
											from && parseInt(from.split(':')[1], 10) === p.id && (err = true); 
										});
										return !err;
					        		break;
					        		case 'albums':
					        		case 'playlists':
					        			lnk[0].drop.className = 'dropping-reorder';
					        			return o.data[0].id !== p.id;		
					        	}		
							},
							cb : function(o) {
								var songs = [];
								o.data.forEach(function(d) {
									songs.push(d.song);
								});
								switch(o.type) {
					        		case 'songs':
					        			DATA.playlists.addSongs(p.id, songs, TEMPLATE.playlist.resetSelection);
					        		break;
					        		case 'albums':
					        		case 'playlists':
					        			DATA.playlists.reorder(o.data[0].id, p.id, album);
					        	}
							}
						};

						LIB.preventSelection(lnk, function(e) {
							var lli;
					        LIB.drag(e, {
					            title : p.title,
					            type : album ? 'albums' : 'playlists',
					            data : [p]
					        }, function() {
					        	lli = $('<li class="lli"><a></a></li>');
					            lli.children()[0].drop = {
							        types : album ? 'albums' : 'playlists',
							        className : 'dropping-reorder',
							        cb : function(o) {
							        	DATA.playlists.reorder(o.data[0].id, null, album);
							        }
							    }
							    if(album) $('li.header', menu).last().before(lli);
							    else menu.append(lli);
					        }, function() {
					            lli.remove();
					            lli = null;
					        });
					    });
					}
				});
				/* menu shadow */
				menu.bind('scroll', function(e) {
					menu.prev()[(menu.scrollTop() > 0 ? 'add' : 'remove') + 'Class']('s');
				});
				LIB.handleLinks('aside menu');
				if(selected) {
					$('aside menu li').removeClass('selected');
					$('aside menu li[key="' + selected + '"]').addClass('selected');
				}
			});
		});
	};

	DATA.loved.onChange = function() {
		/* Update Loved */
		if($('section .header h1').attr("key") !== 'loved') return;
		ROUTER.update('/loved');
	};

	/* Lang detection/setup */
	LIB.setupLang(function() {
		/* Flash plugin check */
		if(!swfobject.hasFlashPlayerVersion("11.0.0")) {
			$('body').append(Handlebars.templates.noFlash({})).fadeIn();
			return;
		}

		/* Render the skin */
		$('body').append(Handlebars.templates.skin({})).fadeIn();
		//LIB.handleSpeech('aside');
		LIB.handleLinks('aside, footer');
		TEMPLATE.explore.initSearch();

		/* Drop Handlers */
		DATA.playlists.onChange();
		$('aside menu li.create a')[0].drop = {
			types : ['songs'],
			cb : function(o) {
				var songs = [];
				o.data.forEach(function(d) {
					songs.push(d.song);
				});
				DATA.playlists.add(L.newPlaylist.replace(/{{date}}/, LIB.formatDate(new Date())), function(id) {
					DATA.playlists.addSongs(id, songs, function() {
						ROUTER.update('/playlist/' + id);
					});
				});
			}
		};
		$('aside menu li.loved a')[0].drop = {
			types : ['songs'],
			cb : function(o) {
				var songs = [];
				o.data.forEach(function(d) {
					songs.push(d.song);
				});
				DATA.loved.add(songs);
			}
		};

		$(window)
			.resize(LIB.onResize)
			.keydown(LIB.onKeyDown)
			.bind('online', function() {
				ROUTER.update(ROUTER.url, true);
			})
			.bind('offline', function() {
				ROUTER.update(ROUTER.url, true);
			});

		FULLSCREEN.onFullscreen = PLAYER.onFullscreen;

		/* Init players */
		PLAYER.init();

		/* Start the app */
		ROUTER.init();
	});
});
