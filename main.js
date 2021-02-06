/* Imports */
const { app, BrowserWindow } = require('electron');
const { nativeImage } = require('electron');
const { ipcMain } = require('electron');

let window = null;

/* Create icon */
var icon = nativeImage.createFromPath(__dirname + '/images/logo-padded.png');
icon.setTemplateImage(true);

/* Load app */
app.once('ready', () => {
	window = new BrowserWindow({
		width: 800,
		height: 600,
		minWidth: 550,
		minHeight: 280,
		frame: false,
		icon: icon,
        webPreferences: {
			nodeIntegration: true,
            enableRemoteModule: true
		}
	});
	window.loadFile('index.html');
	window.once('ready-to-show', () => {
		window.show()
	});
});

/* Window resizers */
ipcMain.on('windowMinimize', (event) => {
	window.minimize();
});

ipcMain.on('windowMaximize', (event) => {
	if (window.isMaximized()) {
		window.unmaximize();
		event.reply('windowMaximized');
	}
	else {
		window.maximize();
		event.reply('windowUnmaximized');
	}
});

ipcMain.on('windowClose', (event) => {
	window.close();
});