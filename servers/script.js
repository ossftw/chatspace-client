var chat = {count: 0, replies: {}, messages: {}, stat: ['Servers', 0]};
chat.title = () => document.title = `Chat Space - ${chat.stat[0]}` + (chat.stat[1] ? ` (${chat.stat[1].toLocaleString()})` : '');
if (!localStorage.noAudio) chat.audio = new Audio(localStorage.audio || `${location.origin}/assets/audio/notify.wav`);
chat.validURL = (url) => {
	try {
		new URL(url);
		return true;
	} catch (error) {
		return false;
	}
}
chat.box = document.getElementById('chat-box');
chat.input = document.getElementById('chat-input');
chat.resize = () => {
	document.getElementById('main').scrollIntoView();
	var distanceFromBottom = chat.box.scrollTop + chat.box.clientHeight - chat.box.scrollHeight;
	var nameSize = document.getElementById('server-name').getBoundingClientRect();
	//var boxSize = chat.box.getBoundingClientRect();
	var inputSize = chat.input.getBoundingClientRect();
	//chat.box.style.maxHeight = Math.round((window.innerHeight / window.devicePixelRatio) - ((nameSize.y + nameSize.height + inputSize.height) / window.devicePixelRatio)).toString() + "px"; 
	chat.box.style.maxHeight = Math.round(window.innerHeight - (nameSize.bottom + nameSize.height + inputSize.height)).toString() + "px"; 
	//console.log(chat.box.style.maxHeight, window.innerHeight);
	if (Math.floor(Math.abs(distanceFromBottom)) == 0) {
		//while (chat.box.childNodes.length > 128) {
		while (chat.box.scrollHeight / chat.box.clientHeight > 2 && chat.box.childNodes.length > 2 && (chat.box.scrollHeight / 2.5) >= chat.box.childNodes.item(0).scrollHeight) {
			chat.box.childNodes.item(0).remove();
			chat.count--;
		}
	}
	chat.box.scrollTo(0, distanceFromBottom + (chat.box.scrollHeight - chat.box.clientHeight));
};
window.onresize = chat.resize;
document.body.onclick = chat.resize;
try {
chat.resize();
} catch (err) {};
//chat.receive = (name, hover, message, above, id) => {
chat.receive = (msg, above, current) => {
	if (document.getElementById(`message-${msg.id}`)) return;
	if (chat.blocks.includes(msg.user.id)) {
		delete msg.user.color;
		delete msg.user.color2;
		msg.user.nickname = "Blocked User";
		msg.message = "";
	}
	var messageHt = document.createElement('div');
	if (localStorage.hideBlocks && chat.blocks.includes(msg.user.id)) messageHt.hidden = true;
	messageHt.className = "chatmsg"
	if (!localStorage.hidetime) {
		var timeEl = document.createElement('span');
		timeEl.className = "chattime";
		timeEl.textContent = new Date(msg.time)[new Date(msg.time).toLocaleDateString() === new Date().toLocaleDateString() ? 'toLocaleTimeString' : 'toLocaleString']() + ' ';
		messageHt.append(timeEl);
	};
	if (localStorage.showIdsInChat) {
		var uidEl = document.createElement('span');
		uidEl.className = "chatid";
		uidEl.textContent = `[${msg.user.id}] `;
		uidEl.onclick = () => {
			chat.input.value += ` @${msg.user.id} `;
		};
		messageHt.append(uidEl);
	};
	chat.messages[msg.id] = chat.blocks.includes(msg.user.id) ? 'Blocked Message' :`${msg.user.nickname}: ${msg.message}`;
	var nameEl = document.createElement('b');
	nameEl.className = "chatname";
	nameEl.textContent = msg.user.nickname;
	if (!localStorage.noChatColors) {
		if (msg.user.color2 && !localStorage.disableGradient) {
			nameEl.style.backgroundImage = `linear-gradient(90deg, ${msg.user.color}, ${msg.user.color2})`;
			nameEl.style.backgroundClip = "text";
			nameEl.style.color = "transparent";
			nameEl.style.textShadow = "0px 0px"
		} else nameEl.style.color = msg.user.color;
	};
	messageHt.title = msg.user.username;
	messageHt.id = `message-${msg.id}`
	nameEl.onclick = () => {
		chat.input.focus();
		if (chat.input.value.length === 0 || (chat.input.value.split(' ').length === 3 && chat.input.value.startsWith('!') && chat.input.value.endsWith(' - '))) return chat.input.value = `!${msg.id} - `;
		chat.input.value += (chat.input.value.endsWith(' ') ? '' : ' ') +  `!${msg.id} `;
	};
	nameEl.oncontextmenu = (ev) => {
		ev.preventDefault();
		window.open(location.origin + '/user/#' + msg.user.id);
		return false;
	}
	//messageHt.innerHTML += nameEl.outerHTML + ": ";
	messageHt.append(nameEl);
	var colonEl = document.createElement('span');
	colonEl.className = "chatcolon";
	colonEl.textContent = chat.blocks.includes(msg.user.id) ? "" : ": ";
	messageHt.append(colonEl);
	/*
	var msgEl = document.createElement('span');
	msgEl.textContent = message;
	//messageHt.innerHTML += msgEl.outerHTML;
	messageHt.append(msgEl);
	*/
	var messageArr = [];
	var replies = 0;
	var mentions = 0;
	var embeds = 0
	msg.message.split(' ').forEach(word => {
		if ((word.startsWith('http://') || word.startsWith('https://')) && chat.validURL(word)) {
			messageArr.push('');
			var oldEl = document.createElement('span');
			oldEl.className = "chatmessage";
			oldEl.textContent = messageArr.join(' ');
			messageHt.append(oldEl);
			if (embeds < 4 && new URL(word).origin === "https://chat.8448.space" && localStorage.embeds) {
				var extension = word.split('.')[word.split('.').length - 1];
				if (['jpg', 'jpeg', 'png', 'heic', 'gif'].includes(extension)) {
				//photo embed
				var linkEl = document.createElement('img');
				linkEl.src = word;
				linkEl.style.maxWidth = "50%";
				linkEl.style.maxHeight = "50%";
				messageHt.append(document.createElement('br'));
				} else if (['mp3', 'aac', 'ogg', 'flac', 'wav'].includes(extension)) {
				//audio embed (ts sucks)
				var linkEl = document.createElement('audio');
				linkEl.setAttribute('controls', '');
				var sourceEl = document.createElement('source');
				sourceEl.src = word;
				linkEl.style.maxWidth = "50%";
				linkEl.style.maxHeight = "50%";
				linkEl.append(sourceEl);
				messageHt.append(document.createElement('br'));
				} else if (['mp4', 'avi', 'mov', 'mpeg'].includes(extension)) {
				//video embed
				var linkEl = document.createElement('video');
				linkEl.setAttribute('controls', '');
				var sourceEl = document.createElement('source');
				sourceEl.src = word;
				linkEl.style.maxWidth = "50%";
				linkEl.style.maxHeight = "50%";
				linkEl.append(sourceEl);
				messageHt.append(document.createElement('br'));
				} else {
				var linkEl = document.createElement('a');
				linkEl.className = "chatlink";
				linkEl.target = "_blank";
				linkEl.textContent = word;
				linkEl.href = word;
				};
				embeds++
			} else {
				var linkEl = document.createElement('a');
				linkEl.className = "chatlink";
				linkEl.target = "_blank";
				linkEl.textContent = word;
				linkEl.href = word;
				//linkEl.onclick = () => console.log('hi')
			}
			messageHt.append(linkEl);
			messageArr = [''];
		} else if (word.startsWith('!') && word.length > 1 && replies <= 3 && !isNaN(word.slice(1))) {
			messageArr.push('');
			var oldEl = document.createElement('span');
			oldEl.className = "chatmessage";
			oldEl.textContent = messageArr.join(' ');
			messageHt.append(oldEl);
			var replyEl = document.createElement("b");
			replyEl.className = "reply";
			replyEl.textContent = chat.messages[word.slice(1)] ? chat.messages[word.slice(1)] : word;
			if (!document.getElementById(`message-${word.slice(1)}`)) {
				if (!chat.replies[word.slice(1)]) chat.replies[word.slice(1)] = [];
				if (!chat.replies[word.slice(1)].includes(msg.id)) chat.replies[word.slice(1)].push(msg.id);
			}
			messageHt.append(replyEl);
			messageArr = [''];
			replies++
		} else if (word.startsWith('@') && word.length > 1 && mentions <= 5 && (word.slice(1) === localStorage.id || word.slice(1) === "here")) {
			messageArr.push('');
			var oldEl = document.createElement('span');
			oldEl.className = "chatmessage";
			oldEl.textContent = messageArr.join(' ');
			messageHt.append(oldEl);
			var menEl = document.createElement("b");
			menEl.className = "mention";
			menEl.textContent = (word === "@here") ? "@here" : (`@${localStorage.name}`);
			messageHt.append(menEl);
			messageArr = [''];
			if (current) {
			if (!document.hasFocus()) {
			chat.stat[1]++
			chat.title();
			}
			if ((localStorage.audioAnyTime || !document.hasFocus()) && chat.audio && chat.audio.play) chat.audio.play()
			}
			mentions++;
		} else if (word.startsWith(':') && word.endsWith(':') && emoji[word.slice(1, -1)]) {
			messageArr.push(emoji[word.slice(1, -1)]);
		} else messageArr.push(word);
	});
	if (messageArr.length) {
		var oldEl = document.createElement('span');
		oldEl.className = "chatmessage";
		oldEl.textContent = messageArr.join(' ');
		messageHt.append(oldEl);
	}
	delete messageArr;
	//var box = document.getElementById('chat-box');
	var distanceFromBottom = -1 * Math.floor(Math.abs(chat.box.scrollTop + chat.box.clientHeight - chat.box.scrollHeight));
	if (above) {
		//chat.box.innerHTML = messageHt.outerHTML + chat.box.innerHTML;
		chat.box.prepend(messageHt);
		if (chat.replies[msg.id]) {
			chat.replies[msg.id].forEach(repl => {
				var refEl = document.getElementById(`message-${repl}`);
				if (!refEl) return;
				refEl.childNodes.forEach((child, i) => {
					if (!i || child.localName !== "b" || child.textContent !== `!${msg.id}` || child.className !== "reply") return;
					child.textContent = chat.messages[msg.id]
				})
			})
			delete chat.replies[msg.id];
		}
		if (distanceFromBottom != 0) chat.box.scrollTo(0, (chat.box.scrollHeight + distanceFromBottom) - chat.box.clientHeight);
	} else chat.box.append(messageHt);
//	} else chat.box.innerHTML += messageHt.outerHTML
	if (distanceFromBottom == 0) {
		//while (chat.box.childNodes.length > 128) {
		while (chat.box.scrollHeight / chat.box.clientHeight > 2 && chat.box.childNodes.length > 2 && (chat.box.scrollHeight / 2.5) >= chat.box.childNodes.item(0).scrollHeight) {
			delete chat.messages[chat.box.childNodes.item(0).id.substr(8)]
			chat.box.childNodes.item(0).remove();
			chat.count--;
		}
		chat.box.scrollTo(0, chat.box.scrollHeight - chat.box.clientHeight);
	}
	chat.count++
};
chat.clear = () => {
	chat.box.innerHTML = "";
	chat.count = 0;
	chat.replies = {};
	chat.messages = {};
	chat.stat[1] = 0
}
chat.send = (msg) => client.send({m: "channel", type: "send", channel: client.channel, message: msg});
chat.input.onkeypress = (key) => {
	if (key.key !== "Enter") return;
	//var inputEl = document.getElementById('chat-input');
	if (chat.input.value.length == 0 || !client.channel || !client.connected()) return;
	chat.send(chat.input.value);
	chat.input.value = '';
	if ((chat.box.scrollTop + chat.box.clientHeight - chat.box.scrollHeight) != 0) chat.box.scrollTo(0, chat.box.scrollHeight - chat.box.clientHeight);
}
client.start();
client.on('open', () => {
	client.send({m: "login", type: "token", name: localStorage.name, token: localStorage.token, id: localStorage.id})
})
client.on('login', msg => {
	if (!msg.login) return window.location.assign(`/login/#${encodeURIComponent(location.href.substr(location.origin.length))}`);
	client.send({m: "guild", type: "list"});
	if (client.channel) client.send({m: "channel", type: "join", channel: client.channel, chat: true});
})
client.guilds = [];
client.channels = [];
client.getList = (type, ms) => {
	if (type === "guild") {
		var mes = {m: "guild", type: "list"}
	} else if (type === "channel") {
		var mes = {m: "guild", type: "channels", id: client.guild};
	} else return;
	if (ms) return setTimeout(() => client.send(mes), ms);
	client.send(mes);
}
client.on('guild', msg => {
	if (msg.type !== "list") return;
	var list = document.getElementById('server-list');
	var oldvalue = list.value.toString();
	list.innerHTML = `<option value="">${msg.guilds.length ? "Please choose" : "Create or join a server"}</option>`
	msg.guilds.forEach(guild => {
		var ty = document.createElement('option');
		ty.value = guild.id;
		ty.text =  `${guild.name} (${(guild.online && guild.online !== guild.users) ? (guild.online.toLocaleString() + ' / ') : ('')}${guild.users.toLocaleString()})`;
		list.append(ty)
	});
	//list.push('<option value="make">Create...</option>');
	//document.getElementById('server-list').innerHTML = `<option value="">${msg.guilds.length ? "Please choose" : "Create or join a server"}</option>` + list.join('');
	list.value = oldvalue;
	client.guilds = msg.guilds;
	if (location.hash && location.hash.length && !client.guild) {
		list.value = (location.hash.startsWith('#') ? location.hash.slice(1) :  location.hash).split('-')[0]
		document.getElementById('server-select').click();
	}
})
client.on('guild', msg => {
	if (msg.type !== "channels") return;
	var list = document.getElementById('channel-list')
	var oldvalue = document.getElementById('channel-list').value.toString();
	list.innerHTML = "";
	msg.channels.forEach(chan => {
		var ty = document.createElement('option');
		ty.value = chan.id;
		ty.text = chan.name + ` (${chan.users.toLocaleString()})`;
		list.append(ty);
	});
	//document.getElementById('channel-list').innerHTML = list.join('');
	client.channels = msg.channels;
	list.value = msg.channels.find(a => a.id === oldvalue) ? oldvalue : (msg.channels[0] || {id: ''}).id;
	if (location.hash && location.hash.length && !client.channel) {
		list.value = (location.hash.startsWith('#') ? location.hash.slice(1) :  location.hash).split('-')[1]
		document.getElementById('channel-select').click();
	}
	if (oldvalue !== list.value) document.getElementById('channel-select').click();
})
client.on('guild', msg => {
	if (msg.type !== "invite" || msg.guild !== client.guild) return;
	document.getElementById('invite-text').textContent = msg.invite;
})
client.on('guild', msg => {
	if (msg.type !== "join") return;
	document.getElementById('invite-text').textContent = msg.res.toUpperCase();
})
client.on('chats', msg => {
	if (msg.id !== client.channel) return;
	if (msg.chats) {
		if (!chat.count) return;
		msg.chat.reverse();
		delete chat.requesting;
	} else {
		chat.clear();
		delete chat.requesting;
		chat.box.hidden = false;
		location.hash = `${client.guild}-${client.channel}`;
		chat.resize();
		chat.blocks = ((localStorage.blocks && localStorage.blocks.length) ? localStorage.blocks.split(',') : []);
	}
	if (msg.chat.length == 0) return;
	//msg.chat.forEach(message => chat.receive(message.user.nickname, message.user.username, message.message, !!msg.chats, message.id));
	msg.chat.forEach(message => chat.receive(message, !!msg.chats));
	var box = document.getElementById('chat-box');
	if (box.scrollHeight !== box.clientHeight) return;
	chat.requesting = true;
	client.send({m: "channel", type: "get", channel: client.channel, chats: chat.count});
})

client.on('chat', msg => {
	if (msg.channel !== client.channel) return;
//	chat.receive(msg.user.nickname, msg.user.username, msg.message, false, msg.id);
	chat.receive(msg, false, true)
});

document.getElementById('server-select').onclick = () => {
	client.send({m: "guild", type: "channels", id: document.getElementById('server-list').value});
	client.guild = document.getElementById('server-list').value;
	var foundServer = client.guilds.find(a => a.id === client.guild);
	if (!foundServer) return;
	chat.stat[0] = foundServer.name;
	chat.title()
	var chanPerm = foundServer.rank === "user"
	document.getElementById('channel-new').hidden = chanPerm;
	document.getElementById('channel-del').hidden = chanPerm;
	document.getElementById('server-del').hidden = foundServer.rank !== "owner";
	document.getElementById('server-leave').hidden = foundServer.rank === "owner";
}
document.getElementById('server-del').onclick = () => {
	var connum = Math.floor(Math.random() * 1000).toString();
	if (confirm('Are you sure you want to delete this?') && confirm('The server will be lost forever.') && prompt(`To confirm, type ${connum}`) === connum) {
		client.send({m: "guild", type: "delete", id: client.guild});
		client.getList("guild", 500);
	} else alert('Action cancelled.')
}
document.getElementById('server-new').onclick = () => {
	client.send({m: "guild", type: "new", name: prompt("What do you want to name your new server?")});
	client.getList("guild", 500);
}
document.getElementById('server-leave').onclick = () => {
	if (confirm('Are you sure you want to to leave this server? You will not be able to join without a new invite.')) {
		client.send({m: "guild", type: "leave", id: client.guild});
		client.getList('guild', 500);
	}
}
document.getElementById('channel-new').onclick = () => {
	client.send({m: "guild", type: "new-channel", id: client.guild, name: prompt("What do you want to name your new channel?")});
	client.getList("channel", 500);
}
document.getElementById('channel-select').onclick = () => {
	if (client.channel) client.send({m: "channel", type: "leave", channel: client.channel});
	client.channel = document.getElementById('channel-list').value;
	client.send({m: "channel", type: "join", channel: client.channel, chat: true});
	document.getElementById('server-name').textContent = `${client.guilds.find(a => a.id === client.guild).name} [${client.guild}] - ${client.channels.find(a => a.id === client.channel).name} [${client.channels.find(a => a.id === client.channel).id}]`;
	chat.clear();
}
document.getElementById('channel-del').onclick = () => {
	if (confirm('Are you sure you want to delete this? Chats here will be deleted.')) {
		client.send({m: "channel", type: "delete", channel: client.channel});
		client.getList("guild", 500);
	}
}
document.getElementById('invite-new').onclick = () => {
	client.send({m: "guild", type: "invite", id: client.guild, uses: Number(document.getElementById('invite-uses').value)});
}
chat.box.onscroll = (eve) => {
	if (Math.floor(eve.target.scrollTop) > 0 || chat.requesting) return;
	chat.requesting = true;
	client.send({m: "channel", type: "get", channel: client.channel, chats: chat.count});
}
document.getElementById('invite').onkeypress = (key) => {
	if (key.key !== "Enter") return;
	var inputEl = document.getElementById('invite');
	client.send({m: "guild", type: "join", invite: inputEl.value})
	inputEl.value = '';
	client.getList("guild", 500);
	inputEl.blur();
}
window.onkeypress = (key) => {
	if (key.key !== "Enter") return;
	if (document.activeElement === chat.input || document.activeElement === document.getElementById('invite')) return;
	chat.input.focus();
};
window.onfocus  = () => {
chat.stat[1] = 0;
chat.title();
}
document.getElementById('invite-join').onclick = () => {
	var inputEl = document.getElementById('invite');
	client.send({m: "guild", type: "join", invite: inputEl.value})
	inputEl.value = '';
	client.getList("guild", 500);
}
document.getElementById('server-list').onchange = () => document.getElementById('server-select').click();
document.getElementById('channel-list').onchange = () => document.getElementById('channel-select').click();
document.getElementById('chat-toggle').onclick = function() {
	chat.box.hidden = !chat.box.hidden;
	this.textContent = chat.box.hidden ? 'Show Chat' : 'Hide Chat';
}
document.getElementById('drawings-toggle').onclick = function() {
	drawboard.enabled = !drawboard.enabled;
	drawboard.canvas.style.display = drawboard.enabled ? '' : 'none';
	this.textContent = drawboard.enabled ? 'Hide Drawings' : 'Show Drawings';
}
document.getElementById('cursors-toggle').onclick = function() {
	var el = document.getElementById('cursors');
	el.hidden = !el.hidden;
	this.textContent = el.hidden ? 'Show Cursors' : 'Hide Cursors';
}
setInterval(() => {
	//client.send({m: "guild", type: "list"})
	client.getList('guild')
	if (client.guild) client.getList('channel');
}, 15000);
document.getElementById('channel-new').hidden = true;
document.getElementById('channel-del').hidden = true;
document.getElementById('server-del').hidden = true;
document.getElementById('invite-text').onclick = () => {
	var El = document.getElementById('invite-text');
	if (El.textContent.length !== 10) return;
	navigator.clipboard.writeText(location.origin + '/invite/#' + El.textContent);
	El.textContent = 'COPIED'
}
var upload = {uploading: false};
upload.input = document.getElementById('file-select');
upload.progress = document.getElementById('file-progress');
upload.left = document.getElementById('file-left')
upload.read = ind => new Promise((resolve, reject) => {
	var reader = new FileReader();
	reader.onload = () => resolve(reader.result);
	reader.onerror = reject;
	reader.readAsArrayBuffer(upload.input.files.item(ind));
})
upload.int = (num, length) => {
        var h = Math.floor(Math.max(0, num)).toString(16);
        var hex = ('0'.repeat(Math.max(length - h.length, 0))) + h;
        var arr = [];
        for (var i = 0; i < Math.ceil(length / 2); i++) arr.push(parseInt(hex.substr(i * 2).substr(0, 2), 16));
        return arr;
}
upload.chunk = (name, chunk, array) => {
    var dv = new DataView(new ArrayBuffer(array.length + name.length + 6));
    var byteNum = 2;
    dv.setUint8(0, 117);
    dv.setUint8(1, name.length);
    for (var i = 0; i < name.length; i++) {
        dv.setUint8(byteNum, name.charCodeAt(i));
        byteNum++
    }
    var chunkData = upload.int(chunk, 8);
    for (var i = 0; i < chunkData.length; i++) {
        dv.setUint8(byteNum, chunkData[i])
        byteNum++
    }
    for (var i = 0; i < array.length; i++) {
        dv.setUint8(byteNum, array[i]);
        byteNum++
    }
    return dv;
}
upload.upload = (ind) => new Promise(async r => {
		if (upload.uploading) return r();
		var fileData = await upload.read(ind);
		var decoder = new TextDecoder();
		var closeUpload = () => {
			upload.uploading = false;
			upload.input.disabled = false;
			upload.input.style.cursor = "";
			upload.progress.hidden = true;
			upload.left.hidden = true
			client.off('file', fileFunction);
			client.off('login', loginFunction);
			r(upload.name);
			console.log(upload.name);
			delete upload.name;
		};
		var loginFunction = () => client.send({m: "file", type: "get", id: upload.name});
		var fps = {fps: [], d: Date.now()};
		fps.avg = () => {
			fps.fps.push(Date.now() - fps.d);
			while (fps.fps.length > 10) fps.fps.splice(0, 1);
			fps.d = Date.now();
			return (fps.fps.reduce((a, b) => a + b) / fps.fps.length);
		}
		fps.msToTime = (args) => {
			if (args >= 10000000000000) {
				return 'forever';
			}
			if (args >= 31536000000) {
				return Math.round((args / 31536000000) * 10) / 10 + ' years';
			}
			if (args >= 2592000000) {
				return Math.round((args / 2592000000) * 10) / 10 + ' months';
			}
			if (args >= 604800000) {
				return Math.round((args / 604800000) * 10) / 10 + ' weeks';
			}
			if (args >= 86400000) {
				return Math.round((args / 86400000) * 10) / 10 + ' days';
			}
			if (args >= 3600000) {
				return Math.round((args / 3600000) * 10) / 10 + ' hours';
			}
			if (args >= 60000) {
				return Math.round((args / 60000) * 10) / 10 + ' minutes';
			}
			if (args >= 1000) {
				return Math.round((args / 1000) * 10) / 10 + ' seconds';
			}
			return args + ' milliseconds';
		};
		var fileFunction = async msg => {
			upload.name = msg.id
			if (!msg.invalid) {
				var done = msg.data.filter(a => a).length;
				upload.progress.value = done / msg.data.length;
				var avFps = fps.avg();
				//console.log(avFps, fps.fps)
				upload.left.textContent = `(${ind} / ${upload.input.files.length}) ` + `${((done / msg.data.length) * 100).toFixed(1)}% - ${fps.msToTime(avFps * (msg.data.length - done))} remaining...`;
			}
			if (msg.invalid || msg.done) return closeUpload();
			//var foundEmpty = msg.data.find(a => !a.u);
			//if (!foundEmpty) return client.send({m: "file", type: "done", id: upload.name});
			var indexEm = msg.data.indexOf(0);
			if (indexEm == -1) return client.send({m: "file", type: "done", id: upload.name});
			var buf = fileData.slice(0 + (msg.chunk * indexEm), msg.chunk * (1 + indexEm));
			var dv = new DataView(buf);
			var arr = [];
			for (var i = 0; i < dv.byteLength; i++) {
				arr.push(dv.getUint8(i));
				//str += String.fromCharCode(dv.getUint8(i));
			}
			//var str = String.fromCharCode(...arr);
				//console.log(arr.length);
			client.send(upload.chunk(upload.name, indexEm, arr).buffer, true);
			//fps.d = Date.now();
			//client.send({m: "file", type: "data", id: upload.name, chunk: indexEm, data: arr || str});
		}
		client.on('file', fileFunction);
		client.on('login', loginFunction);
		upload.uploading = true;
		upload.input.style.cursor = "not-allowed"
		upload.input.disabled = true;
		upload.progress.hidden = false;
		upload.progress.value = 0;
		upload.left.hidden = false;
		upload.left.textContent = `(${ind} / ${upload.input.files.length}) ` + "Waiting...";
		client.send({m: "file", type: "create", file: upload.input.files.item(ind).name.split('.').reverse()[0], name: upload.input.files.item(ind).name, size: fileData.byteLength, ft: upload.input.files.item(ind).type});
})
upload.input.onchange = async () => {
	for (var filenum = 0; filenum < upload.input.files.length; filenum++) {
	await upload.upload(filenum).then(a => {
		if (!a) return;
		chat.input.value += (chat.input.value.endsWith(' ') ? '' : ' ') + `https://chat.8448.space/files/${a} `;
		chat.input.focus();
	})
	}
}
client.on('notif', msg => {
        if (!localStorage.globalNotifs) return;

        if (document.hasFocus()) {
                if (msg.channel.id === client.channel) return;
                var docUser = document.createElement('span');
                docUser.textContent = `[${msg.message.user.id}] ${msg.message.user.nickname}`;
                var docLoc = document.createElement('span');
                docLoc.textContent = (msg.guild.id === "dms") ? msg.guild.name :`${msg.channel.name} (${msg.guild.name})`;
                var docMsg = document.createElement('span');
                docMsg.textContent = `${msg.message.message}`;
                var doc = document.createElement('a');
                doc.append(docUser, document.createElement('br'), docLoc, document.createElement('br'), docMsg);
                var liDoc = document.createElement('li');
                liDoc.append(doc);
                document.getElementById('bar').append(liDoc);
                liDoc.onclick = () => liDoc.remove()
                setTimeout(() => liDoc.remove(), 7000);
        } else {
                Notification.requestPermission(() => new Notification(`[${msg.message.user.id}] ${msg.message.user.nickname} in ` + ((msg.guild.id === "dms") ? msg.guild.name : `#${msg.channel.name} (${msg.guild.name})`), {body: msg.message.message}));
        };
        if ((localStorage.audioAnyTime || !document.hasFocus()) && chat.audio && chat.audio.play) chat.audio.play();

})

