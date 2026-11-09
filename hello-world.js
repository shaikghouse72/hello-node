
'use strict';

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

function readFile(path) {
  try {
    return fs.readFileSync(path, 'utf8').trim();
  } catch {
    return null;
  }
}

function getMemory() {
  const raw = readFile('/sys/fs/cgroup/memory.current');
  const maxRaw = readFile('/sys/fs/cgroup/memory.max');
  const current = raw === null ? NaN : Number(raw);

  if (Number.isFinite(current) && current >= 0) {
    const usedMB = Math.round(current / 1048576);
    if (maxRaw && maxRaw !== 'max') {
      const max = Number(maxRaw);
      if (Number.isFinite(max) && max > 0) {
        return {
          usedMB,
          limitMB: Math.round(max / 1048576),
          percentage: Number((current / max * 100).toFixed(1))
        };
      }
    }
    return { usedMB, limitMB: null, percentage: null };
  }

  return {
    usedMB: Math.round(process.memoryUsage().rss / 1048576),
    limitMB: null,
    percentage: null
  };
}

function formatUptime(seconds) {
  let s = Math.floor(seconds);
  const d = Math.floor(s / 86400);
  s %= 86400;
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  s %= 60;
  return [
    d ? `${d}d` : '',
    h ? `${h}h` : '',
    m ? `${m}m` : '',
    `${s}s`
  ].filter(Boolean).join(' ');
}

function clientIP(req) {
  if (process.env.TRUST_PROXY === 'true') {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded) {
      return forwarded.split(',')[0].trim();
    }
  }
  return req.socket.remoteAddress || 'Unknown';
}

let previousCPU = process.cpuUsage();
let previousTime = process.hrtime.bigint();

function cpuUsage() {
  const now = process.hrtime.bigint();
  const elapsed = Number(now - previousTime) / 1000;
  const delta = process.cpuUsage(previousCPU);
  previousCPU = process.cpuUsage();
  previousTime = now;

  return elapsed > 0
    ? Number(((delta.user + delta.system) / elapsed * 100).toFixed(1))
    : 0;
}

function getStatus(req) {
  return {
    status: 'running',
    appName: APP_NAME,
    appVersion: APP_VERSION,
    clientIP: clientIP(req),
    dockerHostIP: DOCKER_HOST_IP,
    hostPort: HOST_PORT,
    containerName: CONTAINER_NAME,
    containerId: readFile('/etc/hostname') || os.hostname(),
    containerPort: PORT,
    nodeVersion: process.version,
    cpuCores: os.availableParallelism
      ? os.availableParallelism()
      : os.cpus().length,
    cpuPercent: cpuUsage(),
    platform: os.platform(),
    architecture: os.arch(),
    hostname: os.hostname(),
    uptimeSeconds: Math.floor(process.uptime()),
    uptime: formatUptime(process.uptime()),
    memory: getMemory(),
    processMemoryMB: Math.round(process.memoryUsage().rss / 1048576),
    timestamp: new Date().toISOString()
  };
}

function dashboard(status) {
  const initialData = JSON.stringify(status)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>Docker Studio | Live Dashboard</title>

<style>
:root {
  --bg: #f5f7fc;
  --white: #ffffff;
  --text: #182842;
  --muted: #8593ac;
  --border: #e8edf7;
  --blue: #617cf4;
  --purple: #8264ef;
  --green: #17ad83;
  --shadow: 0 10px 30px rgba(33,52,97,.045);
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, "Segoe UI", Arial, sans-serif;
  font-size: 14px;
}

button { font: inherit; cursor: pointer; }
a { text-decoration: none; }

.layout { display: flex; min-height: 100vh; }

.sidebar {
  width: 245px;
  flex-shrink: 0;
  background: white;
  border-right: 1px solid var(--border);
  padding: 29px 18px;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}

.brand {
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 0 12px 39px;
}

.brand-logo {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  color: white;
  border-radius: 14px;
  font-size: 27px;
  font-weight: 800;
  background: linear-gradient(135deg,#6486ff,#8460ef);
  box-shadow: 0 8px 20px #6879eb38;
}

.brand strong {
  font-size: 19px;
  letter-spacing: -.8px;
}

.brand small {
  display: block;
  font-size: 10px;
  color: #8798b5;
  letter-spacing: 2px;
  font-weight: 750;
}

.nav-heading {
  padding: 0 14px;
  margin: 12px 0;
  color: #a3b0c7;
  font-size: 10px;
  letter-spacing: 2px;
  font-weight: 800;
}

.nav {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 15px;
  color: #687c99;
  border-radius: 12px;
  margin-bottom: 5px;
  font-weight: 650;
}

.nav:hover, .nav.active {
  background: #edf1ff;
  color: #4c6ff2;
}

.nav-icon { width: 23px; font-size: 18px; }

.sidebar-bottom {
  margin-top: auto;
  padding: 17px;
  background: #f3f7ff;
  border: 1px solid #e4ebfb;
  border-radius: 16px;
}

.sidebar-bottom strong { font-size: 12px; }
.sidebar-bottom p { color: var(--muted); font-size: 12px; margin-bottom: 0; }

.dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  background: #23c994;
  border-radius: 50%;
  box-shadow: 0 0 0 4px #23c99420;
  margin-right: 7px;
}

.main {
  flex: 1;
  min-width: 0;
  max-width: 1700px;
  padding: 34px clamp(20px,3.4vw,54px) 48px;
  margin: 0 auto;
}

.topbar, .heading, .panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.topbar { margin-bottom: 34px; }

.breadcrumbs { color: #91a0b8; font-size: 13px; font-weight: 650; }
.breadcrumbs b { color: #33496c; }

.actions { display: flex; align-items: center; gap: 12px; }

.live {
  display: inline-flex;
  align-items: center;
  padding: 9px 14px;
  border-radius: 25px;
  background: #f0fcf7;
  border: 1px solid #d9f4e9;
  color: #15906a;
  font-weight: 800;
  font-size: 12px;
}

.refresh {
  border: 1px solid var(--border);
  background: white;
  border-radius: 12px;
  color: #657897;
  padding: 10px 16px;
  font-weight: 700;
}

.refresh:hover { border-color: #a2b5fa; color: var(--blue); }
.refresh:disabled { opacity: .5; cursor: wait; }

.eyebrow {
  color: #7d61e9;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 11px;
  font-weight: 850;
}

h1 {
  font-size: clamp(29px,3vw,39px);
  letter-spacing: -1.5px;
  line-height: 1.2;
  margin: 8px 0;
}

.subtitle, .updated, .description {
  color: var(--muted);
}

.subtitle { margin: 0; }
.updated { font-size: 12px; white-space: nowrap; }

.heading { align-items: end; margin-bottom: 23px; }

.hero {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  border-radius: 24px;
  padding: 29px 32px;
  background: linear-gradient(110deg,#f0f1ff,#e7f1ff 57%,#e9faf4);
  border: 1px solid #e0e9fc;
  margin-bottom: 24px;
}

.hero h2 {
  margin: 10px 0;
  font-size: 25px;
  letter-spacing: -.8px;
}

.hero p {
  color: #7588a4;
  line-height: 1.7;
  max-width: 540px;
  margin: 0;
}

.hero-status {
  display: inline-block;
  background: #ffffffbd;
  border: 1px solid #d9efe8;
  border-radius: 30px;
  padding: 6px 12px;
  color: #148d69;
  font-size: 11px;
  font-weight: 800;
}

.hero-graphic {
  width: 115px;
  height: 115px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  margin: 0 40px;
  border-radius: 30px;
  transform: rotate(-13deg);
  background: linear-gradient(145deg,#98b0ff,#6b75f0);
  box-shadow: 20px 20px 40px #8b9de633;
}

.hero-graphic svg { width: 62px; height: 62px; transform: rotate(13deg); }

.grid {
  display: grid;
  grid-template-columns: repeat(4,minmax(0,1fr));
  gap: 17px;
  margin-bottom: 24px;
}

.card, .panel {
  background: white;
  border: 1px solid var(--border);
  border-radius: 22px;
  box-shadow: var(--shadow);
}

.card { padding: 22px; min-width: 0; }

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.card-title {
  font-size: 12px;
  color: #8291a9;
  font-weight: 700;
}

.card-icon {
  height: 42px;
  width: 42px;
  display: grid;
  place-items: center;
  font-size: 20px;
  border-radius: 13px;
  background: #eef1ff;
  color: #6379ed;
}

.card-icon.purple { background: #f2edff; color: #8662ea; }
.card-icon.green { background: #e8f9f1; color: #1dac83; }
.card-icon.orange { background: #fff3e6; color: #d88b36; }

.card-value {
  margin: 16px 0 5px;
  font-size: clamp(24px,2.5vw,31px);
  font-weight: 850;
  letter-spacing: -1px;
  overflow-wrap: anywhere;
}

.unit { font-size: 13px; color: #a0aec1; font-weight: 700; }
.card-note { color: #9eabc0; font-size: 11px; }

.panels {
  display: grid;
  grid-template-columns: minmax(0,1.45fr) minmax(300px,1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.panel { padding: 25px; min-width: 0; }
.panel-head { margin-bottom: 24px; }

.panel h3 {
  font-size: 17px;
  margin: 0;
  letter-spacing: -.4px;
}

.description { font-size: 12px; margin: 5px 0 0; }

.tag {
  background: #f2f5fc;
  color: #788aa6;
  padding: 7px 11px;
  border-radius: 10px;
  font-weight: 750;
  font-size: 11px;
  white-space: nowrap;
}

.chart-number { font-size: 33px; font-weight: 850; letter-spacing: -1px; }

.chart-svg { width: 100%; height: 190px; display: block; }

.gridline {
  stroke: #e9eef8;
  stroke-dasharray: 4 5;
  stroke-width: 1;
}

.chart-line {
  stroke: #6483f4;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.chart-area { fill: url(#areaGradient); }

.chart-label { fill: #a1aec2; font-size: 10px; }

.memory-content {
  display: flex;
  align-items: center;
  gap: 24px;
  margin: 30px 0;
}

.gauge {
  --fill: 0%;
  width: 155px;
  height: 155px;
  border-radius: 50%;
  background: conic-gradient(#8267ef var(--fill),#edf0fa 0);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.gauge-inner {
  width: 121px;
  height: 121px;
  background: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gauge-inner strong { font-size: 28px; letter-spacing: -1px; }
.gauge-inner span { color: #9caac0; font-size: 11px; }

.memory-value { font-size: 27px; font-weight: 850; }
.memory-text { font-size: 12px; color: #91a0b8; margin-top: 6px; }
.memory-legend { margin-top: 15px; font-size: 12px; color: #788aa5; }

.memory-legend div { margin-top: 6px; }

.legend-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 7px;
  border-radius: 50%;
  background: #8267ef;
}

.legend-dot.gray { background: #e6eaf5; }

.flow { margin-bottom: 24px; }

.flow-grid {
  display: grid;
  grid-template-columns: 1fr 35px 1fr 35px 1fr 35px 1fr;
  gap: 10px;
  align-items: center;
}

.flow-node {
  background: #fafcff;
  border: 1px solid #e9eef8;
  border-radius: 16px;
  padding: 22px 10px;
  min-width: 0;
  text-align: center;
}

.flow-icon {
  background: #edf1ff;
  color: #6179eb;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  font-size: 23px;
  margin: 0 auto 12px;
}

.flow-node strong { display: block; font-size: 12px; }
.flow-node small {
  display: block;
  color: #8e9fb8;
  margin-top: 7px;
  font-size: 11px;
  overflow-wrap: anywhere;
}

.arrow { color: #8eaff0; text-align: center; font-size: 25px; }

.details {
  display: grid;
  grid-template-columns: repeat(3,minmax(0,1fr));
  gap: 13px;
}

.detail {
  background: #f9fbff;
  border: 1px solid #edf1f9;
  border-radius: 13px;
  padding: 17px;
  min-width: 0;
}

.detail-label {
  display: block;
  color: #98a6bb;
  font-size: 11px;
  font-weight: 750;
  margin-bottom: 9px;
}

.detail-value {
  font-size: 13px;
  font-weight: 750;
  color: #405272;
  overflow-wrap: anywhere;
}

.error {
  display: none;
  padding: 13px 16px;
  margin-bottom: 20px;
  border-radius: 12px;
  color: #b75d28;
  background: #fff4eb;
  border: 1px solid #ffdec3;
}

.error.show { display: block; }

.footer {
  display: flex;
  justify-content: space-between;
  gap: 15px;
  margin-top: 30px;
  font-size: 12px;
  color: #9ba9bd;
}

@media(max-width:1200px) {
  .sidebar { width: 205px; }
  .grid { grid-template-columns: repeat(2,1fr); }
  .panels { grid-template-columns: 1fr; }
}

@media(max-width:800px) {
  .sidebar { display: none; }
  .main { padding: 20px 16px; }
  .hero-graphic { display: none; }
  .flow-grid { grid-template-columns: 1fr; }
  .arrow { transform: rotate(90deg); }
  .details { grid-template-columns: repeat(2,1fr); }
}

@media(max-width:520px) {
  .heading { display: block; }
  .updated { margin-top: 12px; }
  .topbar { flex-wrap: wrap; }
  .grid { gap: 10px; }
  .card { padding: 15px; }
  .card-value { font-size: 23px; }
  .card-icon { width: 33px; height: 33px; }
  .memory-content { flex-direction: column; align-items: start; }
  .details { grid-template-columns: 1fr; }
  .footer { flex-direction: column; }
}
</style>
</head>

<body>
<div class="layout">
<aside class="sidebar">
  <div class="brand">
    <div class="brand-logo">◇</div>
    <div><strong>Docker Studio</strong><small>INFRASTRUCTURE</small></div>
  </div>

  <div class="nav-heading">WORKSPACE</div>
  <a class="nav active" href="#overview"><span class="nav-icon">▦</span>Overview</a>
  <a class="nav" href="#performance"><span class="nav-icon">◉</span>Performance</a>
  <a class="nav" href="#network"><span class="nav-icon">◎</span>Network flow</a>
  <a class="nav" href="#details"><span class="nav-icon">▤</span>Container details</a>

  <div class="sidebar-bottom">
    <strong><span class="dot"></span>Service online</strong>
    <p>Node.js · Docker runtime</p>
  </div>
</aside>

<main class="main" id="overview">
  <div class="topbar">
    <div class="breadcrumbs">Workspace / Containers / <b>Overview</b></div>
    <div class="actions">
      <span class="live"><span class="dot"></span>LIVE</span>
      <button class="refresh" id="refresh" type="button">↻ Refresh</button>
    </div>
  </div>

  <div class="heading">
    <div>
      <div class="eyebrow">CONTAINER OBSERVABILITY</div>
      <h1>System overview</h1>
      <p class="subtitle">Live runtime insights for your Dockerized Node.js application.</p>
    </div>
    <div class="updated" id="updated">Updating...</div>
  </div>

  <div class="error" id="error" role="status">
    Unable to fetch current metrics. Showing the latest available reading.
  </div>

  <section class="hero">
    <div>
      <span class="hero-status"><span class="dot"></span>ALL SYSTEMS OPERATIONAL</span>
      <h2>Your container is up and running.</h2>
      <p>Monitor performance, explore runtime information and follow application traffic from one clear workspace.</p>
    </div>
    <div class="hero-graphic">
      <svg viewBox="0 0 80 80" fill="none" stroke="white" stroke-width="4" stroke-linejoin="round">
        <path d="M40 9 67 24 40 39 13 24 40 9Z"/>
        <path d="M13 34 40 49 67 34M13 45 40 60 67 45M13 56 40 71 67 56"/>
      </svg>
    </div>
  </section>

  <section class="grid">
    <article class="card">
      <div class="card-head"><span class="card-title">Process CPU</span><span class="card-icon">◉</span></div>
      <div class="card-value"><span id="cpuMetric">0.0</span><span class="unit"> %</span></div>
      <div class="card-note">Across one logical CPU</div>
    </article>

    <article class="card">
      <div class="card-head"><span class="card-title">Container memory</span><span class="card-icon purple">◇</span></div>
      <div class="card-value"><span id="memMetric">0</span><span class="unit"> MB</span></div>
      <div class="card-note" id="memCaption">Current memory usage</div>
    </article>

    <article class="card">
      <div class="card-head"><span class="card-title">Process uptime</span><span class="card-icon green">◷</span></div>
      <div class="card-value" id="uptimeMetric">—</div>
      <div class="card-note">Node.js process uptime</div>
    </article>

    <article class="card">
      <div class="card-head"><span class="card-title">Node.js memory</span><span class="card-icon orange">▤</span></div>
      <div class="card-value"><span id="rssMetric">0</span><span class="unit"> MB</span></div>
      <div class="card-note">Resident set size (RSS)</div>
    </article>
  </section>

  <div class="panels" id="performance">
    <section class="panel">
      <div class="panel-head">
        <div>
          <h3>CPU usage trend</h3>
          <p class="description">Recent readings from the Node.js process</p>
        </div>
        <span class="tag">10s interval</span>
      </div>

      <div class="chart-number"><span id="cpuLarge">0.0</span><span class="unit"> %</span></div>

      <svg class="chart-svg" viewBox="0 0 600 180" preserveAspectRatio="none" aria-label="CPU usage chart">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#8ea8ff" stop-opacity=".35"/>
            <stop offset="100%" stop-color="#8ea8ff" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path class="gridline" d="M30 18H590M30 60H590M30 102H590M30 144H590"/>
        <text class="chart-label" x="0" y="22">100</text>
        <text class="chart-label" x="6" y="148">0</text>
        <path id="area" class="chart-area" d=""/>
        <path id="line" class="chart-line" d=""/>
      </svg>

      <p class="description">Live history is collected while this browser tab is open.</p>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h3>Memory allocation</h3>
          <p class="description">Container cgroup memory consumption</p>
        </div>
        <span class="tag">Live usage</span>
      </div>

      <div class="memory-content">
        <div class="gauge" id="memoryGauge">
          <div class="gauge-inner">
            <strong id="gaugePercent">N/A</strong>
            <span>of limit</span>
          </div>
        </div>

        <div>
          <div class="memory-value"><span id="memBig">0</span> MB</div>
          <div class="memory-text" id="memLimit">No memory limit configured</div>
          <div class="memory-legend">
            <div><span class="legend-dot"></span>Used memory</div>
            <div><span class="legend-dot gray"></span>Available to limit</div>
          </div>
        </div>
      </div>

      <p class="description">When no memory limit is configured, the gauge displays N/A.</p>
    </section>
  </div>

  <section class="panel flow" id="network">
    <div class="panel-head">
      <div>
        <h3>Application traffic flow</h3>
        <p class="description">Illustrative client-to-container connection path</p>
      </div>
      <span class="tag">Network topology</span>
    </div>

    <div class="flow-grid">
      <div class="flow-node">
        <div class="flow-icon">◎</div>
        <strong>Browser / Client</strong>
        <small id="flowClient">—</small>
      </div>
      <div class="arrow">→</div>
      <div class="flow-node">
        <div class="flow-icon">▤</div>
        <strong>Docker host</strong>
        <small id="flowHost">—</small>
      </div>
      <div class="arrow">→</div>
      <div class="flow-node">
        <div class="flow-icon">◇</div>
        <strong>Container</strong>
        <small id="flowContainer">—</small>
      </div>
      <div class="arrow">→</div>
      <div class="flow-node">
        <div class="flow-icon">⌘</div>
        <strong>Node.js</strong>
        <small id="flowNode">—</small>
      </div>
    </div>
  </section>

  <section class="panel" id="details">
    <div class="panel-head">
      <div>
        <h3>Environment & runtime</h3>
        <p class="description">Information about this application instance</p>
      </div>
      <span class="tag">Environment details</span>
    </div>

    <div class="details">
      <div class="detail"><span class="detail-label">Docker host IP</span><strong class="detail-value" id="detailHost">—</strong></div>
      <div class="detail"><span class="detail-label">Container name</span><strong class="detail-value" id="detailName">—</strong></div>
      <div class="detail"><span class="detail-label">Container ID</span><strong class="detail-value" id="detailId">—</strong></div>
      <div class="detail"><span class="detail-label">Host port</span><strong class="detail-value" id="detailHostPort">—</strong></div>
      <div class="detail"><span class="detail-label">Container port</span><strong class="detail-value" id="detailContainerPort">—</strong></div>
      <div class="detail"><span class="detail-label">Node.js version</span><strong class="detail-value" id="detailNode">—</strong></div>
      <div class="detail"><span class="detail-label">Available CPU cores</span><strong class="detail-value" id="detailCores">—</strong></div>
      <div class="detail"><span class="detail-label">OS / architecture</span><strong class="detail-value" id="detailOS">—</strong></div>
      <div class="detail"><span class="detail-label">Container hostname</span><strong class="detail-value" id="detailHostname">—</strong></div>
      <div class="detail"><span class="detail-label">Application</span><strong class="detail-value" id="detailApp">—</strong></div>
      <div class="detail"><span class="detail-label">Application version</span><strong class="detail-value" id="detailVersion">—</strong></div>
      <div class="detail"><span class="detail-label">Client IP</span><strong class="detail-value" id="detailClient">—</strong></div>
    </div>
  </section>

  <div class="footer">
    <span>Docker Studio · Lightweight Node.js Dashboard</span>
    <span>Auto-refresh every 10 seconds</span>
  </div>
</main>
</div>

<script id="initial" type="application/json">${initialData}</script>
<script>
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const history = [];
  const put = (id, value) => {
    const element = $(id);
    if (element) element.textContent = String(value ?? 'Unknown');
  };

  function drawGraph() {
    const values = history.length ? history : [0];
    const top = 18;
    const bottom = 144;
    const left = 30;
    const right = 590;
    const maximum = Math.max(100,Math.ceil(Math.max(...values)/25)*25);

    const points = values.map((value,index) => [
      left + index / Math.max(1,values.length-1) * (right-left),
      bottom - Math.min(value,maximum)/maximum * (bottom-top)
    ]);

    const path = points.map((point,index) =>
      (index ? 'L' : 'M') + point[0].toFixed(1) + ' ' + point[1].toFixed(1)
    ).join(' ');

    $('line').setAttribute('d',path);
    $('area').setAttribute(
      'd',
      path + ' L' + points[points.length-1][0].toFixed(1) +
      ' ' + bottom + ' L' + left + ' ' + bottom + ' Z'
    );
  }

  function render(data) {
    const cpu = Number(data.cpuPercent) || 0;
    const mem = data.memory || {};

    put('cpuMetric',cpu.toFixed(1));
    put('cpuLarge',cpu.toFixed(1));
    put('memMetric',mem.usedMB ?? '—');
    put('memBig',mem.usedMB ?? '—');
    put('uptimeMetric',data.uptime);
    put('rssMetric',data.processMemoryMB);

    put(
      'memCaption',
      mem.limitMB !== null && mem.limitMB !== undefined
        ? 'Limit ' + mem.limitMB + ' MB'
        : 'No configured limit'
    );

    const percentage = mem.percentage == null
      ? null
      : Math.max(0,Math.min(100,Number(mem.percentage) || 0));

    $('memoryGauge').style.setProperty(
      '--fill',
      (percentage ?? 0) + '%'
    );

    put(
      'gaugePercent',
      percentage === null ? 'N/A' : percentage.toFixed(1) + '%'
    );

    put(
      'memLimit',
      mem.limitMB == null
        ? 'No memory limit configured'
        : 'of ' + mem.limitMB + ' MB configured limit'
    );

    put('flowClient',data.clientIP);
    put('flowHost',data.dockerHostIP + ':' + data.hostPort);
    put('flowContainer',data.containerName);
    put('flowNode',':' + data.containerPort);

    const fields = {
      detailHost: data.dockerHostIP,
      detailName: data.containerName,
      detailId: data.containerId,
      detailHostPort: data.hostPort,
      detailContainerPort: data.containerPort,
      detailNode: data.nodeVersion,
      detailCores: data.cpuCores,
      detailOS: data.platform + ' / ' + data.architecture,
      detailHostname: data.hostname,
      detailApp: data.appName,
      detailVersion: data.appVersion,
      detailClient: data.clientIP
    };

    Object.keys(fields).forEach(key => put(key,fields[key]));

    put('updated','Updated ' + new Date(data.timestamp).toLocaleTimeString());

    history.push(cpu);
    if (history.length > 35) history.shift();
    drawGraph();
  }

  let busy = false;

  async function refresh() {
    if (busy) return;

    busy = true;
    $('refresh').disabled = true;

    try {
      // Relative URL works behind the Nginx /hello-node/ prefix.
      const response = await fetch('api/status', {
        cache: 'no-store',
        signal: AbortSignal.timeout(7000)
      });

      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }

      const data = await response.json();
      render(data);
      $('error').classList.remove('show');
    } catch (error) {
      console.error('Metrics refresh failed:',error);
      $('error').classList.add('show');
    } finally {
      busy = false;
      $('refresh').disabled = false;
    }
  }

  render(JSON.parse($('initial').textContent));
  $('refresh').addEventListener('click',refresh);
  setInterval(refresh,10000);
})();
</script>
</body>
</html>`;
}

const server = http.createServer((req,res) => {
  const path = (req.url || '/').split('?')[0];

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {
      'Content-Type': 'text/plain; charset=utf-8',
      Allow: 'GET, HEAD'
    });
    return res.end('Method not allowed');
  }

  if (path === '/health') {
    res.writeHead(200,{
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    return res.end(
      req.method === 'HEAD' ? undefined : JSON.stringify({status:'healthy'})
    );
  }

  if (path === '/api/status') {
    res.writeHead(200,{
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    return res.end(
      req.method === 'HEAD' ? undefined : JSON.stringify(getStatus(req))
    );
  }

  if (path !== '/') {
    res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});
    return res.end(req.method === 'HEAD' ? undefined : 'Not found');
  }

  const html = dashboard(getStatus(req));

  res.writeHead(200,{
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy':
      "default-src 'none'; style-src 'unsafe-inline'; " +
      "script-src 'unsafe-inline'; connect-src 'self'; " +
      "img-src 'self' data:; base-uri 'none'; form-action 'none'"
  });

  return res.end(req.method === 'HEAD' ? undefined : html);
});

if (require.main === module) {
  server.listen(PORT,HOST,() => {
    console.log(`${APP_NAME} running on ${HOST}:${PORT}`);
  });
}

module.exports = server;

