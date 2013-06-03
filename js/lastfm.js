LASTFM = {
	api_key : '050700332b4c3df96f22a89ce417f934',
	req : function(method, params, callback) {
		params.api_key = LASTFM.api_key;
		params.format = 'json';
		params.method = method;

		$.get('http://ws.audioscrobbler.com/2.0/', params, callback, 'json');
	},
	getTopAlbums : function(query, callback) {
		LASTFM.req('artist.gettopalbums', {
			artist : query
		}, function(data) {
			callback(data.topalbums && data.topalbums.album ? data.topalbums.album : []);
		});
	},
	getTagAlbums : function(query, callback) {
		LASTFM.req('tag.gettopalbums', {
			tag : query
		}, function(data) {
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
	searchArtists : function(query, callback) {
		LASTFM.req('artist.search', {
			artist : query
		}, function(data) {
			callback(data.results.artistmatches.artist);
		});
	}
};
