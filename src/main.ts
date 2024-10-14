// note: many of the things here were copied or inspired from https://glitch.com/~quant-paint
import "./style.css";

const APP_NAME: string = "Sticker Sketchpad";
const app: HTMLDivElement = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
//app.innerHTML = APP_NAME;

// Interfaces
interface Point {
	x: number,
	y: number
}
interface Cursor {
	active: boolean;
	pos: Point	// "position"
}

// Variables
const CANVAS_WIDTH: number = 256;
const CANVAS_HEIGHT: number = CANVAS_WIDTH;

// App Title
const appTitle: HTMLHeadingElement = document.createElement("h1");
appTitle.innerHTML = APP_NAME;
app.append(appTitle);

// Canvas
// create variables
const canvas: HTMLCanvasElement = document.createElement("canvas");
const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d"); // ctx = "context" aka "CanvasRenderingContext2D object"
const cursor: Cursor = { active: false, pos: {x: 0, y: 0} };
let lines: Point[][] = []; // array of lines, where a line is an array of points
let currentLine: Point[] = []; //  represents the user's current line when they're drawing; contains the points from mouse down to mouse up
const drawingChangedEvent: Event = new Event("drawing-changed");

// set components of variables
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
if (ctx == null) throw new Error("ctx is null"); // ensure that we got something back from getContext(); brace told me to add this to remove warnings

// create canvas events (e = "event object")
canvas.addEventListener("mousedown", (e) => {
	// set cursor
	cursor.active = true;
	cursor.pos.x = e.offsetX;
	cursor.pos.y = e.offsetY;
	// add a line to lines
	lines.push(currentLine);
	// enter the first point into currentLine
	currentLine.push({ x: cursor.pos.x, y: cursor.pos.y });
	canvas.dispatchEvent(drawingChangedEvent);
});
canvas.addEventListener("mousemove", (e) => {
	if (cursor.active) {
		// push the point of where the mouse currently is now to currentLine and then redraw
		cursor.pos.x = e.offsetX;
		cursor.pos.y = e.offsetY;
		currentLine.push({ x: cursor.pos.x, y: cursor.pos.y });
		canvas.dispatchEvent(drawingChangedEvent);
	}
});
canvas.addEventListener("mouseup", () => {
	cursor.active = false;
	currentLine = [];
});
canvas.addEventListener("drawing-changed", () => {
	// clear the canvas so we can redraw the lines
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// redraw the lines
	for (const line of lines) {
		// if the user just clicks on the canvas, it creates a line with just one point in it
		// we don't want to draw those since a line needs two points (otherwise it won't know its direciton)
		if (line.length > 1) {
			ctx.beginPath();
			// move to the first point
			const point: Point = line[0];
			ctx.moveTo(point.x, point.y);
			// connect the points to make the line
			for (const point of line) {
				ctx.lineTo(point.x, point.y);
			}
			ctx.stroke();
		}
	}
});
app.append(canvas);

// Clear Button
const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
	lines = [];
	canvas.dispatchEvent(drawingChangedEvent);
});
app.append(clearButton);

// Undo Button
const undoButton: HTMLButtonElement = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", () => {
	if (lines.length > 0) {
		lines.pop();
		canvas.dispatchEvent(drawingChangedEvent);
	}
})
app.append(undoButton);