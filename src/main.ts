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
let displayLines: Point[][] = []; // lines that should be on the screen; an array of lines, where a line is an array of points
let redoLines: Point[][] = [];	// lines that have been undone
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
	// add a line to displayLines
	displayLines.push(currentLine);
	// enter the first point into currentLine
	currentLine.push({ x: cursor.pos.x, y: cursor.pos.y });
	canvas.dispatchEvent(drawingChangedEvent);
	// clear redoLines
	redoLines = [];
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
	for (const line of displayLines) {
		// if the user just clicks on the canvas, it creates a line with just one point in it
		// we don't want to draw those since a line needs two points (otherwise it won't know its direciton)
		if (line.length > 1) {
			ctx.beginPath();
			// move to the first point
			const { x, y } = line[0];
            ctx.moveTo(x, y);
			// connect the points to make the line
			for (const { x, y } of line) {
				ctx.lineTo(x, y);
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
	displayLines = [];
	canvas.dispatchEvent(drawingChangedEvent);
});
app.append(clearButton);

// Undo Button
const undoButton: HTMLButtonElement = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", () => {
	if (displayLines.length > 0) {
		const lastLine: Point[] | undefined = displayLines.pop();
		if (lastLine != undefined) {
			// it should never be the case that lastLine is undefined, I just have this here to make a warning go away
			redoLines.push(lastLine);
			canvas.dispatchEvent(drawingChangedEvent);
  		}
	}
})
app.append(undoButton);

// Redo Button
const redoButton: HTMLButtonElement = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", () => {
	if (redoLines.length > 0) {
		const lastRedoLine: Point[] | undefined = redoLines.pop();
		if (lastRedoLine != undefined) {
			// it should never be the case that lastRedoLine is undefined, I just have this here to make a warning go away
			displayLines.push(lastRedoLine);
			canvas.dispatchEvent(drawingChangedEvent);
		}
	}
})
app.append(redoButton);