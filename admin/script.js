client.start();
client.on('open', () => {
	client.send({m: "login", type: "token", name: localStorage.name, token: localStorage.token, id: localStorage.id});
});
var invite = (location.hash.startsWith('#') ? location.hash.slice(1) :  location.hash);
client.on('login', msg => {
	if (!msg.login) return window.location.assign(`/login/#${encodeURIComponent(location.href.substr(location.origin.length))}`);
	client.send({m: "guild", type: "list"});
	client.send({m: "guild", type: "getinv", invite: invite});
})
var appendElement = (div, type, text) => {
	var El = document.createElement(type);
	El.textContent = text;
	div.append(El);
	return div
}
document.getElementById('ban-send').onclick = () => {
	var msg = {m: "admin", type: "ban"};
	msg.ban = (document.getElementById('ban-bool').value === 'true') ? true : false;
	msg[document.getElementById('ban-usertype').value] = document.getElementById('ban-user').value;
	client.send(msg)
}
document.getElementById('bot-send').onclick = () => {
	var msg = {m: "admin", type: "bot"};
	msg.bot = (document.getElementById('bot-bool').value === 'true') ? true : false;
	msg[document.getElementById('bot-usertype').value] = document.getElementById('bot-user').value;
	client.send(msg)
}
document.getElementById('reset-send').onclick = () => {
	var msg = {m: "admin", type: "reset"};
	msg.pass = document.getElementById('reset-password').value;
	msg[document.getElementById('reset-usertype').value] = document.getElementById('reset-user').value;
	client.send(msg)
}
document.getElementById('delfile-send').onclick = () => {
	var msg = {m: "admin", type: "delfile"};
	msg.file = document.getElementById('delfile-file').value;
	client.send(msg)
}

