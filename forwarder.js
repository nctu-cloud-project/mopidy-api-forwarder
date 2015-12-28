var WebSocketClient = require('websocket').client;
var Mopidy = require('mopidy');
var child_process = require('child_process');
var buffer = require('buffer');


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
				method = method[cmd.command.command[index]];
			}

			method(cmd.command.param).done(function(data) {
				conn.sendUTF(JSON.stringify({
					command: cmd,
					result: data
				}));
			});
		},

		audio: function (cmd) {
			var aplayChild = child_process.spawn('aplay', {
				stdio: ['pipe', 1, 2]
			});

			aplayChild.stdin.write(new buffer.Buffer(cmd.data));
			aplayChild.stdin.end();
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
		var totalDelay = 0;

		for (var i in cmds) {
			if (cmds[i].delay) {
				totalDelay += cmds[i].delay;
			}

			setTimeout(function(cmd_i) {
				targets[cmd_i.target](cmd_i);
			}, totalDelay, cmds[i]);
		}
	});
});

var reconnect = function() {
	ws.connect(commanderWS);
}

/* Connection with mopidy */
var mopidy = new Mopidy({
	console: console,
	webSocketUrl: 'ws://localhost:6680/mopidy/ws/',
	callingConvention: 'by-position-or-by-name'
});

mopidy.on('state:online', reconnect);
