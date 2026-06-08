var themes = {};
themes.t = [
	["Dark", '/style/dark.css'],
	["Light", '/style/light.css'],
	["Retro", '/style/retro.css'],
	["Forest - x / y", '/style/forest-xy.css'],
	["Minty Fresh - x /y", "/style/minty_fresh-xy.css"],
	["Purellow - Chasyxx", "/style/purellow-chasyyx.css"],
	["Lime Mint - ccjt", "/style/limemint-ccjt.css"],
	["Vista - Daniel176", "/style/vista-daniel176.css"]
];
themes.list = () => {
	var the = document.getElementById('themes-list');
	if (!the) return;
	var oldvalue = the.value.toString();
	the.innerHTML = "";
	themes.t.forEach(a => {
		var ty = document.createElement('option');
		ty.value = a[1];
		ty.text = a[0];
		the.append(ty);
	})
	the.value = themes.t.find(a => a[1] === oldvalue) ? oldvalue : (localStorage.css ? localStorage.css : themes.t[0][1])
};
themes.select = option => {
localStorage.css = option;
document.getElementById('style').href = option;
var main = document.getElementById('main');
if (main) main.scrollTo(0, 0);
}
themes.list();
themes.select(localStorage.css || themes.t[0][1]);
