import os from 'os';
import { spawn } from 'child_process';

function getNetworkAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({ name, address: net.address });
      }
    }
  }
  return addresses;
}

const networkAddresses = getNetworkAddresses();
const wifiOrLan = networkAddresses.find(
  (n) => n.name.toLowerCase().includes('wi-fi') || n.name.toLowerCase().includes('wireless')
) || networkAddresses[0];

console.log('');
console.log('================================================================');
console.log('       ⛰️  TRACE OUTDOOR - SERVEUR LOCAL DE TEST (HORS-LIGNE)     ');
console.log('================================================================');
console.log('');
console.log('  Mode local activé (contourne tout firewall ou blocage réseau)');
console.log('');
console.log('  💻  Sur votre ordinateur :');
console.log('      👉  http://localhost:3000/');
console.log('      👉  http://127.0.0.1:3000/');
console.log('');
if (wifiOrLan) {
  console.log('  📱  Sur votre iPhone ou smartphone (connecté au même Wi-Fi) :');
  console.log(`      👉  http://${wifiOrLan.address}:3000/`);
  console.log('');
}
console.log('  💡  Conseils de test :');
console.log('      - Les modifications de code sont appliquées instantanément (Hot Reload).');
console.log('      - Pour tester la version compilée (PWA Service Worker offline) :');
console.log('        npm run preview');
console.log('');
console.log('  Appuyez sur Ctrl+C dans ce terminal pour arrêter le serveur.');
console.log('================================================================');
console.log('');

// Launch Vite directly
const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const child = spawn(npxCmd, ['vite', '--port', '3000', '--host', '0.0.0.0', '--open'], {
  stdio: 'inherit',
  shell: true,
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
