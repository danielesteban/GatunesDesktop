DATA = {
	providers : {
		youtube : 1,
		soundcloud : 2
	},
	onChange : {},
	getItem : function(id, callback) {
		if(!window.chrome.storage) callback(JSON.parse(window.localStorage.getItem(id)));
		else window.chrome.storage.sync.get(id, function(items) {
			callback(items[id]);
		});
	},
	setItem : function(id, value, callback) {
		var onChange = function() {
				var collection = id.split(':')[0];
				DATA.onChange[collection] && DATA.onChange[collection](id.split(':')[1]);
				callback && callback();
			};
		
		if(!window.chrome.storage) {
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
				DATA.onChange[collection] && DATA.onChange[collection](id.split(':')[1]);
				callback && callback();
			};

		if(!window.chrome.storage) {
			window.localStorage.removeItem(id);
			onChange();
		} else window.chrome.storage.sync.remove(id, onChange);
	},
	getPlaylists : function(callback) {
		DATA.getItem('playlists', function(playlists) {
			var data = [],
				cb = function() {
					count--;
					if(count > 0) return;
					callback(data);
				};

			if(!playlists) return callback(data);
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
	getAlbums : function(callback) {
		DATA.getItem('albums', function(albums) {
			var data = [],
				cb = function() {
					count--;
					if(count > 0) return;
					callback(data);
				};

			if(!albums) return callback(data);
			var count = albums.length;
			albums.forEach(function(mbid, index) {
				DATA.getItem('album:' + mbid, function(a) {
					a.mbid = mbid;
					a.dataKey = 'album:' + mbid;
					a.fullTitle = a.artist.name + ' - ' + a.title;
					a.link = '/album/' + mbid;
					data[index] = a;
					cb();
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
			var dataKey = 'playlist:' + id;
			DATA.getItem(dataKey, function(p) {
				p.dataKey = dataKey;
				callback(p);
			});
		},
		render : function(data) {
			var form = $('section form');
			form.submit(TEMPLATE.playlist.search);
			$('section menu li a').each(function(i, a) {
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
			$('aside menu li' + (data.dataKey ? '[key="' + data.dataKey + '"]' : '.createPlaylist')).addClass('selected');
			TEMPLATE.playlist.renderSongs(data.songs);
			$('section input').first().focus();
			$(window).bind('mousedown', TEMPLATE.playlist.resetSelection);
			ROUTER.onUnload = function() {
				$(window).unbind('mousedown', TEMPLATE.playlist.resetSelection);
	    	};
		},
		renderSongs : function(songs) {
			var dest = $('section table').first();
			dest.empty();
			if(!songs || !songs.length) {
				var tr = $('<tr><td class="empty">' + L.emptyPlaylist + '</td></tr>');
				TEMPLATE.playlist.hookReorder(tr);
				return dest.append(tr);
			}
			songs.forEach(function(s, i) {
				s.num = LIB.addZero(i + 1);
				TEMPLATE.song(s, dest);
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
									TEMPLATE.song(s, dest);
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

				            TEMPLATE.song(s, dest);
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
		resetSelection : function() {
			var sel = TEMPLATE.playlist.selectedSongs;
	        if(!sel) return;
	        sel.forEach(function(s) {
	            s.tr.removeClass('selected');
	        });
	        delete TEMPLATE.playlist.selectedSongs;
	    },
	    hookReorder : function(tr, song) {
			tr[0].drop = {
	            types : ['songs'],
	            check : function(o) {
	                var sel = TEMPLATE.playlist.selectedSongs,
	                    inSel = false;

	                sel.forEach(function(s) {
	                    if(inSel) return;
	                    !s.song.search && s.tr[0].rowIndex === tr[0].rowIndex && (inSel = 1);
	                });
	                return inSel === false && (sel[sel.length - 1].song.search || sel[sel.length - 1].tr[0].rowIndex !== tr[0].rowIndex - 1);
	            },
	            cb : function(o) {
	        	    var dataKey = $('section .header h1').attr("key");
	                console.log('reorder', dataKey, o.data, song);
	                //remoteStorage.playlists.reorderSongs(PLAYLIST.current.id, ids, ltr ? null : song);
	            	//delete TEMPLATE.playlist.selectedSongs;
	            }
	        }
	    }
	},
	song : function(song, dest) {
		dest.append(Handlebars.partials.song(song));
		var tr = dest.children().children().last(),
			h1 = $('section .header h1'),
			cf = function() {
				if(!song.search) return PLAYER.load(song);
				var dataKey = h1.attr("key");
				if(dataKey === 'undefined') {
					DATA.getItem('playlists', function(playlists) {
						playlists = playlists || [];
						var newId = 1;
						playlists.forEach(function(id) {
							id >= newId && (newId = id + 1);
						});
						playlists.unshift(newId);
						DATA.setItem('playlists', playlists, function() {
							dataKey = 'playlist:' + newId;
							h1.attr("key", dataKey);
							var playlist = {
								title : LIB.escapeHTML(h1.attr("value")),
								songs : [
									LIB.cleanSong(song)
								]
							};
							DATA.setItem(dataKey, playlist, function() {
								TEMPLATE.playlist.renderSongs(playlist.songs);
							});
						});
					});
				} else {
					DATA.getItem(dataKey, function(playlist) {
						playlist.songs.push(LIB.cleanSong(song));
						DATA.setItem(dataKey, playlist, function() {
							TEMPLATE.playlist.renderSongs(playlist.songs);
						});
					});
				}
			};

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
	            s.song.provider === song.provider && s.song.provider_id === song.provider_id && (already = i);
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
	            title : sel.length > 1 ? sel.length + ' songs' : sel[0].song.title,
	            type : 'songs',
	            data : sel
	        }, function() {
				ltr = $('<tr class="ltr"><td colspan="3"/></tr>');
				$('section table').first().append(ltr);
				TEMPLATE.playlist.hookReorder(ltr);
	        }, function() {
	            ltr && ltr.remove();
	            ltr = null;
	        });
	    });

		$(tr).dblclick(cf);
		$('a.play', tr).click(cf);
		if(song.search) return;
		$('a.remove', tr).click(function() {
			var dataKey = h1.attr("key");
			if(dataKey === 'undefined') return;
			DATA.getItem(dataKey, function(playlist) {
				var r = false;
				playlist.songs.forEach(function(s, i) {
					if(r || s.provider !== song.provider || s.provider_id !== song.provider_id) return;
					playlist.songs.splice(i, 1);
					r = true;
				});
				DATA.setItem(dataKey, playlist, function() {
					TEMPLATE.playlist.renderSongs(playlist.songs);
				});
			});
		});
	    TEMPLATE.playlist.hookReorder(tr, song);
	},
	album : {
		data : function(params, callback) {
			var id = params[0];
			delete TEMPLATE.playlist.selectedSongs;
			if(!id) return callback({
				fullTitle : L.newAlbum
			});
			var dataKey = 'album:' + id;
			DATA.getItem(dataKey, function(a) {
				a.dataKey = dataKey;
				a.fullTitle = a.artist.name + ' - ' + a.title;
				a.songs.forEach(function(s, i) {
					s.num = LIB.addZero(i + 1);
				});
				callback(a);
			});
		},
		render : function(data) {
			$('section form').first().submit(function(e) {
				var values = LIB.getForm(e, ['artist']),
					dest = $('section table');

				if(values === null) return;
				dest.empty();
				LASTFM.getTopAlbums(values.artist, function(albums) {
					DATA.getItem('albums', function(userAlbums) {
						userAlbums = userAlbums || [];
						albums.forEach(function(a) {
							if(!a.mbid || userAlbums.indexOf(a.mbid) !== -1) return;
							dest.append('<tr><td class="img"><iframe src="/image.html#' + a.image[1]['#text'] + '"></iframe></td><td>' + a.artist.name + ' - ' + a.name + '</td>');
							$('td', dest.children().children().last()).click(function() {
								LASTFM.getAlbum(a.mbid, function(data) {
									delete a.artist.url;
									var album = {
										artist : a.artist,
										image : a.image[a.image.length - 1]['#text'],
										title : a.name,
										songs : []
									};
									(data.tracks.track.length ? data.tracks.track : [data.tracks.track]).forEach(function(t) {
										delete t.artist.url;
										album.songs.push({
											artist : t.artist,
											title : t.name,
											time : parseInt(t.duration, 10)
										})
									});
									DATA.getItem('albums', function(albums) {
										albums = albums || [];
										albums.unshift(a.mbid);
										DATA.setItem('albums', albums, function() {
											DATA.setItem('album:' + a.mbid, album, function() {
												ROUTER.update('/album/' + a.mbid);
											});
										});
									});
								});
							});
						});
					});
				});
			});
			$('aside menu li' + (data.dataKey ? '[key="' + data.dataKey + '"]' : '.createAlbum')).addClass('selected');
			data.image && $('section div.cover').html('<iframe src="image.html#' + data.image + '" />');
			if(data.dataKey) {
				data.songs.forEach(function(s, i) {
					var tr = $('section table tr:nth-child(' + (i + 1) + ')'),
						cf = function() {
							if(bestMatch) return PLAYER.load(bestMatch);
							YT.search('videos', title + ' -cover -live', 0, function(r) {
								if(r.entry) {
									r.entry.forEach(function(e) {
										var ss = {
												provider : DATA.providers.youtube,
												provider_id : e.id.$t.substr(e.id.$t.lastIndexOf('/') + 1),
												title : e.title.$t,
												time : parseInt(e.media$group.yt$duration ? e.media$group.yt$duration.seconds : 0, 10)
											},
											timeDiff = Math.abs(ss.time - s.time),
											sWords = ss.title.split(' '),
											wCount = 0;

										words.forEach(function(w) {
											if(sWords.indexOf(w) === -1) return;
											wCount++; 
										});

										if(wCount >= (words.length / 2) && minTimeDiff > timeDiff && maxWCount <= wCount) {
											minTimeDiff = timeDiff;
											maxWCount = wCount;
											bestMatch = ss;
										}
									});
									bestMatch && PLAYER.load(bestMatch);
								}
							});
						},
						title = s.artist.name + ' ' + s.title,
						words = title.split(' '),
						maxWCount = 0, minTimeDiff = s.time,
						bestMatch;

					tr.dblclick(cf);
					$('a.play', tr).click(cf);
				});
			} else $('section input').first().focus();
		}
	}
};

$(window).load(function() {
	/* Handlebars Helpers */
	Handlebars.registerHelper('L', function(id) {
		return L[id] || id;
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
	DATA.onChange.playlist = DATA.onChange.album = function() {
		/* Update Menu */
		DATA.getPlaylists(function(playlists) {
			DATA.getAlbums(function(albums) {
				var menu = $('aside menu'),
					selected = $('section .header h1').attr("key");

				menu.replaceWith(Handlebars.partials.playlistsMenu({playlists : playlists, albums: albums}));
				LIB.handleLinks('aside menu');
				if(!selected) return $('aside menu li').first().addClass('selected');
				$('aside menu li[key="' + selected + '"]').addClass('selected');
			});
		});
	};

	/* Lang detection/setup */
	DATA.getItem('lang', function(cookie_lang) {
		var browser_lang = navigator.language ? navigator.language.substr(navigator.language.length - 2).toLowerCase() : navigator.browserLanguage,
			lang = 'en'; //the default

		if(LANG[cookie_lang]) lang = cookie_lang;    
		else if(LANG[browser_lang]) lang = browser_lang;

		L = LANG[lang];
		DATA.setItem('lang', lang);

		DATA.getPlaylists(function(playlists) {
			DATA.getAlbums(function(albums) {
				/* Render the skin */
				$('body').append(Handlebars.templates.skin({playlists : playlists, albums : albums}));
				LIB.handleLinks('aside');
				$(window).resize(LIB.onResize).keydown(LIB.onKeyDown);

				/* Init players */
				PLAYER.init();

				/* Disable console access */
				/*$(window).contextmenu(function(e) {
					LIB.cancelHandler(e);
				});*/

				/* Start the app */
				if(!window.chrome.storage) ROUTER.init();
				else ROUTER.update('/album' + (playlists.length ? 'playlist/' + playlists[0].id : ''));
			});
		});
	});
});
