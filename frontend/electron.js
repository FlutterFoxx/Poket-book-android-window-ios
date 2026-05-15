// v8-compile-cache: speeds up Node.js startup by caching compiled bytecode
require("v8-compile-cache");

const { app, BrowserWindow, shell, session } = require("electron");
const path = require("path");

// ── GPU & Rendering Performance Flags ───────────────────────────────────────
app.commandLine.appendSwitch("disable-features", "Translate,AutofillServerCommunication,ChromeLabs");
app.commandLine.appendSwitch("disable-background-networking");
app.commandLine.appendSwitch("disable-sync");
app.commandLine.appendSwitch("metrics-recording-only");
app.commandLine.appendSwitch("no-first-run");
app.commandLine.appendSwitch("safebrowsing-disable-auto-update");
app.commandLine.appendSwitch("js-flags", "--max-old-space-size=256");

const POKETBOOK_URL = "https://poketbook.in";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "PoketBook",
    icon: path.join(__dirname, "..", "logo512.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false,     // No throttling when window inactive
      cache: true,
      offscreen: false,
    },
    backgroundColor: "#0A0F1E",
    show: false,                        // Show only after ready-to-show
    autoHideMenuBar: true,
    frame: true,
    paintWhenInitiallyHidden: false,
  });

  // Aggressive caching: cache all resources for 7 days
  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(["notifications", "microphone"].includes(permission));
  });

  // Load the cloud app
  win.loadURL(POKETBOOK_URL);

  // Show window once first paint is done (avoids white flash)
  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });

  // Handle zoom with keyboard shortcuts
  win.webContents.on("before-input-event", (event, input) => {
    if (input.control && input.key === "=") { win.webContents.setZoomLevel(win.webContents.getZoomLevel() + 0.5); event.preventDefault(); }
    if (input.control && input.key === "-") { win.webContents.setZoomLevel(win.webContents.getZoomLevel() - 0.5); event.preventDefault(); }
    if (input.control && input.key === "0") { win.webContents.setZoomLevel(0); event.preventDefault(); }
    if (input.key === "F5") { win.webContents.reload(); event.preventDefault(); }
  });

  // External links open in browser (WhatsApp, Google OAuth, etc.)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(POKETBOOK_URL)) { shell.openExternal(url); return { action: "deny" }; }
    return { action: "allow" };
  });
}

app.whenReady().then(() => {
  // Pre-warm DNS lookup for faster first load
  app.whenReady().then(() => { require("dns").resolve("poketbook.in", () => {}); });
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
