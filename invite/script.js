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
client.on('guild', msg => {
	if (msg.type !== "getinv") return;
	var infoDiv = document.getElementById('invite-info');
	infoDiv.innerHTML = "";
	if (msg.invalid) return appendElement(infoDiv, 'b', 'Invalid');
	appendElement(infoDiv, 'b', msg.name);
	appendElement(infoDiv, 'span', ' - users: ')
	appendElement(infoDiv, 'b', `(${msg.online.toLocaleString()} / ${msg.users.toLocaleString()})`);
});
client.on('guild', msg => {
	if (msg.type !== "join") return;
	document.getElementById('invite-res').textContent = msg.res.toUpperCase();
	if (msg.link) setTimeout(() => window.location.assign(`/servers/#${msg.link}`), 1000);
})
document.getElementById('home').onclick = () => {
	window.location.assign('/');
}
document.getElementById('join').onclick = () => client.send({m: "guild", type: "join", invite: invite});
