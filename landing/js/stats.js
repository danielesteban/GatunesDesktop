$(window).load(function() {
	$.get('https://api.mongolab.com/api/1/databases/landing/collections/downloads?apiKey=M8bGkRgnxrTJ-Y5pBW7c1GsKF901Fb6g', {}, function(data) {
		var canvas = $('<canvas>')[0],
			ctx = canvas.getContext('2d'),
			draw = function() {
				canvas.width = $(window).width();
				canvas.height = $(window).height() - $('header').height() - 20;

				var m = 5,
					w = (canvas.width + m) / numDays,
					g = ctx.createLinearGradient(0, 0, 0, canvas.height);
				
				g.addColorStop(0, '#0b0c0e');
				g.addColorStop(1, '#3f4042');
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				for(var x=0; x<numDays; x++) {
					if(!data[x]) continue;
					var h = data[x].total * canvas.height / max;
					ctx.fillStyle = '#f09';
					ctx.fillRect(x * w, canvas.height - h, w - m, h);
					ctx.fillStyle = '#fff';
					ctx.fillText(data[x].total, (x * w) + ((w - m) / 2) - (ctx.measureText(data[x].total).width / 2), canvas.height - h + 20);
				}
			},
			currentHeaderDay,
			header = function(day) {
				day !== null && !data[day] && (day = null);
				if(day === currentHeaderDay) return;
				var header = $('header'),
					downloads = day !== null ? data[day] : counts,
					date = day !== null ? new Date(downloads.day * 1000) : 'Last Month',
					p = $('<p />'),
					c = 0;

				day !== null && (date = (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear());
				currentHeaderDay = day;
				header.empty();
				header.append('<h1>' + date + '</h1>');
				header.append('<p>Total downloads: ' + downloads.total + '</p>');
				for(var i in downloads) {
					if(['total', 'day'].indexOf(i) !== -1) continue;
					c > 0 && p.append(', ');
					p.append(i.substr(0, 1).toUpperCase() + i.substr(1) + ': ' + downloads[i] + ' (' + Math.round(downloads[i] * 100 / downloads.total) + '%)');
					c++;
				}
				header.append(p);
			},
			now = new Date(),
			numDays = 30,
			days = {},
			counts = {
				total : 0
			},
			max = 0;

		//debug data
		/*
		data = [];
		for(var x=0;x<300; x++) {
			data.push({
				date:Math.round(1373689679 - (Math.random() * 86400 * 30)),
				platform: Math.random() * 2 > 1 ? 'win32' : 'darwin'
			});
		}
		*/
		
		data.forEach(function(download) {
			var date = new Date(download.date * 1000),
				day = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).getTime() / 1000;

			!days[day] && (days[day] = {
				day : day,
				total : 0
			});
			days[day].total++;
			days[day].total > max && (max = days[day].total);
			!days[day][download.platform] && (days[day][download.platform] = 0);
			days[day][download.platform]++;
			counts.total++;
			!counts[download.platform] && (counts[download.platform] = 0);
			counts[download.platform]++;
		});

		data = [];

		for(var x=0; x<numDays; x++) {
			var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - numDays + 1 + x, 0, 0, 0, 0).getTime() / 1000;
			days[day] && (data[x] = days[day]);
		}

		max *= 1.05;

		$('body').append('<header />').append(canvas);
		$(window).resize(draw).mousemove(function(e) {
			header(e.clientY > $('header').height() ? Math.ceil(e.clientX / ((canvas.width + 5) / numDays) + 0.001) - 1 : null);
		});
		header(null);
		draw();
	}, 'json');
});
