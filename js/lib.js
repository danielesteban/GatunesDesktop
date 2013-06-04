LIB = {
	cancelHandler : function(e) {
		e.stopPropagation();
		e.preventDefault();
	},
	escapeHTML : function(text) {
		return $('<div/>').text(text).html();
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
	handleLink : function(e) {
		var t = e.target;
		t.tagName.toLowerCase() !== 'a' && (t = $(t).parents('a')[0]);
		if(t.href) {
			var fullHost = document.location.protocol + '//' + document.location.host,
				p = t.href.indexOf(fullHost);

			LIB.cancelHandler(e);
			ROUTER.update(t.href.substr(p === 0 ? (p + fullHost.length) : 0));
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
    	DATA.getItem(key, function(data) {
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
	cleanSong : function(s) {
		return {
			provider : parseInt(s.provider, 10),
			provider_id : LIB.escapeHTML(s.provider_id),
			title : LIB.escapeHTML(s.title),
			time : parseInt(s.time, 10)
		};
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
        }
    },
	onResize : function() {
		var content_height = $(window).height() - 51;
		$('section#playlist div.border').css('min-height', content_height - 100);
		$('aside, section').css('height', content_height);
	}
};

ROUTER = {
	init : function() {
		$(window).bind('popstate', function(e) {
			ROUTER.update(e.originalEvent.state !== null ? e.originalEvent.state : document.location.pathname, true);
		});
	},
	update : function(url, fromPopEvent) {
		url = url.substr(1);
		var p = url.indexOf('/'),
			panel = p != -1 ? url.substr(0, p) : url,
			params = p != -1 ? url.substr(p + 1).split('/') : [],
			validPanels = [
				'album',
                'artist',
                'home',
				'loved',
                'playlist'
			];

		params.forEach(function(p, i) { params[i] = decodeURIComponent(p); });

		if(ROUTER.onUnload) {
			ROUTER.onUnload();
			delete ROUTER.onUnload;
		}

		panel === '' && (panel = 'home');

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
                    $('section input[type="text"]').each(function(i, el) {
                        el = $(el);
                        var a = $('<a class="input-speech" />');
                        a.click(function() {
                            LIB.getSpeech(el);
                        });
                        el.before(a);
                    });
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
