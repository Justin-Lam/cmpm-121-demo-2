import "./style.css";

const APP_NAME: string = "Sticker Sketchpad";
const app: HTMLDivElement = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
//app.innerHTML = APP_NAME;


// Variables
const CANVAS_WIDTH = 256;
const CANVAS_HEIGHT = CANVAS_WIDTH;

// App Title
const appTitle: HTMLHeadingElement = document.createElement("h1");
appTitle.innerHTML = APP_NAME;
app.append(appTitle);

// Canvas
const canvas: HTMLCanvasElement = document.createElement("canvas");
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT
app.append(canvas);