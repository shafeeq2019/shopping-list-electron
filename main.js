const electron = require("electron");
const path = require("path");
const url = require("url");

const { app, BrowserWindow, Menu, ipcMain } = electron;

require("electron-reload")(__dirname, {
  electron: path.join(__dirname, "node_modules", ".bin", "electron"),
});

if (app.isPackaged) {
  process.env.NODE_ENV = "production";
}

if (process.argv[2] && !app.isPackaged) {
  process.env.NODE_ENV = process.argv[2];
}

const config = require("electron-node-config");

if (config.has("dbConfig")) {
  let dbConfig = config.get("dbConfig");
  //...
}

let mainWindow;
let addWindow;

//listen for app to be ready
app.on("ready", function () {
  // create new window
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
    },
  });
  //load html into window
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "mainWindow.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  //Quit app when closed
  mainWindow.on("closed", function () {
    app.quit();
  });

  // Build menu from template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("item:test", config);
  });
});

//Catch item:add
ipcMain.on("item:add", function (e, item) {
  mainWindow.webContents.send("item:add", item);
  addWindow.close();
});

//Create menu template:
// Template in Elecctor is just an array of objects
const mainMenuTemplate = [
  {
    label: "File",
    submenu: [
      {
        label: "Add Item",
        click() {
          createAddWindow();
        },
      },
      {
        label: "Clear Items",
        click() {
          mainWindow.webContents.send("item:clear");
        },
      },
      {
        label: "Quit",
        accelerator: process.platform == "darwin" ? "Command+Q" : "Ctrl+Q",
        click() {
          app.quit();
        },
      },
    ],
  },
];

function createAddWindow() {
  addWindow = new BrowserWindow({
    width: 300,
    height: 200,
    title: "Add shopping item",
    webPreferences: {
      nodeIntegration: true,
    },
  });
  //load html into window
  addWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, "addWindow.html"),
      protocol: "file:",
      slashes: true,
    })
  );

  //Garbage collection handle:
  addWindow.on("close", function () {
    addWindow = null;
  });
}

// Add develop tools item if not in prod
if (process.env.NODE_ENV !== "production") {
  mainMenuTemplate.push({
    label: "Developer Tools",
    submenu: [
      {
        label: "Toggle DevTools",
        accelerator: process.platform == "darwin" ? "Command+I" : "Ctrl+I",
        click(item, focusedWindow) {
          focusedWindow.toggleDevTools();
        },
      },
      {
        role: "reload",
      },
    ],
  });
}
