import "./style.css";

const APP_NAME: string = "Sticker Sketchpad";
const app: HTMLDivElement = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
//app.innerHTML = APP_NAME;

// Interfaces
interface Cursor {
	active: boolean;
	x: number;
	y: number;
}

// Variables
const CANVAS_WIDTH: number = 256;
const CANVAS_HEIGHT: number = CANVAS_WIDTH;

// App Title
const appTitle: HTMLHeadingElement = document.createElement("h1");
appTitle.innerHTML = APP_NAME;
app.append(appTitle);

// Canvas
// many of the things here were copied or inspired from https://glitch.com/~quant-paint
// create variables
const canvas: HTMLCanvasElement = document.createElement("canvas");
const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d"); // ctx = "context" aka "CanvasRenderingContext2D object"
const cursor: Cursor = { active: false, x: 0, y: 0 };
const lines = []; // array of lines, where a line is an array of points
let currentLine = []; //  represents the user's current line when they're drawing; contains the points from mouse down to mouse up
const drawingChangedEvent = new Event("drawing-changed");

// set components of variables
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
if (ctx == null) throw new Error("ctx is null"); // ensure that we got something back from getContext(); brace told me to add this to remove warnings

// create canvas events (e = "event object")
canvas.addEventListener("mousedown", (e) => {
	// set cursor
	cursor.active = true;
	cursor.x = e.offsetX;
	cursor.y = e.offsetY;
	// add a line to lines
	lines.push(currentLine);
	// enter the first point into currentLine
	currentLine.push({ x: cursor.x, y: cursor.y });
	canvas.dispatchEvent(drawingChangedEvent);
});
canvas.addEventListener("mousemove", (e) => {
	if (cursor.active) {
		// push the point of where the mouse currently is now to currentLine and then redraw
		cursor.x = e.offsetX;
		cursor.y = e.offsetY;
		currentLine.push({ x: cursor.x, y: cursor.y });
		canvas.dispatchEvent(drawingChangedEvent);
	}
});
canvas.addEventListener("mouseup", (e) => {
	cursor.active = false;
	currentLine = [];
});
canvas.addEventListener("drawing-changed", (e) => {
	// this is the redraw() function from paint1.html

	// clear the canvas so we can redraw the lines
	ctx?.clearRect(0, 0, canvas.width, canvas.height);
	// redraw the lines
	for (const line of lines) {
		// if the user just clicks on the canvas, it creates a line with just one point in it
		// we don't want to draw those since a line needs two points (otherwise it won't know its direciton)
		if (line.length > 1) {
			ctx?.beginPath();
			// move to the first point
			const { x, y } = line[0];
			ctx?.moveTo(x, y);
			// connect the points to make the line
			for (const { x, y } of line) {
				ctx?.lineTo(x, y);
			}
			ctx?.stroke();
		}
	}
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
