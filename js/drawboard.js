// Alan Myers
(function () {
    if (window.drawboard) return;

    var LINE_WIDTH = 3;
    var LIFE_MS = 0;
    var FADE_MS = 5000;
    var userColor = '#ffffff';

    var canvas = document.createElement('canvas');
    canvas.id = 'drawboard';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '9999';
    canvas.style.pointerEvents = 'none';
    document.documentElement.appendChild(canvas);

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    var ctx = canvas.getContext('2d');

    // Fetch own user color after login
    function fetchUserColor() {
        if (!window.client || !window.client.connected || !window.client.connected()) return;
        window.client.send({m: "user", id: localStorage.id});
    }
    if (window.client && window.client.on) {
        window.client.on('login', fetchUserColor);
        window.client.on('user', function (msg) {
            if (msg.id !== localStorage.id) return;
            if (msg.color) userColor = msg.color;
        });
    }

    var shiftDown = false;
    var clicking = false;
    var shapes = [];
    var lastPos = null;
    var pos = null;

    function clamp(min, x, max) {
        return Math.min(max, Math.max(min, x));
    }

    function normX(clientX) {
        return clamp(0, clientX / window.innerWidth, 1);
    }
    function normY(clientY) {
        return clamp(0, clientY / window.innerHeight, 1);
    }

    function generateUUID() {
        var id = 0;
        if (crypto && crypto.getRandomValues) {
            id = crypto.getRandomValues(new Uint32Array(1))[0] >>> 0;
        } else {
            id = Math.floor(Math.random() * 0xFFFFFFFF) >>> 0;
        }
        return id || 1;
    }

    function renderLine(x1, y1, x2, y2, uuid) {
        shapes.push({
            type: "line",
            x1: x1, y1: y1,
            x2: x2, y2: y2,
            color: userColor,
            transparency: 1,
            lineWidth: LINE_WIDTH,
            lifeMs: LIFE_MS,
            fadeMs: FADE_MS,
            timestamp: Date.now(),
            uuid: uuid
        });
    }

    // Will later send drawing data via custom message (smn)
    function sendCustomData(bytes) {
        // TODO: send via client.send({m: "custom", data: {drawboard: ...}}) or chatspace equivalent
        // per-chanel drawing
        // bytes is a Uint8Array of encoded ops
    }

    document.addEventListener('keydown', function (e) {
        shiftDown = e.shiftKey || e.metaKey;
        canvas.style.pointerEvents = shiftDown ? 'auto' : 'none';
        if (shiftDown) {
            document.body.style.userSelect = 'none';
            document.body.style.webkitUserSelect = 'none';
        } else {
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
        }
    });
    document.addEventListener('keyup', function (e) {
        shiftDown = e.shiftKey || e.metaKey;
        canvas.style.pointerEvents = shiftDown ? 'auto' : 'none';
        if (!shiftDown) {
            document.body.style.userSelect = '';
            document.body.style.webkitUserSelect = '';
            clicking = false;
            lastPos = null;
        }
    });

    document.addEventListener('mousedown', function (e) {
        if (!shiftDown) return;
        clicking = true;
        lastPos = null;
        pos = { x: normX(e.clientX), y: normY(e.clientY) };
    });

    document.addEventListener('mouseup', function (e) {
        if (!clicking) return;
        clicking = false;
        lastPos = null;
    });

    document.addEventListener('mousemove', function (e) {
        if (!clicking || !shiftDown) {
            lastPos = null;
            return;
        }

        var nx = normX(e.clientX);
        var ny = normY(e.clientY);

        if (!pos) {
            pos = { x: nx, y: ny };
        }
        lastPos = pos;
        pos = { x: nx, y: ny };

        if (lastPos) {
            var uuid = generateUUID();
            renderLine(lastPos.x, lastPos.y, pos.x, pos.y, uuid);
        }
    });

    document.addEventListener('dragstart', function (e) {
        if (shiftDown) e.preventDefault();
    }, true);

    document.addEventListener('selectstart', function (e) {
        if (shiftDown) e.preventDefault();
    }, true);

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var now = Date.now();

        var kept = [];
        for (var i = 0; i < shapes.length; i++) {
            var s = shapes[i];
            var age = now - s.timestamp;
            if (age >= (s.lifeMs + s.fadeMs)) continue;
            kept.push(s);
        }
        shapes = kept;

        for (var i = 0; i < shapes.length; i++) {
            var s = shapes[i];
            var age = now - s.timestamp;

            var alpha = 1;
            if (age > s.lifeMs) {
                var fadeAge = age - s.lifeMs;
                alpha = Math.min(1, Math.max(0, 1 - (fadeAge / s.fadeMs)));
            }

            ctx.globalAlpha = alpha * s.transparency;
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.lineWidth;
            ctx.beginPath();
            ctx.moveTo(s.x1 * canvas.width, s.y1 * canvas.height);
            ctx.lineTo(s.x2 * canvas.width, s.y2 * canvas.height);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);

    window.drawboard = {
        canvas: canvas,
        shapes: shapes,
        lineWidth: LINE_WIDTH,
        lifeMs: LIFE_MS,
        fadeMs: FADE_MS,
        userColor: userColor,
        renderLine: renderLine,
        sendCustomData: sendCustomData
    };
})();
