/* http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
var saveAs=saveAs||navigator.msSaveBlob&&navigator.msSaveBlob.bind(navigator)||function(e){"use strict";var t=e.document,n=function(){return e.URL||e.webkitURL||e},r=e.URL||e.webkitURL||e,i=t.createElementNS("http://www.w3.org/1999/xhtml","a"),s="download"in i,o=function(n){var r=t.createEvent("MouseEvents");r.initMouseEvent("click",true,false,e,0,0,0,0,0,false,false,false,false,0,null);n.dispatchEvent(r)},u=e.webkitRequestFileSystem,a=e.requestFileSystem||u||e.mozRequestFileSystem,f=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},l="application/octet-stream",c=0,h=[],p=function(){var e=h.length;while(e--){var t=h[e];if(typeof t==="string"){r.revokeObjectURL(t)}else{t.remove()}}h.length=0},d=function(e,t,n){t=[].concat(t);var r=t.length;while(r--){var i=e["on"+t[r]];if(typeof i==="function"){try{i.call(e,n||e)}catch(s){f(s)}}}},v=function(t,r){var f=this,p=t.type,v=false,m,g,y=function(){var e=n().createObjectURL(t);h.push(e);return e},b=function(){d(f,"writestart progress write writeend".split(" "))},w=function(){if(v||!m){m=y(t)}if(g){g.location.href=m}else{window.open(m,"_blank")}f.readyState=f.DONE;b()},E=function(e){return function(){if(f.readyState!==f.DONE){return e.apply(this,arguments)}}},S={create:true,exclusive:false},x;f.readyState=f.INIT;if(!r){r="download"}if(s){m=y(t);i.href=m;i.download=r;o(i);f.readyState=f.DONE;b();return}if(e.chrome&&p&&p!==l){x=t.slice||t.webkitSlice;t=x.call(t,0,t.size,l);v=true}if(u&&r!=="download"){r+=".download"}if(p===l||u){g=e}if(!a){w();return}c+=t.size;a(e.TEMPORARY,c,E(function(e){e.root.getDirectory("saved",S,E(function(e){var n=function(){e.getFile(r,S,E(function(e){e.createWriter(E(function(n){n.onwriteend=function(t){g.location.href=e.toURL();h.push(e);f.readyState=f.DONE;d(f,"writeend",t)};n.onerror=function(){var e=n.error;if(e.code!==e.ABORT_ERR){w()}};"writestart progress write abort".split(" ").forEach(function(e){n["on"+e]=f["on"+e]});n.write(t);f.abort=function(){n.abort();f.readyState=f.DONE};f.readyState=f.WRITING}),w)}),w)};e.getFile(r,{create:false},E(function(e){e.remove();n()}),E(function(e){if(e.code===e.NOT_FOUND_ERR){n()}else{w()}}))}),w)}),w)},m=v.prototype,g=function(e,t){return new v(e,t)};m.abort=function(){var e=this;e.readyState=e.DONE;d(e,"abort")};m.readyState=m.INIT=0;m.WRITING=1;m.DONE=2;m.error=m.onwritestart=m.onprogress=m.onwrite=m.onabort=m.onerror=m.onwriteend=null;e.addEventListener("unload",p,false);return g}(self);

/* general lib */
LIB = {
	cancelHandler : function(e) {
		e.stopPropagation();
		e.preventDefault();
	},
	escapeHTML : function(text) {
		return $('<div/>').html(text).text();
	},
	getForm : function(e, fields, customChecks) {
		LIB.cancelHandler(e);
		
		var values = {},
			err;

		fields.forEach(function(name) {
			if(err) return;
			values[name] = $(e.target[name]).val();
			if(values[name] === '' && (err = true)) return alert('Error: ' + e.target[name].placeholder);
			customChecks && customChecks[name] && (err = customChecks[name](values));
		});

		return err ? null : values;
	},
	handleLink : function(e, preventReload) {
		var t = e.target;
		t.tagName.toLowerCase() !== 'a' && (t = $(t).parents('a')[0]);
		if(t.href) {
			var fullHost = document.location.protocol + '//' + document.location.host,
				p = t.href.indexOf(fullHost),
				url = t.href.substr(p === 0 ? (p + fullHost.length) : 0);

			LIB.cancelHandler(e);
			(!preventReload || url !== ROUTER.url) && ROUTER.update(url);
		}
	},
	handleLinks : function(selector) {
		$('a[href]', selector).click(LIB.handleLink);
	},
	preventSelection : function(a, md) {
		var b = $('body');
		a.mousedown(function(e) {
			var ss = function(e) {
					LIB.cancelHandler(e);
				},
				mu = function(e) {
					//b.css('MozUserSelect', '');
					$(window).unbind('selectstart', ss);
					$(window).unbind('mouseup', mu);
				};
			
			//CHECK.isFirefox() && (b.style.MozUserSelect = 'none');
			$(window).bind('selectstart', ss);
			$(window).bind('mouseup', mu);
			if(md) {
				md(e);
				LIB.cancelHandler(e);
			}
		});
	},
	cordsInsideBox : function(cordX, cordY, boxTop, boxRight, boxBottom, boxLeft) {
		return !(cordX > boxRight || cordX < boxLeft || cordY > boxBottom || cordY < boxTop);
	},
	drag : function(e, data, preCb, postCb) {
		if(e.button === 2) return;
		var b = $('body'),
			initX = e.clientX,
			initY = e.clientY,
			draggin = false,
			drag, drop,
			mm = function(e) {
				if(draggin === false) {
					var offset = 5,
						scroll_offset = 20;
					
					if(LIB.cordsInsideBox(e.clientX, e.clientY, initY - offset, initX + offset, initY + offset, initX - offset)) return;
					
					$('#drag').remove();
					drag = $(Handlebars.partials.drag({title: data.title}));
					b.append(drag);

					draggin = true;
					preCb && preCb();
					b.addClass('draggin');
				}
				
				drag.css('top', e.clientY - 20);
				drag.css('left', e.clientX + 10);
				
				var t = e.target,
					c = 0;

				while(t && !t.drop && t.parentNode && c < 5) {
					t = t.parentNode
					c++;
				}

				if(t && t.drop && t.drop.types.indexOf(data.type) !== -1 && drop !== t && (!t.drop.check || t.drop.check(data))) {
					drop && $(drop).removeClass(drop.drop.className || 'dropping');
					drop = t;
					drag.addClass('dropping');
					$(drop).addClass(drop.drop.className ||'dropping');
				} else if(drop && drop !== t) {
					$(drop).removeClass(drop.drop.className ||'dropping');
					drop = null;
					drag.removeClass('dropping');
				}
			},
			mu = function(e) {
				if(drop) {
					drop.drop.cb(data);
					$(drop).removeClass(drop.drop.className || 'dropping');
					drag.fadeOut('fast', function() {
					   drag.remove();
					});
				} else if(drag) {
					drag.animate({
						top: initY,
						left: initX,
						opacity: 0
					}, function() {
						drag.remove();
					});
				}
				$(window).unbind('mousemove', mm);
				$(window).unbind('mouseup', mu);
				b.removeClass('draggin');
				draggin && postCb && postCb();
				draggin = false;
			};
		
		$(window).bind('mousemove', mm);
		$(window).bind('mouseup', mu);
	},
	inlineOnKeyDown : function(e) {
		if(e.keyCode != 13) return;
		LIB.cancelHandler(e);
		e.target.blur();
	},
	inlineOnBlur : function(e, key, field) {
		var t = $(e.target),
			value = t.text().trim();

		if(value === '') return;
		t.text(value).attr('value', value);
		key !== "undefined" && DATA.getItem(key, function(data) {
			data[field] = value;
			DATA.setItem(key, data);
		});
	},
	addZero : function(str) {
		str = str + '';
		if(str.length < 2) str = '0' + str;
		return str;
	},
	formatTime : function(time, long) {
		var hours = Math.floor(time / 3600),
			minutes = Math.floor((time % 3600) / 60);

		if(long) return (hours > 0 ? hours + 'h ' : '') + (minutes > 0 ? minutes + 'm' : '');
		else return (hours > 0 ? hours + ':' + LIB.addZero(minutes) : minutes) + ":" + LIB.addZero(Math.round(time % 60));
	},
	formatDate : function(date) {
		return L.date.replace(/{{month}}/g, L.months[date.getMonth()]).replace(/{{date}}/g, LIB.addZero(date.getDate()));
	},
	setupLang : function(callback) {
		/* Lang detection/setup */
		DATA.getItem('lang', function(cookie_lang) {
			var browser_lang = navigator.language ? navigator.language.split('-') : [navigator.browserLanguage],
				available_langs = ['en', 'es'],
				lang = 'en'; //the default

			if(available_langs.indexOf(cookie_lang) !== -1) lang = cookie_lang;	   
			else if(available_langs.indexOf(browser_lang[0].toLowerCase()) !== -1) lang = browser_lang[0].toLowerCase();
			else if(browser_lang[1] && available_langs.indexOf(browser_lang[1].toLowerCase()) !== -1) lang = browser_lang[1].toLowerCase();
			L = LANG[lang];
			L.lang = lang;
			DATA.setItem('lang', lang, callback);
		});
	},
	getSpeech : function(input) {
		/* Speech recognition */
		if(LIB.speech) {
			LIB.speech.stop();
			LIB.speech.onend();
			delete LIB.speech;
			return;
		}

		var recognition = LIB.speech = new webkitSpeechRecognition(),
			placeholder = input.attr('placeholder'),
			recognizing = true,
			final_transcript = '',
			timeout;

		recognition.interimResults = true;
		recognition.lang = navigator.language;
		recognition.onresult = function(e) {
			if(!recognizing) return;
			var interim_transcript = '';
			for(var i = e.resultIndex; i < e.results.length; ++i) {
				if(e.results[i].isFinal) {
					final_transcript += e.results[i][0].transcript;
				} else {
					interim_transcript += e.results[i][0].transcript;
				}
			}
			if(interim_transcript !== '') {
				input.val('');
				input.attr('placeholder', interim_transcript);
			} else if(final_transcript !== '') {
				input.attr('placeholder', placeholder);
				input.val(final_transcript);
			}
			clearTimeout(timeout);
			timeout = setTimeout(recognition.onend, 1000);
		};
		recognition.onend = function() {
			clearTimeout(timeout);
			recognizing = false;
			delete LIB.speech;
			input.attr('placeholder', placeholder);
			input.val(final_transcript);
			input.parents('form').first().submit();
		};
		recognition.start();
		timeout = setTimeout(recognition.onend, 3000);
	},
	handleSpeech : function(selector) {
		$(selector + ' input[type="text"]').each(function(i, el) {
			el = $(el);
			var a = $('<a class="input-speech" />');
			a.click(function() {
				LIB.getSpeech(el);
			});
			el.before(a);
		});
	},
	onSectionScroll : function(more, callback) {
		var s = $('section').first(),
			onScroll = function() {
				var bt = (s[0].scrollHeight - s.height()) * 0.8;
				if(more && (bt < 200 || s.scrollTop() > bt)) {
					s.unbind('scroll', onScroll);
					callback();
				}
			};
		
		more && s.bind('scroll', onScroll);
	},
	onKeyDown : function(e) {
		var t = e.target,
			n = t.nodeName,
			on_text = (n === "INPUT" || n === "TEXTAREA" || $(t).attr('contenteditable')) && e.keyCode !== 27;

		if(e.metaKey && e.keyCode === 82) return RELOAD();
		if(on_text || e.metaKey) return;
		switch(e.keyCode) {
			case 32: //space
				LIB.cancelHandler(e); //avoid page scroll-down behaviour
				PLAYER.play();
			break;
			case 37: //left
				PLAYER.prev();
			break;
			case 39: //right
				PLAYER.next();
			break;
			case 27: //esc
				FULLSCREEN.active() && FULLSCREEN.cancel();
		}
	},
	onResize : function() {
		var content_height = $(window).height() - 50;
		$('section#playlist div.border').css('min-height', content_height - 100);
		$('section').css('height', content_height);
		$('aside menu').last().css('height', content_height - $('aside input').first().height() - $('aside menu').first().height() - 75);
	}
};

ROUTER = {
	init : function() {
		DATA.getItem('lastUrl', function(lastUrl) {
			lastUrl && DATA.removeItem('lastUrl');
			ROUTER.update(navigator.onLine && lastUrl ? lastUrl : (window.history.pushState ? document.location.pathname : '/'));
		});
	},
	update : function(url, fromPopEvent) {
		ROUTER.url = url;
		DATA.setItem('lastUrl', url);
		url = url.substr(1);
		var p = url.indexOf('/'),
			panel = p != -1 ? url.substr(0, p) : url,
			params = p != -1 ? url.substr(p + 1).split('/') : [],
			validPanels = [
				'album',
				'artist',
				'explore',
				'loved',
				'playlist',
				'settings'
			];

		params.forEach(function(p, i) { params[i] = decodeURIComponent(p); });

		if(ROUTER.onUnload) {
			ROUTER.onUnload();
			delete ROUTER.onUnload;
		}

		panel === '' && (panel = 'explore');

		if(validPanels.indexOf(panel) !== -1) {
			var cb = function(data) {
					$('section').replaceWith('<section id="' + panel + '">' + Handlebars.templates[panel](data) + '</section>');
					$('section').hide().fadeIn('fast');
					TEMPLATE[panel] && (TEMPLATE[panel].render ? TEMPLATE[panel].render(data) : typeof TEMPLATE[panel] === 'function' ? TEMPLATE[panel](data) : false);
					$('section *[contenteditable="true"]').each(function(i, el) {
						el = $(el).blur(function(e) {
							LIB.inlineOnBlur(e, el.attr('key'), el.attr('field'));
						})
						.keydown(LIB.inlineOnKeyDown);
					});
					//LIB.handleSpeech('section');
					LIB.handleLinks('section');
					LIB.onResize();
					!fromPopEvent && window.history.pushState && window.history.state !== '/' + url && window.history.pushState('/' + url, '', '/' + url); 
				};

			$('aside menu li').removeClass('selected');
			if(TEMPLATE[panel] && TEMPLATE[panel].data) return TEMPLATE[panel].data(params, cb);
			cb({});
		} else {
			ROUTER.update('/');
		}
	}
};
