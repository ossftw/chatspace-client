client.start();
client.on('open', () => {
	client.send({m: "login", type: "token", name: localStorage.name, token: localStorage.token, id: localStorage.id})
})
document.getElementById('set-name').onclick = () => {
	client.send({m: "login", type: "setname", pass: document.getElementById('acc-password').value, name: document.getElementById('acc-display-name').value})
}
document.getElementById('set-color').onclick = () => {
	client.send({m: "login", type: "setcolor", color: document.getElementById('acc-color').value});
}
document.getElementById('reset-color').onclick = () => {
	client.send({m: "login", type: "setcolor", color: "none"});
}
document.getElementById('set-color2').onclick = () => {
	client.send({m: "login", type: "setcolor2", color: document.getElementById('acc-color2').value});
}
document.getElementById('reset-color2').onclick = () => {
	client.send({m: "login", type: "setcolor2", color: "none"});
}
document.getElementById('set-bio').onclick = () => {
	client.send({m: "login", type: "setbio", bio: document.getElementById('acc-bio').value});
}
client.on('login', msg => {
	if (msg.type !== "setname") return;
	var out = document.getElementById('set-name-output')
	if (msg.login) {
		out.textContent = "Successfully updated your display name";
	} else out.textContent = "Unable to set display name";
})
client.on('login', msg => {
	if (msg.type !== "setcolor") return;
	var out = document.getElementById('set-color-output')
	if (msg.login) {
		out.textContent = "Successfully updated your color";
	} else out.textContent = "Unable to set color";
})
client.on('login', msg => {
	if (msg.type !== "setcolor2") return;
	var out = document.getElementById('set-color2-output')
	if (msg.login) {
		out.textContent = "Successfully updated your second color";
	} else out.textContent = "Unable to set second color";
})
client.on('login', msg => {
	if (msg.type !== "setbio") return;
	var out = document.getElementById('set-bio-output')
	if (msg.login) {
		out.textContent = "Successfully updated your About Me";
	} else out.textContent = "Unable to set About Me";
})
document.getElementById('log-out').onclick = () => {
	localStorage.clear();
	window.location.assign('/login')
}
document.getElementById('get-acc-info').onclick = () => {
	client.send({m: "user", id: localStorage.id});
}
client.on('user', msg => {
	document.getElementById('acc-info').textContent = `Username: ${JSON.stringify(msg.username)}, Nickname: ${JSON.stringify(msg.nickname)}, Servers: ${msg.guilds.length}, Admin: ${!!msg.admin}, Bot: ${!!msg.bot}, Color: ${(msg.color ? msg.color : 'None')}, Color2: ${(msg.color2 ? msg.color2 : 'None')}`;
	document.getElementById('acc-display-name').value = msg.nickname;
	if (msg.color) document.getElementById('acc-color').value = msg.color;
	if (msg.color2) document.getElementById('acc-color2').value = msg.color2;
	if (msg.bio); document.getElementById('acc-bio').value = msg.bio;
})
document.getElementById('acc-password-reset').onclick = () => {
	if (!confirm('Resetting your password will also log out all devices, resetting your session token. Are you sure you want to continue?')) return;
	client.send({m: "login", type: "reset", old: document.getElementById('acc-password-old').value, "new": document.getElementById('acc-password-new').value});
}
client.on('login', msg => {
	if (msg.type !== "reset") return;
	var out = document.getElementById('reset-output');
	if (!msg.login) return out.textContent = "Invalid Password."
		localStorage.clear();
		window.location.assign('/login');
})

document.getElementById('custom-audio').onclick = () => {
var aud = prompt('What do you want the custom audio to be?');
if (!aud || !aud.trim().length) return delete localStorage.audio();
localStorage.audio = aud;
}
Object.entries({
	"hidetime": "hidetime",
	"showidschat": "showIdsInChat",
	"nochatcolors": "noChatColors",
	"noaudio": "noAudio",
	"audioanytime": "audioAnyTime",
	"embeds": "embeds",
	"nogradient": "disableGradient",
	"hideblocks": "hideBlocks"
}).forEach(setting => {
	var check = document.getElementById(setting[0]);
	if (!check) return;
	if (localStorage[setting[1]]) check.checked = true;
	check.onchange = () => {
		if (check.checked) {
			localStorage[setting[1]] = true;
		} else delete localStorage[setting[1]];
	}
})
