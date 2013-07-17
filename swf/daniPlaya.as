/*
Compile command:
~/flex_sdk/bin/mxmlc -incremental=true -static-link-runtime-shared-libraries=true -omit-trace-statements=true daniPlaya.as
*/

package {
	import flash.display.Sprite;
	import flash.external.ExternalInterface;
	import flash.events.AsyncErrorEvent;
	import flash.media.Video;
	import flash.net.NetConnection;
	import flash.net.NetStream;

	public class daniPlaya extends Sprite {
		public var vid:Video = new Video(),
			metaData:Object = null;

		public function daniPlaya() {
			var nc:NetConnection = new NetConnection(),
				customClient:Object = new Object();

			nc.connect(null);
			customClient.onMetaData = function(info:Object):void {
				metaData = info;
				onResize();
			};
			customClient.onPlayStatus = function(info:Object):void {
				switch(info.code) {
					case 'NetStream.Play.Complete':
						ExternalInterface.call('PLAYER.onStateChange', 0);
				}
			};
			var ns:NetStream = new NetStream(nc);
			ns.client = customClient;
			ns.addEventListener(AsyncErrorEvent.ASYNC_ERROR, function(event:AsyncErrorEvent):void {
				//trace(event.text);
			});
			ns.play(loaderInfo.parameters.url);
			vid.attachNetStream(ns);
			addChild(vid);

			stage.addEventListener('resize', function(e:Object):void {
				if(!metaData) return;
				onResize();
			});

			ExternalInterface.addCallback("resume", function():void {
				ns.resume();
				ExternalInterface.call('PLAYER.onStateChange', 1);
			});

			ExternalInterface.addCallback("pause", function():void {
				ns.pause();
				ExternalInterface.call('PLAYER.onStateChange', 2);
			});

			ExternalInterface.addCallback("getCurrentTime", function():Number {
				return ns.time;
			});

			ExternalInterface.addCallback("getDuration", function():Number {
				if(!metaData) return 0;
				return metaData.duration;
			});

			ExternalInterface.addCallback("seekTo", function(to:Number):void {
				ns.seek(to);
			});

			ExternalInterface.call('DANIPLAYA.onReady');
		}

		public function onResize():void {
			if(metaData.height > metaData.width) {
				vid.height = stage.stageHeight;
				vid.width = metaData.width * stage.stageHeight / metaData.height;
				vid.x = (stage.stageWidth - vid.width) / 2;	
			} else {
				vid.width = stage.stageWidth;
				vid.height = metaData.height * stage.stageWidth / metaData.width;
				vid.y = (stage.stageHeight - vid.height) / 2;	
			}
		}
	}
}
