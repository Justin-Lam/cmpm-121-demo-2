import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
//app.innerHTML = APP_NAME;


const appTitle = document.createElement("h1");
appTitle.innerHTML = APP_NAME;
app.append(appTitle);