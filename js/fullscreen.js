(function() {
    var
        fullScreen = {
            support: false,
            active: function() { return false; },
            request: function() {},
            cancel: function() {},
            eventName: '',
            prefix: ''
        },
        browserPrefixes = 'webkit moz o ms khtml'.split(' ');
 
    // check for native support
    if (typeof document.cancelFullScreen != 'undefined') {
        fullScreen.support = true;
    } else {
        // check for fullscreen support by vendor prefix
        for (var i = 0, il = browserPrefixes.length; i < il; i++ ) {
            fullScreen.prefix = browserPrefixes[i];
 
            if (typeof document[fullScreen.prefix + 'CancelFullScreen' ] != 'undefined' ) {
                fullScreen.support = true;
 
                break;
            }
        }
    }
 
    // update methods to do something useful
    if (fullScreen.support) {
        fullScreen.eventName = fullScreen.prefix + 'fullscreenchange';
 
        fullScreen.active = function() {
            switch (this.prefix) {
                case '':
                    return document.fullScreen;
                case 'webkit':
                    return document.webkitIsFullScreen;
                default:
                    return document[this.prefix + 'FullScreen'];
            }
        }
        fullScreen.request = function(el) {
            return (this.prefix === '') ? el.requestFullScreen() : el[this.prefix + 'RequestFullScreen']();
        }
        fullScreen.cancel = function(el) {
            return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
        }
    }
 
    // export api
    window.FULLSCREEN = fullScreen;
})();
