// note: many of the things here were copied or inspired from https://glitch.com/~quant-paint
import "./style.css";

const APP_NAME: string = "Sticker Sketchpad";
const app: HTMLDivElement = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
//app.innerHTML = APP_NAME;

// Variables
const CANVAS_WIDTH: number = 256;
const CANVAS_HEIGHT: number = CANVAS_WIDTH;	// square canvas
const THIN = 1;	// line width
const THICK = 4;	// line width
let lineWidth = THIN;	// thin selected by default

// Interfaces
interface Point { // a Line would be an array of points: Point[]
	x: number;
	y: number;
}
interface Cursor {
	active: boolean;
	pos: Point; // "position"
}

// Commands
// with the recent "Functions are the Ultimate Commands" annoucement in Canvas, I'm unclear whether we're supposed to implement these line commands
// using classes like in paint2.html or using functional programming like in Functions are the Ultimate Commands (TS Playground)
// I'm choosing to go with functional programming because it seems to me like the "JavaScript/TypeScript" way of completing this task
type LineCommand = (ctx: CanvasRenderingContext2D) => void; // a LineCommand is a function that takes in a ctx and does stuff but doesn't return anything
function makeLineCommand(line: Point[], width: number): LineCommand {	// an makeLineCommand is a function that takes in and thus contains a line; it uses that line to return a complete LineCommand
	return (ctx: CanvasRenderingContext2D) => {
		// we can be sure line is a real line that contains 2+ points because the canvas's mouseup event handles that
		// set line width
		ctx.lineWidth = width;
		// start a new line
		ctx.beginPath();
		// move to the first point
		const { x, y } = line[0];
		ctx.moveTo(x, y);
		// loop through the points, connecting them to make the line
		for (const { x, y } of line) {
			ctx.lineTo(x, y);
		}
		// show the line
		ctx.stroke();
	}
}

// App Title
const appTitle: HTMLHeadingElement = document.createElement("h1");
appTitle.innerHTML = APP_NAME;
app.append(appTitle);

// Canvas
// create variables
const canvas: HTMLCanvasElement = document.createElement("canvas");
const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d"); // ctx = "context" aka "CanvasRenderingContext2D object"
if (ctx == null) throw new Error("ctx is null"); // ensure that we got something back from getContext(); brace told me to add this to remove warnings
const cursor: Cursor = { active: false, pos: { x: 0, y: 0 } };
let displayLines: LineCommand[] = []; // lines that should be displayed
let redoLines: LineCommand[] = []; // lines that have been undone
let currentLine: Point[] = []; //  represents the user's current line when they're drawing; contains the points from mouse down to mouse up
const drawingChangedEvent: Event = new Event("drawing-changed");
const toolMovedEvent: Event = new Event("tool-moved");

// set canvas dimensions
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// create cursor canvas events (e = "event object")
canvas.addEventListener("tool-moved", (e) => {
	console.log("hi");
});

// create drawing canvas events (e = "event object")
canvas.addEventListener("mousedown", (e) => {
	// set cursor
	cursor.active = true;
	cursor.pos.x = e.offsetX;
	cursor.pos.y = e.offsetY;
	// enter the first point into currentLine
	currentLine.push({ x: cursor.pos.x, y: cursor.pos.y });
	// convert currentLine into a line command, and enter that command into displayLines so it can be popped in the mouse move or mouse up events
	displayLines.push(makeLineCommand(currentLine, lineWidth));
	// dispatch drawing changed event
	canvas.dispatchEvent(drawingChangedEvent);
	// clear redoLines
	redoLines = [];
});
canvas.addEventListener("mousemove", (e) => {
	// dispatch tool moved event
	canvas.dispatchEvent(toolMovedEvent);
	// potentially draw
	if (cursor.active) {
		// push the cursor's new position into currentLine
		cursor.pos.x = e.offsetX;
		cursor.pos.y = e.offsetY;
		currentLine.push({ x: cursor.pos.x, y: cursor.pos.y });
		// replace the current line command with a new one with an updated currentLine
		displayLines.pop();
		displayLines.push(makeLineCommand(currentLine, lineWidth));
		// dispatch drawing changed event
		canvas.dispatchEvent(drawingChangedEvent);
	}
});
canvas.addEventListener("mouseup", () => {
	// deactivate cursor
	cursor.active = false;
	// get rid of the most recent line command if the line is just a point and therefore isn't proper
	if (currentLine.length == 1) {
		displayLines.pop();
	}
	// reset currentLine
	currentLine = [];
});
canvas.addEventListener("drawing-changed", () => {
	// clear the canvas so we can redraw the lines
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// redraw the lines
	for (const lineCommand of displayLines) {
		lineCommand(ctx); // execute command
	}
});
app.append(canvas);

// Clear Button
const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
	// clear displayLines
	displayLines = [];
	// dispatch drawing changed event
	canvas.dispatchEvent(drawingChangedEvent);
});
app.append(clearButton);

// Undo Button
const undoButton: HTMLButtonElement = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", () => {
	// attempt to get the lastest line command while removing it from displayLines
	const lastLineCommand: LineCommand | undefined = displayLines.pop();
	if (lastLineCommand != undefined) {
		// add the command to redoLines
		redoLines.push(lastLineCommand);
		// dispatch drawing changed event
		canvas.dispatchEvent(drawingChangedEvent);
	}
});
app.append(undoButton);

// Redo Button
const redoButton: HTMLButtonElement = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", () => {
		// attempt to get the lastest line command while removing it from redoLines
	const lastRedoLineCommand: LineCommand | undefined = redoLines.pop();
	if (lastRedoLineCommand != undefined) {
		// add the command to displayLines
		displayLines.push(lastRedoLineCommand);
		// dispatch drawing changed event
		canvas.dispatchEvent(drawingChangedEvent);
	}
});
app.append(redoButton);

// Thin Button
const thinButton: HTMLButtonElement = document.createElement("button");
thinButton.innerHTML = "Thin";
thinButton.disabled = true;	// thin is selected initially thus this button is disabled initially
thinButton.addEventListener("click", () => {
	lineWidth = THIN;

	thinButton.disabled = true;
	thickButton.disabled = false;
});
app.append(thinButton);


// Thick Button
const thickButton: HTMLButtonElement = document.createElement("button");
thickButton.innerHTML = "Thick";
thickButton.addEventListener("click", () => {
	lineWidth = THICK;
	thickButton.disabled = true;
	thinButton.disabled = false;
});
app.append(thickButton);