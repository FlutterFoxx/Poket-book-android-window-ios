const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

// PoketBook Desktop App — connects to cloud backend at poketbook.in
const POKETBOOK_URL = "https://poketbook.in";

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "PoketBook — Digital Udhar Khaata",
    icon: path.join(__dirname, "public", "logo512.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: true,
    },
    backgroundColor: "#0A0F1E",
    show: false, // Show after load to avoid flash
    autoHideMenuBar: true, // Cleaner look
  });

  // Load the cloud app
  mainWindow.loadURL(POKETBOOK_URL);

  // Show window once ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in default browser (WhatsApp, Google OAuth, etc.)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(POKETBOOK_URL) && !url.startsWith("https://party-tally-1.preview")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
