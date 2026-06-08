client.guilds = [];
var userDiv = document.getElementById('users');
client.start();
client.on('open', () => {
	client.send({m: "login", type: "token", name: localStorage.name, token: localStorage.token, id: localStorage.id});
});
client.on('login', msg => {
	if (!msg.login) return window.location.assign(`/login/#${encodeURIComponent(location.href.substr(location.origin.length))}`);
	client.send({m: "guild", type: "list"});
})
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
/*	if (msg.type !== "list") return;
	var oldvalue = document.getElementById('server-list').value.toString();
	var list = msg.guilds.map(guild => {
		var ty = document.createElement('option');
		ty.value = guild.id;
		ty.text = guild.name + ` (${guild.users.toLocaleString()})`;
		return ty.outerHTML;
	});
	//list.push('<option value="make">Create...</option>');
	document.getElementById('server-list').innerHTML = `<option value="">${msg.guilds.length ? "Please choose" : "Create or join a server"}</option>` + list.join('');
	document.getElementById('server-list').value = oldvalue;
	client.guilds = msg.guilds*/
})
document.getElementById('server-select').onclick = () => {
	client.send({m: "guild", type: "info", id: document.getElementById('server-list').value});
	client.guild = document.getElementById('server-list').value;
}
document.getElementById('server-list').onchange = () => document.getElementById('server-select').click();
setInterval(() => {
	client.send({m: "guild", type: "list"})
}, 15000);
client.requesting = true;
client.request = () => {
	var requesting = !client.requesting;
	client.requesting = true;
	return requesting;
}
client.on('guild', msg => {
	if (msg.type !== "info") return;
	userDiv.innerHTML = `<h3>Users (${msg.users.length.toLocaleString()})</h3>`;
	var blocks = ((localStorage.blocks && localStorage.blocks.length) ? localStorage.blocks.split(',') : []);
	client.requesting = false;
	var ranks = {user: 0, admin: 1, owner: 2}
	msg.users.sort((a, b) => {
		if (a.online && !b.online) return -1;
		return 1;
	}).forEach(user => {
		var userHt = document.createElement('div');
		var userArr = [];
		if (user.online) userArr.push('ON')
		if (user.bot) userArr.push('BOT');
		if (user.rank) userArr.push(user.rank.toUpperCase());
		if (user.id === localStorage.id) userArr.push('ME');
		var nameSpan = document.createElement('span');
		nameSpan.textContent = `${user.nickname} (${user.username}) [${user.id}] `;
		nameSpan.oncontextmenu = (ev) => {
			ev.preventDefault();
			window.open(location.origin + '/user/#' + user.id);
			return false;
		}
		if (!localStorage.noChatColors) {
			if (user.color2 && !localStorage.disableGradient) {
				nameSpan.style.backgroundImage = `linear-gradient(90deg, ${user.color}, ${user.color2})`;
				nameSpan.style.backgroundClip = "text";
				nameSpan.style.color = "transparent";
				nameSpan.style.textShadow = "0px 0px"
			} else nameSpan.style.color = user.color;
		};
		userHt.append(nameSpan);
		if (userArr.length) {
			var statSpan = document.createElement('b');
			statSpan.textContent = userArr.join(', ') + ' ';
			userHt.append(statSpan);
		};
			if (user.id !== localStorage.id) {
			var blockButton = document.createElement('button');
			blockButton.type = "button";
			blockButton.textContent = blocks.includes(user.id) ? 'Unblock' : 'Block';
			if (!blocks.includes(user.id)) {
			blockButton.onclick = () => {
				if (!confirm(`Are you sure you want to block ${user.nickname} (${user.username})?`)) return;
				if (blocks.includes(user.id)) return;
				blocks.push(user.id);
				localStorage.blocks = blocks.join(',')
				if (client.request()) setTimeout(() => document.getElementById('server-select').click(), 1000);
			}
			} else {
			blockButton.onclick = () => {
				if (!confirm(`Are you sure you want to unblock ${user.nickname} (${user.username})?`)) return;
				if (!blocks.includes(user.id)) return;
				blocks.splice(blocks.indexOf(user.id), 1);
				localStorage.blocks = blocks.join(',')
				if (client.request()) setTimeout(() => document.getElementById('server-select').click(), 1000);
			}
			}
			//kickButton.onclick = () => confirm(`Are you sure you want to kick ${user.nickname} (${user.username})?`) ? client.send({m: "guild", type: "kick", id: msg.guild, user: user.id}) : undefined;
			userHt.append(blockButton);
			userHt.append(' ');
			}

		if (msg.rank[1] > 0 && user.rank === "user") {
			var kickButton = document.createElement('button');
			kickButton.type = "button";
			kickButton.textContent = "Kick";
			kickButton.onclick = () => {
				if (!confirm(`Are you sure you want to kick ${user.nickname} (${user.username})?`)) return;
				client.send({m: "guild", type: "kick", id: msg.guild, user: user.id});
				if (client.request()) setTimeout(() => document.getElementById('server-select').click(), 1000);
			}
			//kickButton.onclick = () => confirm(`Are you sure you want to kick ${user.nickname} (${user.username})?`) ? client.send({m: "guild", type: "kick", id: msg.guild, user: user.id}) : undefined;
			userHt.append(kickButton);
			userHt.append(' ');
			var banButton = document.createElement('button');
			banButton.type = "button";
			banButton.textContent = "Ban";
			banButton.onclick = () => {
				if (!confirm(`Are you sure you want to ban ${user.nickname} (${user.username})?`)) return;
				client.send({m: "guild", type: "kick", id: msg.guild, user: user.id, perm: true});
				if (client.request()) setTimeout(() => document.getElementById('server-select').click(), 1000);
			}
			//banButton.onclick = () => confirm(`Are you sure you want to ban ${user.nickname} (${user.username})?`) ? client.send({m: "guild", type: "kick", id: msg.guild, user: user.id, perm: true}) : undefined;
			userHt.append(banButton);
		}
		if (msg.rank[1] == 2 && user.rank !== "owner") {
			userHt.append(' ');
			var isAdmin = user.rank === "admin";
			var adminButton = document.createElement('button');
			adminButton.type = "button";
			adminButton.textContent = (isAdmin ? 'Take' : 'Give') + " Admin";
			adminButton.onclick = () => {
				if (!confirm(`Are you sure you want to ${isAdmin ? 'Demote' : 'Promote'} ${user.nickname} (${user.username})?`)) return;
				client.send({m: "guild", type: "admin", id: msg.guild, user: user.id, give: !isAdmin});
				if (client.request()) setTimeout(() => document.getElementById('server-select').click(), 1000);
			}
			//adminButton.onclick = () => confirm(`Are you sure you want to ${isAdmin ? 'Demote' : 'Promote'} ${user.nickname} (${user.username})?`) ? client.send({m: "guild", type: "admin", id: msg.guild, user: user.id, give: !isAdmin}) : undefined;
			userHt.append(adminButton)
		}
		userDiv.append(userHt);
	});
	var users = {};
	msg.users.forEach(a => {
		users[a.id] = a;
	});
	if (msg.invites) {
		var invh = document.createElement('h3');
		invh.textContent = `Invites (${msg.invites.length.toLocaleString()})`;
		userDiv.append(invh)
//		userDiv.innerHTML += `<h3>Invites (${msg.invites.length.toLocaleString()})</h3>`;
		var allButton = document.createElement('button');
		allButton.type = "button";
		allButton.textContent = "Delete All";
		allButton.onclick = () => {
			if (!confirm('Are you sure?')) return;
//			msg.invites.forEach(a => client.send({m: "guild", type: "delinv", id: msg.guild, invite: a.id}));
			client.send({m: "guild", type: "delinv", id: msg.guild, all: true})
			if (client.request()) setTimeout(() => document.getElementById('server-select').click(), 1000);
		};
		userDiv.append(allButton);
		msg.invites.forEach(inv => {
			var invHt = document.createElement('div');
			var statSpan = document.createElement('b');
			statSpan.textContent = inv.id;
			if (inv.uses) statSpan.textContent += ` [${inv.uses} uses left]`
			invHt.append(statSpan);
			var statSpan = document.createElement('span');
			statSpan.textContent = " created by ";
			invHt.append(statSpan);
			var statSpan = document.createElement('b');
			statSpan.textContent = users[inv.user] ? `${users[inv.user].nickname} (${users[inv.user].username}) ` : 'Unknown ';
			invHt.append(statSpan);
			var delButton = document.createElement('button');
			delButton.type = "button";
			delButton.textContent = "Delete";
			delButton.onclick = () => {
				client.send({m: "guild", type: "delinv", id: msg.guild, invite: inv.id});
				if (client.request()) setTimeout(() => document.getElementById('server-select').click(), 1000);
			};
			invHt.append(delButton);
			userDiv.append(invHt);
		})
	}
	if (msg.bans) {
		var banh = document.createElement('h3');
		banh.textContent = `Banned Users (${msg.bans.length.toLocaleString()})`;
		userDiv.append(banh);
		msg.bans.forEach(ban => {
			var banDiv = document.createElement('div');
			var banidSpan = document.createElement('span');
			banidSpan.textContent = ban + ' ';
			banidSpan.oncontextmenu = (ev) => {
				ev.preventDefault();
				window.open(location.origin + '/user/#' + ban);
				return false;
			}
			banDiv.append(banidSpan);
			var unbanButton = document.createElement('button');
			unbanButton.type = "button";
			unbanButton.textContent = "Unban";
			unbanButton.onclick = () => {
				if (!confirm(`Are you sure you want to unban the user with ID ${ban}?`)) return;
				client.send({m: "guild", type: "unban", id: msg.guild, user: ban});
				if (client.request()) setTimeout(() => document.getElementById('server-select').click(), 1000);
			}
			banDiv.append(unbanButton)
			userDiv.append(banDiv);
		})
	}
	if (msg.channels) {
		var channelh = document.createElement('h3');
		channelh.textContent = `Channels (${msg.channels.length.toLocaleString()})`;
		userDiv.append(channelh);
		msg.channels.forEach(chan => {
			var chanDiv = document.createElement('div')
			var channameSpan = document.createElement('b');
			channameSpan.textContent = `${chan.name} [${chan.id}] `
			chanDiv.append(channameSpan);
			var chantoggButton = document.createElement('button');
			chantoggButton.type = 'button';
			chantoggButton.textContent = (chan.access === "all") ? "Make Private" : "Make Public";
			chantoggButton.onclick = () => {
				if (!confirm((chan.access === "all") ? "Are you sure you want to make this channel private? This will make it inaccessible by users." : "Are you sure you want to make this channel public? This will make it accessible by users.")) return;
				client.send({m: "channel", type: "privtoggle", channel: chan.id, toggle: (chan.access === "all")});
				if (client.request()) setTimeout(() => document.getElementById('server-select').click(), 1000);
			}
			chanDiv.append(chantoggButton);
			if (chan.access !== "all") {
			chanDiv.append(' ')
			var chanaddButton = document.createElement('button');
			chanaddButton.type = "button";
			chanaddButton.textContent = "Add";
			chanaddButton.onclick = () => {
				var uidman = prompt('What user ID do you want to add to the channel?')
				if (!users[uidman]) return;
				client.send({m: "channel", channel: chan.id, type: "privman", action: "add", user:uidman.toString()});
				if (client.request()) setTimeout(() => document.getElementById('server-select').click(), 1000);
			}
			chanDiv.append(chanaddButton);
			chanDiv.append(' ')
			var chandelButton = document.createElement('button');
			chandelButton.type = "button";
			chandelButton.textContent = "Remove";
			chandelButton.onclick = () => {
				var uidman = prompt('What user ID do you want to remove from the channel?')
				if (!chan.access.includes(uidman)) return;
				client.send({m: "channel", channel: chan.id, type: "privman", action: "del", user:uidman.toString()});
				if (client.request()) setTimeout(() => document.getElementById('server-select').click(), 1000);
			}
			chanDiv.append(chandelButton);
			};
			var chanStat = document.createElement('span');
			chanStat.textContent = (chan.access === "all") ? " PUBLIC" : (!chan.access.length ? " ADMIN ONLY" : ` ADMIN + (${chan.access.length.toLocaleString()}): ${chan.access.join(', ')}`);
			chanDiv.append(chanStat);
			userDiv.append(chanDiv);
		})
	}
	document.getElementById('server-name').textContent = msg.name + ' - ' + msg.rank[0].toUpperCase();
})
