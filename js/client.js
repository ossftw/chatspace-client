window.client = {};
client.uri = "wss://chat.8448.space/ws";
client.events = {}
client.on = (name, fun) => {
        if (!client.events[name]) client.events[name] = [];
        client.events[name].push([fun, false])
};
client.addEventListener = client.on
client.once = (name, fun) => {
        if (!client.events[name]) client.events[name] = [];
        client.events[name].push([fun, true]);
}
client.emit = (name, data) => {
        if (!client.events[name]) return;
        client.events[name].forEach((ev) => {
                ev[0](data);
                if (ev[1]) client.events[name].splice(client.events[name].indexOf(ev), 1);
        })
}
client.off = (name, fun) => {
	if (!client.events[name]) return;
	client.events[name].filter(ev => ev[0] === fun).forEach(ev => {
		var indexOfFun = client.events[name].indexOf(ev);
		if (indexOfFun != -1) client.events[name].splice(indexOfFun, 1);
	})
}
client.reconnect = false
client.start = () => {
	if (client.connected()) client.stop();
	client.ws = new WebSocket(client.uri);
	client.ws.onopen = () => client.emit('open', {m: "open"});
	client.ws.onmessage = (evt) => {
		var message = JSON.parse(evt.data);
		if (evt.data.startsWith('{')) return client.emit(message.m, message);
		for (var i = 0; i < message.length; i++) {
			client.emit(message[i].m, message[i])
		}
	}
	client.ws.onclose = () => client.emit('close', {m: "close"});
	client.reconnect = true;
}
client.stop = () => {
	client.reconnect = false;
	if (client.ws) {
		try {
			client.ws.onmessage = () => {};
			client.ws.close();
		} catch (error) {
			console.log('error closing websocket')
		}
		delete client.ws;
	}
	return;
}
client.connected = () => {
	return client.ws && client.ws.readyState === WebSocket.OPEN;
}
client.send = (msg, raw) => {
	if (!client.connected()) return;
	client.ws.send(raw ? msg : JSON.stringify(msg))
}
client.on('close', () => {
	if (!client.reconnect || client.waiting) return;
	client.waiting = true;
	setTimeout(() => {client.waiting = false; client.start()}, 1000)
})
client.current = {ping: '...', status: 'Offline'}
client.status = (txt) => {
var status = document.getElementById('bar-status');
if (!status) return;
client.current.status = txt
status.textContent = txt + ` (${client.current.ping}ms)`;
}
client.ping = () => {
	return new Promise(r => {
		var pingSent = Date.now();
		var pingFunc = t => {
			if (t.e !== pingSent) return;
			client.off('ping', pingFunc);
			clearTimeout(pingTimeout);
			r(Math.floor(Date.now() - pingSent).toString());
		};
		var pingTimeout = setTimeout(() => {
			client.off('ping', pingFunc);
			r('>1000');
		}, 1000);
		client.on('ping', pingFunc);
		client.send({m: "ping", e: pingSent});
	})
}
client.on('open', () => client.status('Logging in...'));
client.on('login', () => client.status('Connected'));
client.on('chats', () => client.status('In channel'));
client.on('close', () => client.status('Offline'));
client.updatePing = async () => {
	try {
	client.current.ping = await client.ping();
	client.status(client.current.status)
	} catch (error) {}
};
setInterval(() => client.updatePing(), 5000)
client.on('open', () => client.updatePing());
