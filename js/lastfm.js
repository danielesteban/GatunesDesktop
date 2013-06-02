LASTFM = {
	api_key : '050700332b4c3df96f22a89ce417f934',
	getTopAlbums : function(query, callback) {
		var params = {
				api_key : LASTFM.api_key,
				format : 'json',
				method  : 'artist.gettopalbums',
				artist : query
			};

		$.get('http://ws.audioscrobbler.com/2.0/', params, function(data) {
			callback(data.topalbums.album);
		}, 'json');
	},
	getAlbum : function(mbid, callback) {
		var params = {
				api_key : LASTFM.api_key,
				format : 'json',
				method  : 'album.getInfo',
				mbid : mbid
			};

		$.get('http://ws.audioscrobbler.com/2.0/', params, function(data) {
			callback(data.album);
		}, 'json');
	}
};
