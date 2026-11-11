const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

function isPortActive(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/dashboard/stats`, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(600, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function main() {
  console.log('\x1b[36m%s\x1b[0m', '=========================================================');
  console.log('\x1b[32m%s\x1b[0m', ' 🏥 THIRUMURUGAN MEDICALS PHARMACY ERP - DEVELOPMENT');
  console.log('\x1b[36m%s\x1b[0m', '=========================================================');

  // 1. Ensure Python Backend (port 8080) is running
  const isBackendUp = await isPortActive(8080);
  let backendProcess = null;

  if (!isBackendUp) {
    console.log('\x1b[33m%s\x1b[0m', '⚡ Launching Backend API on http://localhost:8080 ...');
    backendProcess = spawn('python', ['backend-server.py'], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true,
    });
    backendProcess.on('error', (err) => {
      console.error('Failed to spawn Python backend:', err.message);
    });
  } else {
    console.log('\x1b[32m%s\x1b[0m', '✓ Backend Server is already active on http://localhost:8080');
  }

  // 2. Launch Vite Frontend (port 5173)
  console.log('\x1b[35m%s\x1b[0m', '🌐 Launching Vite Frontend on http://localhost:5173 ...');
  const frontendDir = path.join(__dirname, 'frontend');
  const frontendProcess = spawn('npm', ['run', 'dev', '--', '--host', '0.0.0.0', '--port', '5173', '--open'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true,
  });

  const cleanup = () => {
    console.log('\nShutting down services...');
    if (backendProcess) {
      try {
        backendProcess.kill();
      } catch (e) {}
    }
    if (frontendProcess) {
      try {
        frontendProcess.kill();
      } catch (e) {}
    }
    process.exit();
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main();
