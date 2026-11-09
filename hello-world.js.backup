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

function readText(path) {
  try { return fs.readFileSync(path, 'utf8').trim(); } catch { return null; }
}
function containerId() { return readText('/etc/hostname') || os.hostname(); }
function getMemoryInfo() {
  const current = Number(readText('/sys/fs/cgroup/memory.current'));
  const raw = readText('/sys/fs/cgroup/memory.max');
  if (raw !== null && Number.isFinite(current) && current >= 0 && raw !== 'max') {
    const max = Number(raw);
    if (Number.isFinite(max) && max > 0) {
      return { usedMB: Math.round(current / 1048576), limitMB: Math.round(max / 1048576), percentage: +(100 * current / max).toFixed(1) };
    }
  }
  if (raw === 'max' && Number.isFinite(current) && current >= 0) {
    return { usedMB: Math.round(current / 1048576), limitMB: null, percentage: null };
  }
  return { usedMB: Math.round(process.memoryUsage().rss / 1048576), limitMB: null, percentage: null };
}
function clientIp(req) {
  // Trust forwarding headers only when the service is behind a trusted reverse proxy.
  if (process.env.TRUST_PROXY === 'true') {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'Unknown';
}
function formatUptime(value) {
  let s = Math.floor(value);
  const d = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); s %= 60;
  return [d ? d + 'd' : '', h ? h + 'h' : '', m ? m + 'm' : '', s + 's'].filter(Boolean).join(' ');
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}
let lastCpuUsage = process.cpuUsage();
let lastCpuSample = process.hrtime.bigint();
function getCpuPercent() {
  const now = process.hrtime.bigint();
  const elapsed = Number(now - lastCpuSample) / 1000;
  const delta = process.cpuUsage(lastCpuUsage);
  lastCpuSample = now;
  lastCpuUsage = process.cpuUsage();
  // CPU percentage of one logical CPU. Values above 100% are possible with multiple threads.
  return elapsed > 0 ? +((delta.user + delta.system) / elapsed * 100).toFixed(1) : 0;
}
function snapshot(req) {
  return {
    status: 'running', appName: APP_NAME, appVersion: APP_VERSION,
    clientIP: clientIp(req), dockerHostIP: DOCKER_HOST_IP,
    hostPort: HOST_PORT, containerName: CONTAINER_NAME,
    containerId: containerId(), containerPort: PORT,
    nodeVersion: process.version, cpuCores: os.availableParallelism ? os.availableParallelism() : os.cpus().length,
    cpuPercent: getCpuPercent(), platform: os.platform(), architecture: os.arch(),
    hostname: os.hostname(), uptimeSeconds: Math.floor(process.uptime()),
    uptime: formatUptime(process.uptime()), memory: getMemoryInfo(),
    processMemoryMB: Math.round(process.memoryUsage().rss / 1048576),
    timestamp: new Date().toISOString()
  };
}

function renderPage(data) {
  const safeJson = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Docker Studio | Live dashboard</title>
<style>
:root{--bg:#f5f7fc;--paper:#fff;--ink:#15233b;--muted:#8090a8;--line:#e8eef6;--blue:#4672ed;--violet:#7958ec;--green:#16a87a;--shadow:0 14px 45px rgba(32,54,91,.055);--radius:22px}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.55 Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
button{font:inherit}svg{display:block}.layout{display:flex;min-height:100vh}.sidebar{width:242px;flex-shrink:0;background:var(--paper);border-right:1px solid var(--line);padding:30px 18px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
.brand{display:flex;align-items:center;gap:12px;padding:0 14px 35px;font-size:19px;letter-spacing:-.7px;font-weight:800}.brand-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:linear-gradient(145deg,#6a83f8,#7953e9);color:white;box-shadow:0 8px 20px #6b72ef33}.brand-mark svg{width:23px;height:23px}.brand small{display:block;color:#8a98ad;font-size:10px;font-weight:650;letter-spacing:2px;text-transform:uppercase;margin-top:-3px}
.nav-label{padding:0 14px;margin:13px 0;color:#a1acc0;letter-spacing:1.6px;font-size:10px;font-weight:800;text-transform:uppercase}.nav-link{display:flex;align-items:center;gap:12px;text-decoration:none;padding:12px 14px;border-radius:12px;color:#6c7c95;font-weight:650;margin-bottom:5px}.nav-link svg{width:18px;height:18px}.nav-link.active{background:#edf1ff;color:#496ce4}.nav-link:hover{background:#f5f7fc}.sidebar-bottom{margin-top:auto;padding:16px 14px;border-radius:15px;background:#f4f7ff;border:1px solid #e7edfc}.sidebar-bottom .small{color:#8392aa;font-size:12px}.sidebar-bottom strong{font-size:12px;display:flex;align-items:center;gap:8px;margin-bottom:5px}.dot{width:8px;height:8px;border-radius:100%;background:#25c792;box-shadow:0 0 0 4px #25c7921f;display:inline-block;flex:none}
.main{flex:1;min-width:0;padding:33px clamp(20px,3.3vw,55px) 45px;max-width:1700px;margin:auto}.topbar{display:flex;justify-content:space-between;align-items:center;gap:18px;margin-bottom:30px}.breadcrumbs{font-size:13px;font-weight:650;color:#8b99ae}.breadcrumbs b{color:#334568}.top-actions{display:flex;align-items:center;gap:12px}.live-pill{display:flex;align-items:center;gap:9px;padding:8px 13px;border:1px solid #d7f4e9;border-radius:50px;background:#f0fcf7;color:#13845f;font-weight:750;font-size:12px}.refresh{border:1px solid var(--line);background:#fff;color:#687b98;border-radius:12px;padding:9px 14px;cursor:pointer;font-weight:700}.refresh:hover{color:var(--blue);border-color:#cdd8ff}.refresh:disabled{opacity:.55;cursor:wait}
.heading{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:23px}.eyebrow{font-size:11px;font-weight:800;letter-spacing:2px;color:#7b63e8;text-transform:uppercase}.heading h1{font-size:clamp(27px,3vw,37px);line-height:1.18;letter-spacing:-1.4px;margin:5px 0 7px}.subtle{color:#8190a6;margin:0}.updated{font-size:12px;color:#9cabc0;white-space:nowrap}
.hero{background:linear-gradient(112deg,#f0f2ff 0%,#e7f1ff 55%,#e9f8f5 100%);border:1px solid #e3eafa;border-radius:var(--radius);padding:28px 32px;display:grid;grid-template-columns:1fr auto;align-items:center;gap:20px;margin-bottom:24px;position:relative;overflow:hidden}.hero:before{content:"";position:absolute;width:270px;height:270px;right:15%;top:-170px;background:#ffffff60;filter:blur(3px);border-radius:50%;pointer-events:none}.hero h2{font-size:25px;margin:6px 0 8px;letter-spacing:-.7px}.hero p{color:#7385a2;margin:0;max-width:530px}.hero-badge{display:inline-flex;align-items:center;gap:8px;color:#128963;background:#ffffffbf;border:1px solid #d7eee6;padding:5px 11px;border-radius:40px;font-size:11px;font-weight:800;letter-spacing:.5px}.hero-art{width:175px;height:120px;position:relative}.orb{position:absolute;inset:5px 30px 5px 30px;border-radius:32px;background:linear-gradient(145deg,#a1b6ff,#6574ee);transform:rotate(-13deg);box-shadow:20px 15px 40px #8b9deb35}.orb svg{width:64px;height:64px;position:absolute;top:25px;left:28px;color:white;transform:rotate(13deg)}.orb:after{content:"";position:absolute;width:65px;height:65px;border-radius:25px;border:1px solid #fff8;top:-15px;right:-37px;z-index:-1}
.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:17px;margin-bottom:24px}.panel,.stat{background:var(--paper);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}.stat{padding:21px 22px;min-width:0}.stat-head{display:flex;justify-content:space-between;gap:12px;align-items:center}.stat-label{color:#8593aa;font-size:12px;font-weight:700}.stat-icon{width:39px;height:39px;display:grid;place-items:center;border-radius:13px;background:#edf1ff;color:#6076ea}.stat-icon.violet{background:#f2eeff;color:#8862e9}.stat-icon.mint{background:#e8faf2;color:#26a786}.stat-icon.orange{background:#fff4e6;color:#d99139}.stat-icon svg{width:19px;height:19px}.stat-value{font-weight:800;letter-spacing:-.9px;font-size:clamp(23px,2.6vw,30px);margin:12px 0 4px;overflow-wrap:anywhere}.stat-foot{font-size:11px;color:#9cabc0}.stat-foot strong{color:#179c76;font-weight:800}
.section-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(310px,1fr);gap:20px;margin-bottom:24px}.panel{padding:24px}.panel-title{margin:0;font-size:16px;letter-spacing:-.3px;font-weight:800}.panel-desc{font-size:12px;color:#94a1b5;margin:4px 0 0}.panel-header{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:22px}.tag{background:#f1f4fc;color:#7587aa;font-size:11px;font-weight:750;border-radius:9px;padding:6px 10px;white-space:nowrap}
.chart-summary{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}.chart-number{font-weight:850;font-size:31px;letter-spacing:-1.1px}.chart-unit{font-size:13px;color:#9aacbf;font-weight:700}.chart-legend{display:flex;gap:8px;align-items:center;color:#91a1b6;font-size:11px}.legend-dot{width:9px;height:9px;background:#6381f0;border-radius:50%}.chart-svg{width:100%;height:170px;overflow:visible}.gridline{stroke:#ebeff7;stroke-width:1;stroke-dasharray:4 6}.axis-label{font-size:10px;fill:#a2aec0}.chart-line{fill:none;stroke:#6684f5;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.chart-area{fill:url(#areaGradient)}
.memory-overview{display:flex;gap:20px;align-items:center;margin:30px 0}.gauge{--fill:0%;height:150px;width:150px;flex:none;border-radius:50%;background:conic-gradient(#8569ed var(--fill),#eef0fa 0);display:grid;place-items:center;position:relative}.gauge:before{content:"";position:absolute;inset:17px;border-radius:50%;background:#fff}.gauge-content{z-index:1;text-align:center}.gauge-content strong{display:block;font-size:28px;letter-spacing:-1px}.gauge-content span{font-size:11px;color:#95a4b7}.memory-details{flex:1;min-width:0}.memory-details .big{font-size:26px;font-weight:800;letter-spacing:-.9px}.memory-details .mini{font-size:12px;color:#94a3b8;margin:4px 0 20px}.memory-details .key{display:flex;gap:7px;align-items:center;font-size:12px;color:#71809d}.memory-details .key:before{content:"";width:8px;height:8px;background:#8569ed;border-radius:50%}.memory-details .key.gray:before{background:#e5e9f5}.memory-details .key+.key{margin-top:8px}
.flow{margin-bottom:24px}.flow-steps{display:grid;grid-template-columns:1fr 42px 1fr 42px 1fr 42px 1fr;align-items:center;gap:8px}.flow-node{border:1px solid #e9eef8;border-radius:16px;background:#fbfcff;padding:20px 12px;min-height:130px;text-align:center;display:flex;align-items:center;flex-direction:column;justify-content:center;min-width:0}.flow-node .node-icon{width:38px;height:38px;border-radius:12px;background:#edf1ff;color:#6376e7;display:grid;place-items:center;margin-bottom:10px}.flow-node .node-icon svg{height:20px;width:20px}.flow-node strong{font-size:12px}.flow-node small{font-size:11px;color:#94a2b5;margin-top:4px;max-width:100%;overflow-wrap:anywhere}.connector{height:2px;background:linear-gradient(90deg,#9db2f4,#8fcfc5);position:relative}.connector:after{content:"";position:absolute;right:0;top:-4px;width:8px;height:8px;border-top:2px solid #83bcb9;border-right:2px solid #83bcb9;transform:rotate(45deg)}
.details{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.detail{padding:15px 17px;background:#f8faff;border:1px solid #edf1f9;border-radius:13px;min-width:0}.detail label{display:block;color:#9ba7b9;font-weight:700;font-size:11px;margin-bottom:7px}.detail strong{font-size:13px;color:#3b4c6b;font-weight:750;overflow-wrap:anywhere}.footer{color:#a2aec0;font-size:12px;display:flex;justify-content:space-between;gap:14px;margin-top:28px}.error-banner{display:none;background:#fff4ed;border:1px solid #ffe0c8;color:#b65825;padding:11px 14px;border-radius:12px;margin-bottom:20px}.error-banner.show{display:block}
@media(max-width:1200px){.sidebar{width:204px}.stats{grid-template-columns:repeat(2,1fr)}.section-grid{grid-template-columns:1fr}}
@media(max-width:800px){.sidebar{display:none}.main{padding:22px 17px}.flow-steps{grid-template-columns:1fr;gap:9px}.connector{height:25px;width:2px;margin:auto;background:linear-gradient(#9db2f4,#8fcfc5)}.connector:after{top:auto;bottom:0;right:-4px;transform:rotate(135deg)}.flow-node{min-height:108px}.details{grid-template-columns:repeat(2,minmax(0,1fr))}.hero-art{display:none}.hero{grid-template-columns:1fr}}
@media(max-width:520px){.heading{display:block}.updated{margin-top:8px}.stats{grid-template-columns:1fr 1fr;gap:10px}.stat{padding:15px}.stat-value{font-size:22px}.stat-icon{width:32px;height:32px}.topbar{margin-bottom:20px}.memory-overview{flex-direction:column;align-items:start}.details{grid-template-columns:1fr}.footer{flex-direction:column}.hero{padding:23px}.panel{padding:19px}}
@media(prefers-reduced-motion:no-preference){.stat,.panel{transition:transform .2s,box-shadow .2s}.stat:hover{transform:translateY(-3px);box-shadow:0 20px 45px #344a7214}}
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true"><symbol id="i-box" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m8 12 3 3 5-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol><symbol id="i-grid" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></g></symbol><symbol id="i-cpu" viewBox="0 0 24 24"><g stroke="currentColor" fill="none" stroke-width="1.7" stroke-linecap="round"><rect x="5" y="5" width="14" height="14" rx="3"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3"/></g></symbol><symbol id="i-layers" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></g></symbol><symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/></symbol><symbol id="i-globe" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></g></symbol><symbol id="i-server" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M7 7h2M7 17h2" stroke-linecap="round"/></g></symbol><symbol id="i-terminal" viewBox="0 0 24 24"><g stroke="currentColor" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="3.5" width="19" height="17" rx="3"/><path d="m7 9 3 3-3 3m6 0h4"/></g></symbol></svg>
<div class="layout">
<aside class="sidebar"><div class="brand"><span class="brand-mark"><svg><use href="#i-layers"/></svg></span><span>Docker Studio<small>Infrastructure</small></span></div><div class="nav-label">Workspace</div><a class="nav-link active" href="#overview"><svg><use href="#i-grid"/></svg> Overview</a><a class="nav-link" href="#performance"><svg><use href="#i-cpu"/></svg> Performance</a><a class="nav-link" href="#network"><svg><use href="#i-globe"/></svg> Network flow</a><a class="nav-link" href="#details"><svg><use href="#i-server"/></svg> Container details</a><div class="sidebar-bottom"><strong><span class="dot"></span> Service online</strong><div class="small">Node.js · Docker runtime</div></div></aside>
<main class="main" id="overview">
<div class="topbar"><div class="breadcrumbs">Workspace &nbsp;/&nbsp; Containers &nbsp;/&nbsp; <b>Overview</b></div><div class="top-actions"><span class="live-pill"><span class="dot"></span> LIVE</span><button class="refresh" id="refresh" type="button">↻ Refresh</button></div></div>
<div class="heading"><div><div class="eyebrow">Container observability</div><h1>System overview</h1><p class="subtle">Live runtime insights for your Dockerized Node.js application.</p></div><div class="updated" id="updated">Updating...</div></div>
<div class="error-banner" id="error" role="status">Unable to fetch current metrics. Showing the latest available reading.</div>
<section class="hero"><div><span class="hero-badge"><span class="dot"></span> ALL SYSTEMS OPERATIONAL</span><h2>Your container is up and running.</h2><p>Monitor performance, explore runtime information and follow application traffic from one clear workspace.</p></div><div class="hero-art" aria-hidden="true"><div class="orb"><svg><use href="#i-layers"/></svg></div></div></section>
<section class="stats" aria-label="Key metrics"><article class="stat"><div class="stat-head"><span class="stat-label">Process CPU</span><span class="stat-icon"><svg><use href="#i-cpu"/></svg></span></div><div class="stat-value"><span id="cpuMetric">—</span><span class="chart-unit"> %</span></div><div class="stat-foot">Across one logical CPU</div></article><article class="stat"><div class="stat-head"><span class="stat-label">Container memory</span><span class="stat-icon violet"><svg><use href="#i-layers"/></svg></span></div><div class="stat-value"><span id="memMetric">—</span><span class="chart-unit"> MB</span></div><div class="stat-foot" id="memCaption">Current cgroup use</div></article><article class="stat"><div class="stat-head"><span class="stat-label">Process uptime</span><span class="stat-icon mint"><svg><use href="#i-clock"/></svg></span></div><div class="stat-value" id="uptimeMetric">—</div><div class="stat-foot"><strong>Running</strong> since Node.js startup</div></article><article class="stat"><div class="stat-head"><span class="stat-label">Node.js memory</span><span class="stat-icon orange"><svg><use href="#i-server"/></svg></span></div><div class="stat-value"><span id="rssMetric">—</span><span class="chart-unit"> MB</span></div><div class="stat-foot">Resident set size (RSS)</div></article></section>
<div class="section-grid" id="performance"><section class="panel"><div class="panel-header"><div><h2 class="panel-title">CPU usage trend</h2><p class="panel-desc">Recent readings from this Node.js process</p></div><span class="tag">10s interval</span></div><div class="chart-summary"><div><span class="chart-number" id="cpuLarge">0.0</span><span class="chart-unit"> %</span></div><div class="chart-legend"><span class="legend-dot"></span> Process CPU</div></div><svg class="chart-svg" viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label="Recent CPU usage line chart"><defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8fa8ff" stop-opacity=".32"/><stop offset="100%" stop-color="#8fa8ff" stop-opacity="0"/></linearGradient></defs><path class="gridline" d="M30 18H590M30 60H590M30 102H590M30 144H590"/><text class="axis-label" x="0" y="22">100</text><text class="axis-label" x="5" y="148">0</text><path class="chart-area" id="area" d=""/><path class="chart-line" id="line" d=""/></svg><p class="panel-desc" style="margin-top:6px">Live samples are stored only in this browser tab. The chart starts collecting after opening this page.</p></section>
<section class="panel"><div class="panel-header"><div><h2 class="panel-title">Memory allocation</h2><p class="panel-desc">Container cgroup memory consumption</p></div><span class="tag">Live usage</span></div><div class="memory-overview"><div class="gauge" id="memoryGauge"><div class="gauge-content"><strong id="gaugePercent">—</strong><span>of limit</span></div></div><div class="memory-details"><div class="big"><span id="memBig">—</span> MB</div><div class="mini" id="memLimit">Container memory use</div><div class="key">Used memory</div><div class="key gray">Available to limit</div></div></div><p class="panel-desc">If no memory limit is configured, the gauge displays N/A rather than an estimated percentage.</p></section></div>
<section class="panel flow" id="network"><div class="panel-header"><div><h2 class="panel-title">Application traffic flow</h2><p class="panel-desc">Connection path from client to application</p></div><span class="tag">Network topology</span></div><div class="flow-steps"><div class="flow-node"><span class="node-icon"><svg><use href="#i-globe"/></svg></span><strong>Browser / Client</strong><small id="flowClient">—</small></div><div class="connector"></div><div class="flow-node"><span class="node-icon"><svg><use href="#i-server"/></svg></span><strong>Docker host</strong><small id="flowHost">—</small></div><div class="connector"></div><div class="flow-node"><span class="node-icon"><svg><use href="#i-layers"/></svg></span><strong>Container</strong><small id="flowContainer">—</small></div><div class="connector"></div><div class="flow-node"><span class="node-icon"><svg><use href="#i-terminal"/></svg></span><strong>Node.js</strong><small id="flowNode">—</small></div></div><p class="panel-desc" style="margin-top:17px">Illustrative request route based on configured host and container values.</p></section>
<section class="panel" id="details"><div class="panel-header"><div><h2 class="panel-title">Environment & runtime</h2><p class="panel-desc">Important information about this application instance</p></div><span class="tag">Environment details</span></div><div class="details"><div class="detail"><label>Docker host IP</label><strong id="detailHost">—</strong></div><div class="detail"><label>Container name</label><strong id="detailName">—</strong></div><div class="detail"><label>Container ID / hostname</label><strong id="detailId">—</strong></div><div class="detail"><label>Host port</label><strong id="detailHostPort">—</strong></div><div class="detail"><label>Container port</label><strong id="detailContainerPort">—</strong></div><div class="detail"><label>Node.js version</label><strong id="detailNode">—</strong></div><div class="detail"><label>CPU cores available</label><strong id="detailCores">—</strong></div><div class="detail"><label>OS / architecture</label><strong id="detailOS">—</strong></div><div class="detail"><label>Container hostname</label><strong id="detailHostname">—</strong></div><div class="detail"><label>Application</label><strong id="detailApp">—</strong></div><div class="detail"><label>Version</label><strong id="detailVersion">—</strong></div><div class="detail"><label>Client IP</label><strong id="detailClient">—</strong></div></div></section>
<div class="footer"><span>Docker Studio · Lightweight Node.js Dashboard</span><span>Auto-refresh every 10 seconds · No external frontend dependencies</span></div>
</main></div>
<script id="initial" type="application/json">${safeJson}</script>
<script>
(function(){
'use strict';
const $ = (id) => document.getElementById(id);
const put = (id, text) => { $(id).textContent = String(text); };
const history = [];
function drawGraph(){
  const values = history.length ? history : [0];
  const maxY = Math.max(100, Math.ceil(Math.max(...values)/25)*25);
  const bottom = 144, top = 18, left = 30, right = 590;
  const pts = values.map((v,i) => [left + (i / Math.max(1,values.length-1))*(right-left), bottom-Math.min(v,maxY)/maxY*(bottom-top)]);
  const line = pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  $('line').setAttribute('d',line);
  $('area').setAttribute('d',line+' L'+pts[pts.length-1][0].toFixed(1)+' '+bottom+' L'+left+' '+bottom+' Z');
}
function render(d){
  const cpu = Number(d.cpuPercent)||0;
  const mem = d.memory || {};
  put('cpuMetric',cpu.toFixed(1)); put('cpuLarge',cpu.toFixed(1));
  put('memMetric',mem.usedMB ?? '—'); put('memBig',mem.usedMB ?? '—');
  put('memCaption',mem.limitMB != null ? 'Limit '+mem.limitMB+' MB' : 'No configured limit');
  put('uptimeMetric',d.uptime||'—'); put('rssMetric',d.processMemoryMB ?? '—');
  const percent = mem.percentage == null ? null : Math.max(0,Math.min(100,Number(mem.percentage)||0));
  $('memoryGauge').style.setProperty('--fill',(percent ?? 0)+'%');
  put('gaugePercent',percent === null ? 'N/A' : percent.toFixed(1)+'%');
  put('memLimit',mem.limitMB == null ? 'No memory limit configured' : 'of '+mem.limitMB+' MB configured limit');
  put('flowClient',d.clientIP); put('flowHost',d.dockerHostIP+':'+d.hostPort);
  put('flowContainer',d.containerName); put('flowNode',':'+d.containerPort);
  const fields={detailHost:d.dockerHostIP,detailName:d.containerName,detailId:d.containerId,detailHostPort:d.hostPort,detailContainerPort:d.containerPort,detailNode:d.nodeVersion,detailCores:d.cpuCores,detailOS:d.platform+' / '+d.architecture,detailHostname:d.hostname,detailApp:d.appName,detailVersion:d.appVersion,detailClient:d.clientIP};
  Object.keys(fields).forEach(key=>put(key,fields[key]));
  put('updated','Updated '+new Date(d.timestamp).toLocaleTimeString());
  history.push(cpu); if(history.length>35)history.shift(); drawGraph();
}
let busy=false;
async function refresh(){
  if(busy)return;busy=true;$('refresh').disabled=true;
  try{
    const response=await fetch('/api/status',{cache:'no-store',signal:AbortSignal.timeout(7000)});
    if(!response.ok)throw new Error('HTTP '+response.status);
    render(await response.json());$('error').classList.remove('show');
  }catch(e){$('error').classList.add('show');}
  finally{busy=false;$('refresh').disabled=false;}
}
render(JSON.parse($('initial').textContent));
$('refresh').addEventListener('click',refresh);
setInterval(refresh,10000);
})();
</script>
</body></html>`;
}

const server = http.createServer((req, res) => {
  const path = (req.url || '/').split('?')[0];
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD', 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Method not allowed');
  }
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ status: 'healthy' }));
  }
  if (path === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    return res.end(req.method === 'HEAD' ? undefined : JSON.stringify(snapshot(req)));
  }
  if (path !== '/') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(req.method === 'HEAD' ? undefined : 'Not found');
  }
  const html = renderPage(snapshot(req));
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'" });
  return res.end(req.method === 'HEAD' ? undefined : html);
});

if (require.main === module) {
  server.listen(PORT, HOST, () => console.log(APP_NAME+' running on '+HOST+':'+PORT));
}
module.exports = server;
