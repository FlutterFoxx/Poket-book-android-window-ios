const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const url = require("url");

// PoketBook Desktop — connects to cloud backend at poketbook.in
const POKETBOOK_URL = "https://poketbook.in";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "PoketBook — Digital Udhar Khaata",
    icon: path.join(__dirname, "..", "logo512.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    backgroundColor: "#0A0F1E",
    show: false,
    autoHideMenuBar: true,
  });

  // Load the cloud app
  win.loadURL(POKETBOOK_URL);

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });

  // Open external links in default browser
  win.webContents.setWindowOpenHandler(({ url: u }) => {
    if (!u.startsWith(POKETBOOK_URL)) {
      shell.openExternal(u);
      return { action: "deny" };
    }
    return { action: "allow" };
  });
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
