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
	var targets = {
		mopidy: function(cmd) {
					var method = mopidy;
					for (var index in cmd.command.command) {
						method = method[cmd.command[index]];
					}

					method(cmd.command.param).done(function(data) {
						conn.sendUTF(JSON.stringify({
							command: cmd,
							result: data
						}));
					});
				}
	};

	conn.on('error', function(error) {
		console.log("Connect to commander error: " + error.toString());
		console.log("Reconnecting...");
		reconnect();
	});

	conn.on('close', function() {
		console.log("Connection closed.");
		console.log("Reconnecting...");
		reconnect();
	});

	conn.on('message', function(msg) {
		var cmds = JSON.parse(msg.utf8Data);
		for (var i in cmds) {
			targets[cmds[i]](cmds[i]);
		}
	});
});

var reconnect = function() {
	ws.connect(commanderWS);
}

/* Connection with mopidy */
var mopidy = new Mopidy({
	console: console
});

mopidy.on('state:online', reconnect);
