Object.entries({
	'/': 'Main Page',
	"/servers/": 'Servers',
	"/info/": 'Info',
	"/settings/": "Settings",
	"/rules/": "Rules"
}).forEach(item => {
	var doc = document.createElement('a');
	doc.href = item[0];
	doc.textContent = item[1];
	if (window.location.pathname === item[0]) doc.className = "active";
	var liDoc = document.createElement('li');
	liDoc.innerHTML = doc.outerHTML;
	document.getElementById('bar').innerHTML+=liDoc.outerHTML;
});
(() => {
	var doc = document.createElement('a');
	doc.href = 'javascript:client.ws.close()';
	doc.textContent = 'Offline';
	doc.id = "bar-status"
	var liDoc = document.createElement('li');
	liDoc.innerHTML = doc.outerHTML;
	document.getElementById('bar').innerHTML+=liDoc.outerHTML;
})()
