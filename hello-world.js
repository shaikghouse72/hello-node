const http = require('node:http');
const os = require('node:os');
const fs = require('node:fs');

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);

const APP_NAME = 'Hello Node.js - Docker Application';
const APP_VERSION = '2.0.0';

const DOCKER_HOST_IP = process.env.DOCKER_HOST_IP || 'Unknown';
const HOST_PORT = process.env.HOST_PORT || 'Unknown';
const CONTAINER_NAME = process.env.CONTAINER_NAME || 'Unknown';

const startTime = Date.now();

function getContainerId() {
    try {
        return fs.readFileSync('/etc/hostname', 'utf8').trim();
    } catch {
        return 'Unknown';
    }
}

function getMemoryInfo() {
    try {
        const current = Number(
            fs.readFileSync('/sys/fs/cgroup/memory.current', 'utf8').trim()
        );

        const maxRaw = fs.readFileSync(
            '/sys/fs/cgroup/memory.max',
            'utf8'
        ).trim();

        const currentMB = Math.round(current / 1024 / 1024);

        if (maxRaw === 'max') {
            return {
                usedMB: currentMB,
                limitMB: null,
                percentage: null
            };
        }

        const max = Number(maxRaw);
        const limitMB = Math.round(max / 1024 / 1024);
        const percentage = max > 0
            ? ((current / max) * 100).toFixed(1)
            : '0.0';

        return {
            usedMB: currentMB,
            limitMB,
            percentage
        };

    } catch {
        const rss = process.memoryUsage().rss;
        const usedMB = Math.round(rss / 1024 / 1024);

        return {
            usedMB,
            limitMB: null,
            percentage: null
        };
    }
}

function formatUptime(seconds) {
    seconds = Math.floor(seconds);

    const days = Math.floor(seconds / 86400);
    seconds %= 86400;

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;

    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];

    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }

    return req.socket.remoteAddress || 'Unknown';
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function createCard(icon, label, value, description) {
    return `
        <div class="card">
            <div class="card-top">
                <div class="icon">${icon}</div>
                <div class="label">${label}</div>
            </div>

            <div class="value">${escapeHtml(value)}</div>

            <div class="description">
                ${escapeHtml(description)}
            </div>
        </div>
    `;
}

const server = http.createServer((req, res) => {

    const clientIP = getClientIP(req);

    const containerId = getContainerId();

    const memory = getMemoryInfo();

    const processMemoryMB =
        Math.round(process.memoryUsage().rss / 1024 / 1024);

    const uptime = formatUptime(process.uptime());

    const nodeVersion = process.version;

    const cpuCores = os.cpus().length;

    const platform = os.platform();

    const architecture = os.arch();

    const hostname = os.hostname();

    res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8'
    });

    res.end(`
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<meta http-equiv="refresh" content="10">

<title>${APP_NAME}</title>

<style>

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Arial,
        sans-serif;

    background: #f4f7fb;

    color: #172033;

    min-height: 100vh;
}

/* HEADER */

.header {

    background:
        linear-gradient(
            135deg,
            #0f172a,
            #172554,
            #1e40af
        );

    color: white;

    padding: 35px 6% 100px;

    text-align: center;

}

.header h1 {

    font-size: 42px;

    margin-bottom: 12px;

}

.header p {

    font-size: 18px;

    opacity: 0.9;

}

.status {

    display: inline-block;

    margin-top: 20px;

    padding: 10px 22px;

    border-radius: 30px;

    background: rgba(34,197,94,0.18);

    color: #86efac;

    font-weight: bold;

}

/* CONTAINER */

.container {

    width: 90%;

    max-width: 1250px;

    margin: -55px auto 50px;

    position: relative;

}

/* TRAFFIC FLOW */

.flow {

    background: white;

    border-radius: 18px;

    padding: 30px;

    box-shadow:
        0 10px 35px rgba(15,23,42,0.12);

    margin-bottom: 30px;

}

.flow-title {

    text-align: center;

    font-size: 21px;

    font-weight: bold;

    margin-bottom: 25px;

}

.flow-container {

    display: flex;

    justify-content: center;

    align-items: center;

    gap: 12px;

    flex-wrap: wrap;

}

.flow-box {

    background: #eff6ff;

    border: 1px solid #dbeafe;

    border-radius: 14px;

    padding: 18px;

    min-width: 160px;

    text-align: center;

}

.flow-icon {

    font-size: 30px;

    margin-bottom: 8px;

}

.flow-name {

    font-weight: bold;

    font-size: 15px;

}

.flow-value {

    margin-top: 5px;

    color: #475569;

    font-size: 13px;

}

.arrow {

    font-size: 25px;

    color: #2563eb;

}

/* CARDS */

.grid {

    display: grid;

    grid-template-columns:
        repeat(auto-fit, minmax(260px, 1fr));

    gap: 20px;

}

.card {

    background: white;

    border-radius: 18px;

    padding: 25px;

    box-shadow:
        0 8px 25px rgba(15,23,42,0.08);

}

.card-top {

    display: flex;

    align-items: center;

    gap: 12px;

    margin-bottom: 18px;

}

.icon {

    width: 42px;

    height: 42px;

    display: flex;

    align-items: center;

    justify-content: center;

    background: #eff6ff;

    border-radius: 10px;

    font-size: 21px;

}

.label {

    font-size: 12px;

    text-transform: uppercase;

    letter-spacing: 1px;

    color: #64748b;

    font-weight: bold;

}

.value {

    font-size: 25px;

    font-weight: bold;

    word-break: break-word;

}

.description {

    margin-top: 8px;

    color: #64748b;

    font-size: 13px;

}

/* MEMORY */

.memory-bar {

    margin-top: 15px;

    height: 10px;

    background: #e2e8f0;

    border-radius: 10px;

    overflow: hidden;

}

.memory-progress {

    height: 100%;

    width: ${memory.percentage || 0}%;

    background: #2563eb;

}

/* FOOTER */

.footer {

    text-align: center;

    color: #64748b;

    margin-top: 35px;

    padding-bottom: 30px;

    font-size: 13px;

}

@media (max-width: 700px) {

    .header h1 {

        font-size: 30px;

    }

    .arrow {

        transform: rotate(90deg);

    }

}

</style>

</head>

<body>

<div class="header">

    <h1>Hello from Docker! 🐳</h1>

    <p>
        Node.js application running inside a Docker container
    </p>

    <div class="status">
        🟢 APPLICATION RUNNING
    </div>

</div>

<div class="container">

    <!-- TRAFFIC FLOW -->

    <div class="flow">

        <div class="flow-title">
            🐳 Docker Traffic Flow
        </div>

        <div class="flow-container">

            <div class="flow-box">

                <div class="flow-icon">
                    🌐
                </div>

                <div class="flow-name">
                    Browser
                </div>

                <div class="flow-value">
                    ${escapeHtml(clientIP)}
                </div>

            </div>

            <div class="arrow">
                →
            </div>

            <div class="flow-box">

                <div class="flow-icon">
                    🔌
                </div>

                <div class="flow-name">
                    Host Port
                </div>

                <div class="flow-value">
                    ${escapeHtml(DOCKER_HOST_IP)}:${escapeHtml(HOST_PORT)}
                </div>

            </div>

            <div class="arrow">
                →
            </div>

            <div class="flow-box">

                <div class="flow-icon">
                    🐳
                </div>

                <div class="flow-name">
                    Container
                </div>

                <div class="flow-value">
                    ${escapeHtml(CONTAINER_NAME)}
                </div>

            </div>

            <div class="arrow">
                →
            </div>

            <div class="flow-box">

                <div class="flow-icon">
                    🟢
                </div>

                <div class="flow-name">
                    Node.js
                </div>

                <div class="flow-value">
                    :${PORT}
                </div>

            </div>

        </div>

    </div>

    <!-- INFORMATION CARDS -->

    <div class="grid">

        ${createCard(
            '🌐',
            'Browser IP',
            clientIP,
            'Client address received by Node.js'
        )}

        ${createCard(
            '🖥️',
            'Docker Host',
            DOCKER_HOST_IP,
            'Docker server hosting this container'
        )}

        ${createCard(
            '🐳',
            'Container Name',
            CONTAINER_NAME,
            'Docker container name'
        )}

        ${createCard(
            '🆔',
            'Container ID',
            containerId,
            'Container hostname / ID'
        )}

        ${createCard(
            '🔌',
            'Container Port',
            PORT,
            'Node.js listening port'
        )}

        ${createCard(
            '🔗',
            'Host Port',
            HOST_PORT,
            'Port exposed by Docker'
        )}

        ${createCard(
            '🟢',
            'Node.js Version',
            nodeVersion,
            'Running Node.js version'
        )}

        ${createCard(
            '⚙️',
            'CPU Cores',
            cpuCores,
            'Available CPU cores'
        )}

        ${createCard(
            '💻',
            'Architecture',
            architecture,
            'Container architecture'
        )}

        ${createCard(
            '🐧',
            'Platform',
            platform,
            'Operating system platform'
        )}

        ${createCard(
            '⏱️',
            'Container Uptime',
            uptime,
            'Node.js process uptime'
        )}

        <div class="card">

            <div class="card-top">

                <div class="icon">
                    🧠
                </div>

                <div class="label">
                    Container Memory
                </div>

            </div>

            <div class="value">

                ${memory.usedMB} MB

                ${
                    memory.limitMB
                        ? `/ ${memory.limitMB} MB`
                        : ''
                }

            </div>

            <div class="description">

                ${
                    memory.percentage !== null
                        ? `${memory.percentage}% of container memory limit`
                        : 'Memory limit not configured'
                }

            </div>

            ${
                memory.percentage !== null
                    ? `
                        <div class="memory-bar">
                            <div
                                class="memory-progress"
                            ></div>
                        </div>
                    `
                    : ''
            }

        </div>

        ${createCard(
            '🧠',
            'Node.js Process Memory',
            `${processMemoryMB} MB`,
            'RSS memory used by Node.js'
        )}

        ${createCard(
            '📦',
            'Application',
            APP_NAME,
            `Version ${APP_VERSION}`
        )}

        ${createCard(
            '🏷️',
            'Container Hostname',
            hostname,
            'Hostname visible inside container'
        )}

    </div>

    <div class="footer">

        Docker Node.js Dashboard •
        Version ${APP_VERSION} •
        Auto-refresh every 10 seconds

    </div>

</div>

</body>

</html>
    `);
});

server.listen(PORT, HOST, () => {

    console.log(
        `${APP_NAME} running on ${HOST}:${PORT}`
    );

});
