client.start();
document.getElementById('acc-create').onclick = () => {
	client.send({m: "login", type: "create", name: document.getElementById('acc-user').value, pass: document.getElementById('acc-pass').value});
}
document.getElementById('acc-login').onclick = () => {
        client.send({m: "login", type: "pass", name: document.getElementById('acc-user').value, pass: document.getElementById('acc-pass').value});
}
document.getElementById('acc-user').onkeyup = () => {
	document.getElementById('acc-user').value = document.getElementById('acc-user').value.toLowerCase().split(' ').join('_').split('').filter(a => "1234567890qwertyuiopasdfghjklzxcvbnm_.".split('').includes(a)).join('');
}
client.on('login', msg => {
	if (msg.login) {
		localStorage.token = msg.token;
		localStorage.name = msg.name;
		localStorage.id = msg.id
		window.location.assign((location.hash && location.hash.length) ? decodeURIComponent(location.hash.startsWith('#') ? location.hash.slice(1) :  location.hash) :  '/');
		return;
	}
	if (msg.type === "create") {
		document.getElementById('output').textContent = "Sorry, either the username is unavailable, or the password or username is too long."
	} else if (msg.type === "pass") {
		document.getElementById('output').textContent = "Invalid Login."
	}
})


