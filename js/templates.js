!function(){var a=Handlebars.template,n=Handlebars.templates=Handlebars.templates||{};n.album=a(function(a,n,e,l,s){function t(a,n){var l,s,t="";return t+='\n			<button class="btn store"><i class="icon-plus"></i> ',s={hash:{},data:n},t+=f((l=e.L||a.L,l?l.call(a,"storeAlbum",s):m.call(a,"L","storeAlbum",s)))+"</button>\n		"}function i(a,n){var s,t="";return t+="\n				",s=y.invokePartial(l.song,"song",a,e,l,n),(s||0===s)&&(t+=s),t+="\n			"}function r(a,n){var l,s,t="";return t+='\n				<tr><td class="empty">',s={hash:{},data:n},t+=f((l=e.L||a.L,l?l.call(a,"emptyAlbum",s):m.call(a,"L","emptyAlbum",s)))+"</td>\n			"}function o(a,n){var l,s,t="";return t+='\n			<div class="empty" style="display:none">\n				<h4>',s={hash:{},data:n},t+=f((l=e.L||a.L,l?l.call(a,"moreFrom",s):m.call(a,"L","moreFrom",s)))+": "+f((l=a.artist,l=null==l||l===!1?l:l.name,typeof l===g?l.apply(a):l))+"</h4>\n				<div></div>\n			</div>\n		"}function c(a,n){var l,s,t="";return t+="\n				",s={hash:{},data:n},t+=f((l=e.a||a.a,l?l.call(a,a.name,a.link,s):m.call(a,"a",a.name,a.link,s)))+"\n			"}function d(a,n){var l,s,t="";return t+='\n			<menu>\n				<li><button class="btn btn-mini remove"><i class="icon-remove"></i> ',s={hash:{},data:n},t+=f((l=e.L||a.L,l?l.call(a,"removeAlbum",s):m.call(a,"L","removeAlbum",s)))+"</button></li>\n			</menu>\n		"}this.compilerInfo=[4,">= 1.0.0"],e=this.merge(e,a.helpers),l=this.merge(l,a.partials),s=s||{};var h,p,u,v="",m=e.helperMissing,f=this.escapeExpression,y=this,g="function";return v+='<div class="header">\n	<h1 key="',(h=e.dataKey)?h=h.call(n,{hash:{},data:s}):(h=n.dataKey,h=typeof h===g?h.apply(n):h),v+=f(h)+'">\n		',u={hash:{},data:s},v+=f((h=e.a||n.a,h?h.call(n,(h=n.artist,null==h||h===!1?h:h.name),(h=n.artist,null==h||h===!1?h:h.link),u):m.call(n,"a",(h=n.artist,null==h||h===!1?h:h.name),(h=n.artist,null==h||h===!1?h:h.link),u)))+" - ",(p=e.title)?p=p.call(n,{hash:{},data:s}):(p=n.title,p=typeof p===g?p.apply(n):p),v+=f(p)+" \n		",p=e.unless.call(n,n.stored,{hash:{},inverse:y.noop,fn:y.program(1,t,s),data:s}),(p||0===p)&&(v+=p),v+='\n	</h1>\n	<hr>\n</div>\n<div class="half">\n	<div class="padding">\n		<table>\n			',p=e.each.call(n,n.songs,{hash:{},inverse:y.noop,fn:y.program(3,i,s),data:s}),(p||0===p)&&(v+=p),v+="\n			",u={hash:{},inverse:y.noop,fn:y.program(5,r,s),data:s},h=e.empty||n.empty,p=h?h.call(n,n.songs,u):m.call(n,"empty",n.songs,u),(p||0===p)&&(v+=p),v+="\n		</table>\n		",u={hash:{},inverse:y.noop,fn:y.program(7,o,s),data:s},h=e.empty||n.empty,p=h?h.call(n,n.songs,u):m.call(n,"empty",n.songs,u),(p||0===p)&&(v+=p),v+='\n	</div>\n</div>\n<div class="half">\n	<div class="padding">\n		<div class="cover"></div>\n		<div class="tags">\n			',p=e.each.call(n,n.tags,{hash:{},inverse:y.noop,fn:y.program(9,c,s),data:s}),(p||0===p)&&(v+=p),v+='\n		</div>\n		<div class="similarAlbums"></div>\n		',p=e["if"].call(n,n.stored,{hash:{},inverse:y.noop,fn:y.program(11,d,s),data:s}),(p||0===p)&&(v+=p),v+="\n	</div>\n</div>\n"}),n.artist=a(function(a,n,e,l,s){function t(a,n){var l,s,t="";return t+="\n			",s={hash:{},data:n},t+=u((l=e.a||a.a,l?l.call(a,a.name,a.link,s):p.call(a,"a",a.name,a.link,s)))+"\n		"}function i(a,n){var l,s,t,i="";return i+='\n			<li>\n				<i class="icon-user"></i> ',(l=e.name)?l=l.call(a,{hash:{},data:n}):(l=a.name,l=typeof l===m?l.apply(a):l),i+=u(l)+" \n				",t={hash:{},inverse:v.noop,fn:v.program(4,r,n),data:n},l=e.or||a.or,s=l?l.call(a,a.yearfrom,a.yearto,t):p.call(a,"or",a.yearfrom,a.yearto,t),(s||0===s)&&(i+=s),i+="\n			</li>\n		"}function r(a,n){var l,s="";return s+="\n				<span>(",(l=e.yearfrom)?l=l.call(a,{hash:{},data:n}):(l=a.yearfrom,l=typeof l===m?l.apply(a):l),s+=u(l),l=e["if"].call(a,a.yearfrom,{hash:{},inverse:v.noop,fn:v.program(5,o,n),data:n}),(l||0===l)&&(s+=l),(l=e.yearto)?l=l.call(a,{hash:{},data:n}):(l=a.yearto,l=typeof l===m?l.apply(a):l),s+=u(l)+")</span>\n				"}function o(a,n){var l;return l=e["if"].call(a,a.yearto,{hash:{},inverse:v.noop,fn:v.program(6,c,n),data:n}),l||0===l?l:""}function c(){return" - "}this.compilerInfo=[4,">= 1.0.0"],e=this.merge(e,a.helpers),s=s||{};var d,h="",p=e.helperMissing,u=this.escapeExpression,v=this,m="function";return h+='<div class="header">\n	<h1>',(d=e.name)?d=d.call(n,{hash:{},data:s}):(d=n.name,d=typeof d===m?d.apply(n):d),h+=u(d)+'</h1>\n	<hr>\n</div>\n<div class="right">\n	<div class="image">\n		<iframe src="/image.html#',(d=e.image)?d=d.call(n,{hash:{},data:s}):(d=n.image,d=typeof d===m?d.apply(n):d),h+=u(d)+'"></iframe>\n	</div>\n	<div class="tags">\n		',d=e.each.call(n,n.tags,{hash:{},inverse:v.noop,fn:v.program(1,t,s),data:s}),(d||0===d)&&(h+=d),h+='\n	</div>\n	<p class="bio">',(d=e.bio)?d=d.call(n,{hash:{},data:s}):(d=n.bio,d=typeof d===m?d.apply(n):d),h+=u(d)+'</p>\n	<ul class="members">\n		',d=e.each.call(n,n.members,{hash:{},inverse:v.noop,fn:v.program(3,i,s),data:s}),(d||0===d)&&(h+=d),h+='\n	</ul>\n</div>\n<div class="padding">\n	\n</div>\n'}),n.deprecated=a(function(a,n,e,l,s){return this.compilerInfo=[4,">= 1.0.0"],e=this.merge(e,a.helpers),s=s||{},'<div class="header">\n	<h1>Versi&oacute;n desactualizada</h1>\n	<hr>\n</div>\n<div class="half">\n	<div class="padding" style="font-size: 150%; line-height: 1.28em">\n		<p>\n			Est&aacute; versi&oacute;n de Gatunes est&aacute; desactualizada y va a desaparecer.\n		</p>\n		<p>\n			Ahora Gatunes es una aplicaci&oacute;n standalone con mejor rendimiento, modo offline y otras nuevas funcionalidades.\n		</p>\n		<p>\n			Descarga ahora la nueva versi&oacute;n visitando: <strong>http://www.gatunes.com</strong>\n		</p>\n		<p>\n			No pierdas tus listas!... Usa este bot&oacute;n para guardarlas en un archivo e imp&oacute;rtalas en la nueva aplicaci&oacute;n cuando la tengas instalada.\n		</p>\n		<p class="export">\n			<button class="btn"><i class="icon-file"></i> Exportar datos</button>\n		</p>\n	</div>\n</div>\n'}),n.explore=a(function(a,n,e,l,s){return this.compilerInfo=[4,">= 1.0.0"],e=this.merge(e,a.helpers),s=s||{},'<div class="right">\n	<div class="tags"></div>\n</div>\n<div class="padding">\n\n</div>\n'}),n.loved=a(function(a,n,e,l,s){function t(a,n){var s,t="";return t+="\n				",s=h.invokePartial(l.song,"song",a,e,l,n),(s||0===s)&&(t+=s),t+="\n			"}function i(a,n){var l,s,t="";return t+='\n				<tr><td class="empty">',s={hash:{},data:n},t+=u((l=e.L||a.L,l?l.call(a,"emptyLoved",s):p.call(a,"L","emptyLoved",s)))+"</td>\n			"}this.compilerInfo=[4,">= 1.0.0"],e=this.merge(e,a.helpers),l=this.merge(l,a.partials),s=s||{};var r,o,c,d="",h=this,p=e.helperMissing,u=this.escapeExpression;return d+='<div class="header">\n	<h1 key="loved">',c={hash:{},data:s},d+=u((r=e.L||n.L,r?r.call(n,"loved",c):p.call(n,"L","loved",c)))+'</h1>\n	<hr>\n</div>\n<div class="half">\n	<div class="padding">\n		<table>\n			',o=e.each.call(n,n.songs,{hash:{},inverse:h.noop,fn:h.program(1,t,s),data:s}),(o||0===o)&&(d+=o),d+="\n			",c={hash:{},inverse:h.noop,fn:h.program(3,i,s),data:s},r=e.empty||n.empty,o=r?r.call(n,n.songs,c):p.call(n,"empty",n.songs,c),(o||0===o)&&(d+=o),d+="\n		</table>\n	</div>\n</div>\n"}),n.playlist=a(function(a,n,e,l,s){function t(a,n){var l,s,t="";return t+='\n	<menu class="actions">\n		<li><a class="remove"><i class="icon-remove"></i></a></li>\n		<li style="display:none">\n			<span class="red">',s={hash:{},data:n},t+=d((l=e.L||a.L,l?l.call(a,"removePlaylist",s):c.call(a,"L","removePlaylist",s)))+"</span>: ",s={hash:{},data:n},t+=d((l=e.L||a.L,l?l.call(a,"areYouSure",s):c.call(a,"L","areYouSure",s)))+' \n			<a class="ok"><i class="icon-ok"></i></a> &nbsp; <a class="cancel"><i class="icon-remove"></i></a>\n		</li>\n	</menu>\n	'}this.compilerInfo=[4,">= 1.0.0"],e=this.merge(e,a.helpers),s=s||{};var i,r,o="",c=e.helperMissing,d=this.escapeExpression,h=this;return o+='<div class="header">\n	',i=e["if"].call(n,n.dataKey,{hash:{},inverse:h.noop,fn:h.program(1,t,s),data:s}),(i||0===i)&&(o+=i),o+="\n	",r={hash:{},data:s},o+=d((i=e.inline||n.inline,i?i.call(n,n.title,n.dataKey,"title","h1",r):c.call(n,"inline",n.title,n.dataKey,"title","h1",r)))+'\n	<hr>\n</div>\n<div class="half">\n	<div class="padding">\n		<table></table>\n	</div>\n</div>\n<div class="half">\n	<div class="padding border">\n		<form>\n			<label>',r={hash:{},data:s},o+=d((i=e.L||n.L,i?i.call(n,"addSongs",r):c.call(n,"L","addSongs",r)))+'</label>\n			<div class="controls">\n				<input type="text" placeholder="',r={hash:{},data:s},o+=d((i=e.L||n.L,i?i.call(n,"searchSongPrompt",r):c.call(n,"L","searchSongPrompt",r)))+'..." name="query" /> \n				<button class="btn" type="submit">',r={hash:{},data:s},o+=d((i=e.L||n.L,i?i.call(n,"search",r):c.call(n,"L","search",r)))+'</button>\n				<input type="hidden" name="provider" />\n			</div>\n		</form>\n		<menu class="tabs" style="display:none">\n			<li class="selected">\n				<a>Youtube</a>\n			</li>\n			<li>\n				<a>Soundcloud</a>\n			</li>\n		</menu>\n		<table></table>\n	</div>\n</div>\n'}),n.skin=a(function(a,n,e,l,s){this.compilerInfo=[4,">= 1.0.0"],e=this.merge(e,a.helpers),l=this.merge(l,a.partials),s=s||{};var t,i,r,o="",c=e.helperMissing,d=this.escapeExpression,h=this;return o+='<aside>\n	<a href="/" class="brand">\n		<img src="/img/brand.png" />\n	</a>\n	<form>\n		<input type="text" placeholder="',r={hash:{},data:s},o+=d((t=e.L||n.L,t?t.call(n,"searchPrompt",r):c.call(n,"L","searchPrompt",r)))+'..." name="query" autocomplete="off" /> \n		<button class="btn" type="submit">',r={hash:{},data:s},o+=d((t=e.L||n.L,t?t.call(n,"search",r):c.call(n,"L","search",r)))+'</button>\n		<ul></ul>\n	</form>\n	<menu>\n		<li class="create">',r={hash:{},data:s},o+=d((t=e.a||n.a,t?t.call(n,"createPlaylist","/playlist",n.null,"plus icon-white",r):c.call(n,"a","createPlaylist","/playlist",n.null,"plus icon-white",r)))+'</li>\n		<li class="loved">',r={hash:{},data:s},o+=d((t=e.a||n.a,t?t.call(n,"loved","/loved",n.null,"heart icon-white",r):c.call(n,"a","loved","/loved",n.null,"heart icon-white",r)))+"</li>\n	</menu>\n	",i=h.invokePartial(l.playlistsMenu,"playlistsMenu",n,e,l,s),(i||0===i)&&(o+=i),o+='\n</aside>\n<section></section>\n<footer>\n	<div class="slider">\n		<div></div>\n		<div></div>\n		<span></span>\n		<div class="t"></div>\n	</div>\n	<menu>\n		<li class="play"><button class="btn btn-inverse"><i class="icon-play"></i></button></li>\n		<li class="prev"><button class="btn btn-inverse"><i class="icon-step-backward"></i></li>\n		<li class="next"><button class="btn btn-inverse"><i class="icon-step-forward"></i></li>\n		<li class="love"><button class="btn btn-inverse"><i class="icon-heart"></i></button></li>\n		<li class="fullscreen"><button class="btn btn btn-inverse"><i class="icon-fullscreen"></i></button></li>\n		<li class="title"><a href="#"></a></li>\n		<li class="time"></li>\n	</menu>\n</footer>\n'})}();