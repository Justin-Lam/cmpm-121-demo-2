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

// Canvas, Context, Cursor
const canvas: HTMLCanvasElement = document.createElement("canvas");
const ctx = canvas.getContext("2d");		// ctx = "context" aka "CanvasRenderingContext2D object"
if (!ctx) { throw new Error("Failed to get 2D context"); }		// ensure that we got something back from getContext(); brace told me to add this to remove warnings
const cursor = { active: false, x: 0, y: 0 };
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
// these events were copied from https://glitch.com/~quant-paint
canvas.addEventListener("mousedown", (e) => {
	// e = "event object"
	cursor.active = true;
	cursor.x = e.offsetX;
	cursor.y = e.offsetY;
});
canvas.addEventListener("mousemove", (e) => {
	// e = "event object"
	if (cursor.active) {
		ctx.beginPath();
		ctx.moveTo(cursor.x, cursor.y);
		ctx.lineTo(e.offsetX, e.offsetY);
		ctx.stroke();
		cursor.x = e.offsetX;
		cursor.y = e.offsetY;
	}
});
canvas.addEventListener("mouseup", (e) => {
	cursor.active = false;
});
app.append(canvas);

// Clear Button
const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
	// this was copied from https://glitch.com/~quant-paint
	ctx.clearRect(0, 0, canvas.width, canvas.height);
});
app.append(clearButton);