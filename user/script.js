client.start();
client.on('open', () => {
	client.send({m: "login", type: "token", name: localStorage.name, token: localStorage.token, id: localStorage.id});
});
var invite = (location.hash.startsWith('#') ? location.hash.slice(1) :  location.hash);
client.on('login', msg => {
	if (!msg.login) return window.location.assign(`/login/#${encodeURIComponent(location.href.substr(location.origin.length))}`);
	client.send({m: "guild", type: "list"});
	if (invite.length) client.send({m: "user", id: invite});
})
var appendElement = (div, type, text) => {
	var El = document.createElement(type);
	El.textContent = text;
	div.append(El);
	return El;
}
validURL = (url) => {
	try {
		new URL(url);
		return true;
	} catch (error) {
		return false;
	}
}
client.on('user', msg => {
	var infoDiv = document.getElementById('user-info');
	infoDiv.innerHTML = "";
	if (msg.invalid) return appendElement(infoDiv, 'b', 'Invalid');
	window.location.hash = msg.id;
	var nameEl = appendElement(infoDiv, 'b', msg.nickname);
	if (!localStorage.noChatColors) {
		if (msg.color2 && !localStorage.disableGradient) {
			nameEl.style.backgroundImage = `linear-gradient(90deg, ${msg.color}, ${msg.color2})`;
			nameEl.style.backgroundClip = "text";
			nameEl.style.color = "transparent";
			nameEl.style.textShadow = "0px 0px"
		} else nameEl.style.color = msg.color;
	};
	appendElement(infoDiv, 'br');
	appendElement(infoDiv, 'p', msg.username);
	appendElement(infoDiv, 'p', `ID: ${msg.id}`);
	appendElement(infoDiv, 'p', msg.online ? 'ONLINE' : "OFFLINE");
	if (msg.bio && msg.bio.length) {
		appendElement(infoDiv, 'br');
		appendElement(infoDiv, 'br');
		appendElement(infoDiv, 'b', 'About Me');
		appendElement(infoDiv, 'br');
		appendElement(infoDiv, 'br');
		var messageArr = [];
		msg.bio.split(' ').forEach(word => {
		if ((word.startsWith('http://') || word.startsWith('https://')) && validURL(word)) {
			messageArr.push('');
			appendElement(infoDiv, 'span', messageArr.join(' '));
			var linkEl = appendElement(infoDiv, 'a', word);
			linkEl.href = word;
			linkEl.target = "_blank";
			messageArr = [''];
		} else if (word === "<br>") {
			appendElement(infoDiv, 'span', messageArr.join(' '))
			appendElement(infoDiv, 'br');
			messageArr = [''];
		} else messageArr.push(word);
	})
	if (messageArr.length) appendElement(infoDiv, 'span', messageArr.join(' '));
	delete messageArr;
	}
});
document.getElementById('user-send').onclick = () => {
var arr = {m: "user"};
arr[document.getElementById('usertype').value] = document.getElementById('user').value;
client.send(arr);
};
document.getElementById('user').onkeypress = (key) => {
	if (key.key !== "Enter") return;
	document.getElementById('user-send').click();
}
document.getElementById('user').onkeyup = () => {
	document.getElementById('user').value = document.getElementById('user').value.toLowerCase().split(' ').join('_').split('').filter(a => "1234567890qwertyuiopasdfghjklzxcvbnm_.".split('').includes(a)).join('');
}
