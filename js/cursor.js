(function () {
	const THROTTLE_MS = 50;
	const FADE_MS = 3000;
	const container = document.getElementById("cursors");
	const cursors = {};
	let lastSent = 0;

	const style = document.createElement("style");
	style.textContent = `
#cursors {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	z-index: 9999;
}
.cursor {
	position: absolute;
	display: block;
	left: 0;
	top: 0;
}
.cursor::before {
	content: "";
	display: block;
	width: 16px;
	height: 24px;
	background: url("/assets/img/cursor.png") no-repeat;
	image-rendering: pixelated;
	background-size: contain;
}
.name {
	display: block;
	align-items: center;
	position: relative;
	white-space: nowrap;
	height: fit-content;
	width: fit-content;
	padding: 1px;
	line-height: 15px;
	text-align: center;
	border-radius: 2px;
	left: 16px;
	top: 0px;
	pointer-events: none;
	color: #fff;
	text-shadow: 1px 1px 0 black;
	font-size: 14px;
	font-family: "TerminusTTF", monospace;
}`;
	document.head.appendChild(style);

	function getOrCreate(userId) {
		if (cursors[userId]) return cursors[userId];
		const el = document.createElement("div");
		el.className = "cursor";
		el.style.display = "block";
		const name = document.createElement("div");
		name.className = "name";
		const nametext = document.createElement("span");
		nametext.className = "nametext";
		name.appendChild(nametext);
		el.appendChild(name);
		container.appendChild(el);
		const entry = { el, nametext, name, timeout: null, color: "#fff", displayName: userId, x: 0, y: 0, tx: 0, ty: 0 };
		nametext.textContent = entry.displayName;
		cursors[userId] = entry;
		fetchUserInfo(userId, entry);
		return entry;
	}

	function fetchUserInfo(userId, entry) {
		if (!window.client?.connected?.()) return;
		const handler = (msg) => {
			if (String(msg.id) === String(userId)) {
				entry.color = msg.color || "#fff";
				entry.displayName = msg.nickname || msg.username || userId;
				entry.nametext.textContent = entry.displayName;
				if (msg.color2) {
					entry.name.style.background = `linear-gradient(135deg, ${msg.color}, ${msg.color2})`;
				} else {
					entry.name.style.backgroundColor = msg.color || "#fff";
				}
				window.client.off("user", handler);
			}
		};
		window.client.on("user", handler);
		window.client.send({ m: "user", id: userId });
	}

	function removeCursor(userId) {
		const c = cursors[userId];
		if (!c) return;
		c.el.remove();
		delete cursors[userId];
	}

	function scheduleRemoval(userId) {
		const c = cursors[userId];
		if (!c) return;
		if (c.timeout) clearTimeout(c.timeout);
		c.timeout = setTimeout(() => removeCursor(userId), FADE_MS);
	}

	client.on("custom", (msg) => {
		//console.log("recieve it:", msg);
		if (!msg.data || msg.data.m !== "cursor") return;
		if (msg.channel !== client.channel) return;
		const userId = String(msg.user);
		if (userId === localStorage.id) return;
		const c = getOrCreate(userId);
		c.tx = msg.data.x * 100;
		c.ty = msg.data.y * 100;
		scheduleRemoval(userId);
	});

	const LERP = 0.3;
	function animate() {
		for (const id in cursors) {
			const c = cursors[id];
			c.x += (c.tx - c.x) * LERP;
			c.y += (c.ty - c.y) * LERP;
			c.el.style.left = c.x.toFixed(2) + "%";
			c.el.style.top = c.y.toFixed(2) + "%";
		}
		requestAnimationFrame(animate);
	}
	requestAnimationFrame(animate);

	const subscribe = () => {
		if (!window.client?.connected?.()) return;
		const msg = { m: "guild", type: "+custom", event: "cursor" };
		//console.log("subscribe", msg);
		window.client.send(msg);
	}

	client.on("open", () => {
		if (window.client && window.client.on) {
			window.client.on("login", () => subscribe())
		}
		//client.on('custom', console.log)
		for (const id in cursors) {
			fetchUserInfo(id, cursors[id]);
		}
	});

	document.addEventListener("mousemove", (e) => {
		if (!client.connected() || !client.channel) return;
		const now = Date.now();
		if (now - lastSent < THROTTLE_MS) return;
		lastSent = now;
		const payload = {
			m: "channel",
			type: "custom",
			channel: client.channel,
			data: {
				m: "cursor",
				x: e.clientX / innerWidth,
				y: e.clientY / innerHeight
			}
		};
		//console.log("send:", payload);
		client.send(payload);
	});

	window.cursors = cursors;
})();
