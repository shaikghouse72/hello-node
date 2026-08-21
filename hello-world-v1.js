const http = require('node:http');
const os = require('node:os');

const hostname = '0.0.0.0';
const port = 3000;

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  seconds %= 86400;

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getMemoryUsage() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  return {
    usedMB: Math.round(used / 1024 / 1024),
    totalMB: Math.round(total / 1024 / 1024),
    percentage: Math.round((used / total) * 100)
  };
}

const server = http.createServer((req, res) => {
  const memory = getMemoryUsage();
  const uptime = formatUptime(os.uptime());
  const cpuCount = os.cpus().length;

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

  <title>VM 69 • Node.js Dashboard</title>

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

      background: #f5f7fb;
      color: #172033;
      min-height: 100vh;
    }

    /* ================= HEADER ================= */

    .header {
      background:
        linear-gradient(
          135deg,
          #111827,
          #1e1b4b,
          #312e81
        );

      color: white;
      padding: 22px 6%;

      display: flex;
      justify-content: space-between;
      align-items: center;

      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-icon {
      width: 48px;
      height: 48px;

      display: flex;
      align-items: center;
      justify-content: center;

      border-radius: 14px;

      background: rgba(255,255,255,0.12);

      font-size: 26px;
    }

    .brand h1 {
      font-size: 24px;
      font-weight: 700;
    }

    .brand p {
      color: #c7d2fe;
      margin-top: 4px;
      font-size: 13px;
    }

    .online {
      display: flex;
      align-items: center;
      gap: 8px;

      padding: 9px 16px;

      border-radius: 30px;

      background: rgba(34,197,94,0.15);
      border: 1px solid rgba(34,197,94,0.35);

      color: #86efac;

      font-size: 13px;
      font-weight: 600;
    }

    .online-dot {
      width: 9px;
      height: 9px;

      border-radius: 50%;

      background: #22c55e;

      box-shadow: 0 0 10px #22c55e;
    }

    /* ================= HERO ================= */

    .hero {
      background:
        radial-gradient(
          circle at 20% 50%,
          rgba(99,102,241,0.35),
          transparent 35%
        ),
        radial-gradient(
          circle at 80% 30%,
          rgba(168,85,247,0.35),
          transparent 35%
        ),
        linear-gradient(
          135deg,
          #172554,
          #312e81,
          #4c1d95
        );

      color: white;

      text-align: center;

      padding: 55px 20px;
    }

    .hero h2 {
      font-size: clamp(34px, 5vw, 58px);
      margin-bottom: 15px;
    }

    .hero h2 span {
      color: #c4b5fd;
    }

    .hero p {
      color: #ddd6fe;
      font-size: 17px;
      margin-bottom: 25px;
    }

    .hero-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;

      padding: 10px 20px;

      border-radius: 30px;

      background: rgba(34,197,94,0.18);
      border: 1px solid rgba(134,239,172,0.3);

      color: #bbf7d0;

      font-weight: 600;
    }

    /* ================= MAIN ================= */

    .container {
      max-width: 1200px;
      margin: -30px auto 40px;

      padding: 0 20px;

      position: relative;
    }

    /* ================= SUMMARY ================= */

    .summary {
      background: white;

      border-radius: 20px;

      padding: 30px;

      display: flex;
      justify-content: space-between;
      align-items: center;

      box-shadow:
        0 10px 35px rgba(15,23,42,0.08);

      margin-bottom: 25px;
    }

    .summary-left {
      display: flex;
      align-items: center;
      gap: 18px;
    }

    .summary-icon {
      width: 60px;
      height: 60px;

      border-radius: 18px;

      background: #ede9fe;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 28px;
    }

    .summary h3 {
      font-size: 20px;
      margin-bottom: 6px;
    }

    .summary p {
      color: #64748b;
    }

    .uptime-box {
      padding-left: 40px;

      border-left: 1px solid #e2e8f0;
    }

    .uptime-box small {
      display: block;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }

    .uptime-box strong {
      font-size: 22px;
      color: #4f46e5;
    }

    /* ================= CARDS ================= */

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
      transform: translateY(-4px);

      box-shadow:
        0 14px 35px rgba(15,23,42,0.12);
    }

    .card-top {
      display: flex;
      align-items: center;
      gap: 14px;

      margin-bottom: 20px;
    }

    .card-icon {
      width: 46px;
      height: 46px;

      border-radius: 13px;

      display: flex;
      align-items: center;
      justify-content: center;

      font-size: 21px;

      background: #eef2ff;
    }

    .card h4 {
      color: #64748b;

      font-size: 12px;

      text-transform: uppercase;

      letter-spacing: 1px;
    }

    .card-value {
      font-size: 24px;

      font-weight: 700;

      color: #172033;
    }

    .card-description {
      color: #94a3b8;

      font-size: 13px;

      margin-top: 5px;
    }

    /* ================= PROGRESS ================= */

    .progress {
      height: 7px;

      background: #e2e8f0;

      border-radius: 20px;

      margin-top: 15px;

      overflow: hidden;
    }

    .progress-bar {
      height: 100%;

      width: ${memory.percentage}%;

      background:
        linear-gradient(
          90deg,
          #6366f1,
          #8b5cf6
        );

      border-radius: 20px;
    }

    /* ================= FOOTER ================= */

    .footer {
      max-width: 1200px;

      margin: 25px auto;

      padding: 28px;

      border-radius: 18px;

      background: #172033;

      color: #94a3b8;

      text-align: center;
    }

    .footer strong {
      color: white;
    }

    .footer .tech {
      margin-top: 8px;

      color: #818cf8;
    }

    /* ================= MOBILE ================= */

    @media (max-width: 700px) {

      .header {
        padding: 18px 20px;
      }

      .online {
        display: none;
      }

      .summary {
        flex-direction: column;

        align-items: flex-start;

        gap: 25px;
      }

      .uptime-box {
        border-left: none;

        border-top: 1px solid #e2e8f0;

        padding-left: 0;

        padding-top: 20px;

        width: 100%;
      }

      .hero {
        padding: 45px 20px;
      }

    }

  </style>

</head>

<body>

  <!-- HEADER -->

  <header class="header">

    <div class="brand">

      <div class="brand-icon">
        🟢
      </div>

      <div>
        <h1>Node.js Dashboard</h1>

        <p>Server Monitoring</p>
      </div>

    </div>

    <div class="online">

      <span class="online-dot"></span>

      SERVER ONLINE

    </div>

  </header>


  <!-- HERO -->

  <section class="hero">

    <h2>
      Hello from <span>VM 69!</span> 🚀
    </h2>

    <p>
      Your Node.js application is up and running smoothly.
    </p>

    <div class="hero-status">

      <span class="online-dot"></span>

      SERVER ONLINE

    </div>

  </section>


  <!-- CONTENT -->

  <main class="container">


    <!-- SUMMARY -->

    <section class="summary">

      <div class="summary-left">

        <div class="summary-icon">
          🖥️
        </div>

        <div>

          <h3>Node.js Server Status</h3>

          <p>
            Running on Ubuntu 22.04
            • Managed by PM2
          </p>

        </div>

      </div>


      <div class="uptime-box">

        <small>Server Uptime</small>

        <strong>${uptime}</strong>

      </div>

    </section>


    <!-- CARDS -->

    <section class="cards">


      <div class="card">

        <div class="card-top">

          <div class="card-icon">
            🖥️
          </div>

          <h4>Server</h4>

        </div>

        <div class="card-value">
          VM 69
        </div>

        <div class="card-description">
          Local Machine
        </div>

      </div>


      <div class="card">

        <div class="card-top">

          <div class="card-icon">
            🟢
          </div>

          <h4>Application</h4>

        </div>

        <div class="card-value">
          Node.js
        </div>

        <div class="card-description">
          JavaScript Runtime
        </div>

      </div>


      <div class="card">

        <div class="card-top">

          <div class="card-icon">
            ⚙️
          </div>

          <h4>Process Manager</h4>

        </div>

        <div class="card-value">
          PM2
        </div>

        <div class="card-description">
          Application Process Manager
        </div>

      </div>


      <div class="card">

        <div class="card-top">

          <div class="card-icon">
            🔌
          </div>

          <h4>Application Port</h4>

        </div>

        <div class="card-value">
          3000
        </div>

        <div class="card-description">
          HTTP Server Port
        </div>

      </div>


      <div class="card">

        <div class="card-top">

          <div class="card-icon">
            ⚡
          </div>

          <h4>CPU Cores</h4>

        </div>

        <div class="card-value">
          ${cpuCount}
        </div>

        <div class="card-description">
          Available CPU Cores
        </div>

      </div>


      <div class="card">

        <div class="card-top">

          <div class="card-icon">
            🧠
          </div>

          <h4>Memory Usage</h4>

        </div>

        <div class="card-value">
          ${memory.usedMB} MB
        </div>

        <div class="card-description">
          ${memory.percentage}% of ${memory.totalMB} MB
        </div>

        <div class="progress">

          <div class="progress-bar"></div>

        </div>

      </div>


      <div class="card">

        <div class="card-top">

          <div class="card-icon">
            ⏱️
          </div>

          <h4>Server Uptime</h4>

        </div>

        <div class="card-value">
          ${uptime}
        </div>

        <div class="card-description">
          Operating system uptime
        </div>

      </div>


      <div class="card">

        <div class="card-top">

          <div class="card-icon">
            🐧
          </div>

          <h4>Operating System</h4>

        </div>

        <div class="card-value">
          Ubuntu 22.04
        </div>

        <div class="card-description">
          Jammy Jellyfish
        </div>

      </div>


    </section>

  </main>


  <!-- FOOTER -->

  <footer class="footer">

    <strong>🚀 Node.js Server Dashboard</strong>

    <div class="tech">

      Node.js • Ubuntu 22.04 • VM 69 • Managed by PM2

    </div>

  </footer>

</body>

</html>
  `);
});


server.listen(port, hostname, () => {

  console.log(
    `Node.js server running at http://${hostname}:${port}`
  );

});
