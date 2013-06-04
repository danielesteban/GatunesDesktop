LASTFM = {
	api_key : '050700332b4c3df96f22a89ce417f934',
	req : function(method, params, callback) {
		params.api_key = LASTFM.api_key;
		params.format = 'json';
		params.method = method;

		$.get('http://ws.audioscrobbler.com/2.0/', params, callback, 'json');
	},
	getTopAlbums : function(query, callback, limit, page) {
		var params = {
				artist : query
			};

		limit && (params.limit = limit);
		page && (params.page = page);
		LASTFM.req('artist.gettopalbums', params, function(data) {
			callback(data.topalbums && data.topalbums.album ? data.topalbums.album : []);
		});
	},
	getTagAlbums : function(query, callback, page) {
		var params = {
				tag : query
			};

		page && (params.page = page);
		LASTFM.req('tag.gettopalbums', params, function(data) {
			callback(data.topalbums && data.topalbums.album ? data.topalbums.album : []);
		});
	},
	getAlbum : function(mbid, callback) {
		LASTFM.req('album.getInfo', {
			mbid : mbid
		}, function(data) {
			callback(data.album);
		});
	},
	getTopArtistsAlbums : function(callback, page) {
		var params = {};
		page && (params.page = page);
		LASTFM.req('chart.getTopArtists', params, function(data) {
			var albums = [],
				count = data.artists.artist.length,
				cb = function() {
					count--;
					if(count > 0) return;
					callback(albums);
				};

			data.artists.artist.forEach(function(artist, i) {
				LASTFM.getTopAlbums(artist.name, function(artistAlbums) {
					for(var x=0; x<artistAlbums.length; x++) {
						if(!artistAlbums[x].mbid) continue;
						albums[i] = artistAlbums[x];
						break;
					}
					cb();
				}, 2);
			});
		});
	},
	getArtist : function(artist, callback) {
		LASTFM.req('artist.getInfo', {
			artist : artist
		}, function(data) {
			callback(data.artist);
		});
	},
	searchArtists : function(query, callback) {
		LASTFM.req('artist.search', {
			artist : query
		}, function(data) {
			callback(data.results.artistmatches.artist);
		});
	}
};
