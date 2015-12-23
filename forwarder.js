var WebSocketClient = require('websocket').client;
var Mopidy = require('mopidy');


/* Arguments parsing */
var commanderWS = process.argv[2];
if (!commanderWS) {
	console.log('Usage: node forwarder.js <commander_WebSocket_URL>');
	process.exit(1);
}


/* Connection with commander */
var ws = new WebSocketClient();

ws.on('connect', function(conn) {
	conn.on('message', function(msg) {
		var cmd = JSON.parse(msg.utf8Data);

		var method = mopidy;
		for (var index in cmd.command) {
			method = method[cmd.command[index]];
		}

		method(cmd.param);
	});
});


/* Connection with mopidy */
var mopidy = new Mopidy({
	console: console
});

mopidy.on('state:online', function() {
	ws.connect(commanderWS);
});
