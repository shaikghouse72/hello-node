const http = require('node:http');
const os = require('node:os');

const hostname = '0.0.0.0';
const port = 3000;

const podName = process.env.POD_NAME || 'Unknown';
const podNamespace = process.env.POD_NAMESPACE || 'Unknown';
const podIP = process.env.POD_IP || 'Unknown';
const nodeName = process.env.NODE_NAME || 'Unknown';

const startTime = Date.now();

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getMemory() {
  const used = process.memoryUsage().rss;
  const usedMB = Math.round(used / 1024 / 1024);

  return usedMB;
}

const server = http.createServer((req, res) => {

  const uptime = formatUptime(process.uptime());
  const memory = getMemory();
  const cpuCores = os.cpus().length;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  res.end(`
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<meta http-equiv="refresh" content="10">

<title>Kubernetes Node.js Dashboard</title>

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

  padding: 22px 6%;

  display: flex;

  justify-content: space-between;

  align-items: center;

  box-shadow:
    0 5px 25px rgba(15,23,42,0.18);
}

.brand {

  display: flex;

  align-items: center;

  gap: 15px;
}

.logo {

  width: 52px;

  height: 52px;

  border-radius: 15px;

  display: flex;

  align-items: center;

  justify-content: center;

  background:
    rgba(255,255,255,0.12);

  font-size: 28px;
}

.brand h1 {

  font-size: 23px;

}

.brand p {

  color: #bfdbfe;

  font-size: 13px;

  margin-top: 4px;
}

.status {

  display: flex;

  align-items: center;

  gap: 8px;

  padding: 9px 17px;

  border-radius: 30px;

  background:
    rgba(34,197,94,0.15);

  border:
    1px solid rgba(134,239,172,0.3);

  color: #bbf7d0;

  font-weight: 600;

  font-size: 13px;
}

.status-dot {

  width: 9px;

  height: 9px;

  border-radius: 50%;

  background: #22c55e;

  box-shadow:
    0 0 10px #22c55e;
}


/* HERO */

.hero {

  background:

    radial-gradient(
      circle at 20% 30%,
      rgba(59,130,246,0.4),
      transparent 35%
    ),

    radial-gradient(
      circle at 80% 70%,
      rgba(99,102,241,0.4),
      transparent 35%
    ),

    linear-gradient(
      135deg,
      #172554,
      #1d4ed8,
      #3730a3
    );

  color: white;

  text-align: center;

  padding: 55px 20px;
}

.hero h2 {

  font-size:
    clamp(34px, 5vw, 56px);

  margin-bottom: 14px;
}

.hero h2 span {

  color: #bfdbfe;
}

.hero p {

  color: #dbeafe;

  font-size: 17px;

  margin-bottom: 24px;
}

.hero-status {

  display: inline-flex;

  align-items: center;

  gap: 8px;

  padding: 10px 20px;

  border-radius: 30px;

  background:
    rgba(34,197,94,0.18);

  color: #bbf7d0;

  font-weight: 600;
}


/* MAIN */

.container {

  max-width: 1200px;

  margin:
    -30px auto 40px;

  padding:
    0 20px;

  position: relative;
}


/* KUBERNETES FLOW */

.flow {

  background: white;

  border-radius: 20px;

  padding: 28px;

  box-shadow:
    0 10px 35px rgba(15,23,42,0.08);

  margin-bottom: 25px;
}

.flow-title {

  font-size: 18px;

  font-weight: 700;

  margin-bottom: 22px;

  text-align: center;
}

.flow-container {

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 10px;

  flex-wrap: wrap;
}

.flow-box {

  min-width: 145px;

  padding: 18px;

  text-align: center;

  border-radius: 14px;

  background: #eff6ff;

  border: 1px solid #dbeafe;
}

.flow-box .icon {

  font-size: 25px;

  margin-bottom: 7px;
}

.flow-box strong {

  display: block;

  color: #1e3a8a;

  font-size: 14px;
}

.flow-box small {

  color: #64748b;

  font-size: 11px;
}

.arrow {

  font-size: 24px;

  color: #6366f1;

  font-weight: bold;
}


/* CARDS */

.cards {

  display: grid;

  grid-template-columns:
    repeat(auto-fit, minmax(240px, 1fr));

  gap: 20px;
}

.card {

  background: white;

  border-radius: 18px;

  padding: 24px;

  box-shadow:
    0 8px 25px rgba(15,23,42,0.06);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.card:hover {

  transform:
    translateY(-4px);

  box-shadow:
    0 14px 35px rgba(15,23,42,0.12);
}

.card-header {

  display: flex;

  align-items: center;

  gap: 13px;

  margin-bottom: 18px;
}

.card-icon {

  width: 45px;

  height: 45px;

  border-radius: 13px;

  background: #eef2ff;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 21px;
}

.card-title {

  color: #64748b;

  font-size: 11px;

  text-transform: uppercase;

  letter-spacing: 1px;
}

.card-value {

  font-size: 20px;

  font-weight: 700;

  color: #172033;

  word-break: break-word;
}

.card-description {

  margin-top: 6px;

  color: #94a3b8;

  font-size: 12px;
}


/* FOOTER */

.footer {

  max-width: 1200px;

  margin: 25px auto;

  padding: 28px;

  background: #0f172a;

  color: #94a3b8;

  text-align: center;

  border-radius: 18px;
}

.footer strong {

  color: white;

  font-size: 16px;
}

.footer p {

  margin-top: 8px;

  color: #60a5fa;

  font-size: 13px;
}


/* MOBILE */

@media (max-width: 700px) {

  .header {

    padding:
      18px 20px;
  }

  .status {

    display: none;
  }

  .hero {

    padding:
      45px 20px;
  }

  .arrow {

    transform:
      rotate(90deg);
  }

}

</style>

</head>


<body>


<header class="header">

  <div class="brand">

    <div class="logo">
      ☸️
    </div>

    <div>

      <h1>
        Kubernetes Dashboard
      </h1>

      <p>
        Node.js Application Monitoring
      </p>

    </div>

  </div>


  <div class="status">

    <span class="status-dot"></span>

    POD ONLINE

  </div>

</header>


<section class="hero">

  <h2>
    Hello from <span>Kubernetes!</span> 🚀
  </h2>

  <p>
    Your Node.js application is running inside a Kubernetes Pod.
  </p>

  <div class="hero-status">

    <span class="status-dot"></span>

    APPLICATION RUNNING

  </div>

</section>


<main class="container">


<section class="flow">

  <div class="flow-title">
    ☸️ Kubernetes Traffic Flow
  </div>

  <div class="flow-container">

    <div class="flow-box">

      <div class="icon">🌐</div>

      <strong>Browser</strong>

      <small>192.168.0.69</small>

    </div>

    <div class="arrow">→</div>

    <div class="flow-box">

      <div class="icon">🔌</div>

      <strong>NodePort</strong>

      <small>:30080</small>

    </div>

    <div class="arrow">→</div>

    <div class="flow-box">

      <div class="icon">⚙️</div>

      <strong>Service</strong>

      <small>hello-node-service</small>

    </div>

    <div class="arrow">→</div>

    <div class="flow-box">

      <div class="icon">📦</div>

      <strong>Pod</strong>

      <small>${podName}</small>

    </div>

    <div class="arrow">→</div>

    <div class="flow-box">

      <div class="icon">🟢</div>

      <strong>Node.js</strong>

      <small>:3000</small>

    </div>

  </div>

</section>


<section class="cards">


<div class="card">

  <div class="card-header">

    <div class="card-icon">
      📦
    </div>

    <div class="card-title">
      Pod Name
    </div>

  </div>

  <div class="card-value">
    ${podName}
  </div>

  <div class="card-description">
    Kubernetes workload
  </div>

</div>


<div class="card">

  <div class="card-header">

    <div class="card-icon">
      🖥️
    </div>

    <div class="card-title">
      Kubernetes Node
    </div>

  </div>

  <div class="card-value">
    ${nodeName}
  </div>

  <div class="card-description">
    Pod is currently running here
  </div>

</div>


<div class="card">

  <div class="card-header">

    <div class="card-icon">
      🌐
    </div>

    <div class="card-title">
      Pod IP
    </div>

  </div>

  <div class="card-value">
    ${podIP}
  </div>

  <div class="card-description">
    Internal Kubernetes network
  </div>

</div>


<div class="card">

  <div class="card-header">

    <div class="card-icon">
      🗂️
    </div>

    <div class="card-title">
      Namespace
    </div>

  </div>

  <div class="card-value">
    ${podNamespace}
  </div>

  <div class="card-description">
    Kubernetes namespace
  </div>

</div>


<div class="card">

  <div class="card-header">

    <div class="card-icon">
      🟢
    </div>

    <div class="card-title">
      Application
    </div>

  </div>

  <div class="card-value">
    Node.js
  </div>

  <div class="card-description">
    Version ${process.version}
  </div>

</div>


<div class="card">

  <div class="card-header">

    <div class="card-icon">
      🔌
    </div>

    <div class="card-title">
      Container Port
    </div>

  </div>

  <div class="card-value">
    3000
  </div>

  <div class="card-description">
    Node.js HTTP server
  </div>

</div>


<div class="card">

  <div class="card-header">

    <div class="card-icon">
      🧠
    </div>

    <div class="card-title">
      Container Memory
    </div>

  </div>

  <div class="card-value">
    ${memory} MB
  </div>

  <div class="card-description">
    Current Node.js process
  </div>

</div>


<div class="card">

  <div class="card-header">

    <div class="card-icon">
      ⏱️
    </div>

    <div class="card-title">
      Pod Uptime
    </div>

  </div>

  <div class="card-value">
    ${uptime}
  </div>

  <div class="card-description">
    Node.js process uptime
  </div>

</div>


<div class="card">

  <div class="card-header">

    <div class="card-icon">
      ⚡
    </div>

    <div class="card-title">
      CPU Cores
    </div>

  </div>

  <div class="card-value">
    ${cpuCores}
  </div>

  <div class="card-description">
    Available to container
  </div>

</div>


<div class="card">

  <div class="card-header">

    <div class="card-icon">
      🐧
    </div>

    <div class="card-title">
      Platform
    </div>

  </div>

  <div class="card-value">
    ${os.platform()}
  </div>

  <div class="card-description">
    ${os.arch()}
  </div>

</div>


</section>

</main>


<footer class="footer">

  <strong>
    ☸️ Kubernetes + Node.js
  </strong>

  <p>
    Pod: ${podName}
    • Node: ${nodeName}
    • Port: 3000
  </p>

</footer>


</body>

</html>
  `);
});


server.listen(port, hostname, () => {

  console.log(
    `Kubernetes Node.js application running on port ${port}`
  );

});
