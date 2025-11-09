import { Service } from 'node-windows';
import path from 'path';

// Create a new service object
const svc = new Service({
  name: 'Espandar Report Hub Backend',
  description: 'The backend Node.js server for the Espandar Report Hub.',
  // The script to run
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', () => {
  console.log('Service installed successfully!');
  console.log('Starting service...');
  svc.start();
  console.log('Service started.');
});

// Listen for the "alreadyinstalled" event
svc.on('alreadyinstalled', () => {
  console.log('This service is already installed.');
});

// Listen for the "uninstall" event.
svc.on('uninstall', () => {
  console.log('Service uninstalled successfully.');
  console.log('The service exists: ', svc.exists);
});

// Check if the service is already installed
if (svc.exists) {
  console.log('Service already exists. Uninstalling first...');
  // Uninstall the service.
  svc.uninstall();
} else {
  // Install the service.
  console.log('Installing service...');
  svc.install();
}
