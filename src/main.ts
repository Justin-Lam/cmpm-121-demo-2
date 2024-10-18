// Note: many of the things I wrote here were copied or inspired from https://glitch.com/~quant-paint

import "./style.css";

const APP_NAME: string = "Sticker Sketchpad";
const app: HTMLDivElement = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

// Variables
const CANVAS_WIDTH: number = 256;
const CANVAS_HEIGHT: number = CANVAS_WIDTH;	// square canvas
const THIN = 1;	// line width
const THICK = 4;	// line width
let markerSelected = true;	// thin marker selected by default
let lineWidth = THIN;	// selected by default
let sticker = "";

// Interfaces
interface Point { // a Line would be an array of points: Point[]
	x: number;
	y: number;
}

// Commands
// with the recent "Functions are the Ultimate Commands" annoucement in Canvas, I'm unclear whether we're supposed to implement these line commands
// using classes like in paint2.html or using functional programming like in Functions are the Ultimate Commands (TS Playground)
// I'm choosing to go with functional programming because it seems to me like the "JavaScript/TypeScript" way of completing this task
type RenderThingCommand = (ctx: CanvasRenderingContext2D) => void;
function makeRenderLineCommand(line: Point[], width: number): RenderThingCommand {
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
function makeRenderToolPreviewCommand(pos: Point, radius: number) {
	return (ctx: CanvasRenderingContext2D) => {
		// set line width
		ctx.lineWidth = THIN;
		// start a new line
		ctx.beginPath();
		// draw the circle
		ctx.ellipse(pos.x, pos.y, radius, radius, 0, 0, 2*Math.PI);
		// show the circle
		ctx.stroke();
	}
}
function makeRenderStickerCommand(pos: Point, sticker: string) {	// used for sticker preview and actual placed stickers
	return (ctx: CanvasRenderingContext2D) => {
		ctx.font = "32px monospace";
        ctx.fillText(sticker, pos.x - 21, pos.y + 12);
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
let displayCommands: RenderThingCommand[] = []; // lines that should be displayed
let redoCommands: RenderThingCommand[] = []; // lines that have been undone
let currentLine: Point[] = []; //  represents the user's current line when they're drawing; contains the points from mouse down to mouse up
let showToolPreviewCommand: RenderThingCommand | null = null;
let showStickerPreviewCommand: RenderThingCommand | null = null;
const drawingChangedEvent: Event = new Event("drawing-changed");
const toolMovedEvent: Event = new Event("tool-moved");

// set canvas dimensions
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// create drawing canvas events
canvas.addEventListener("mousedown", (e: MouseEvent) => {
	// enter the first point into currentLine
	currentLine.push({ x: e.offsetX, y: e.offsetY });
	// convert currentLine into a line command, and enter that command into displayCommands so it can be popped in the mouse move or mouse up events
	displayCommands.push(makeRenderLineCommand(currentLine, lineWidth));
	// hide the tool and/or sticker preview
	showToolPreviewCommand = null;
	showStickerPreviewCommand = null;
	canvas.dispatchEvent(drawingChangedEvent);
	// clear redoCommands
	redoCommands = [];
});
canvas.addEventListener("mousemove", (e: MouseEvent) => {
	// draw
	if (e.buttons == 1) {	// left mouse button down
		// push the cursor's position into currentLine
		currentLine.push({ x: e.offsetX, y: e.offsetY });
		// replace the current line command with a new one with an updated currentLine
		displayCommands.pop();
		displayCommands.push(makeRenderLineCommand(currentLine, lineWidth));
		// dispatch drawing changed event
		canvas.dispatchEvent(drawingChangedEvent);
	}
	// make and show tool preview
	else if (markerSelected) {
		showToolPreviewCommand = makeRenderToolPreviewCommand({ x: e.offsetX, y: e.offsetY }, lineWidth);
		canvas.dispatchEvent(toolMovedEvent);
	}
	// make and show sticker preview
	else {
		showStickerPreviewCommand = makeRenderStickerCommand( { x: e.offsetX, y: e.offsetY }, sticker);
		canvas.dispatchEvent(toolMovedEvent);
	}
});
canvas.addEventListener("mouseup", () => {
	// get rid of the most recent line command if the line is just a point and therefore isn't proper
	if (currentLine.length == 1) {
		displayCommands.pop();
	}
	// show tool preview
	canvas.dispatchEvent(toolMovedEvent);
	// reset currentLine
	currentLine = [];
});
canvas.addEventListener("mouseout", () => {
	// hide the tool and sticker preview
	showToolPreviewCommand = null;
	showStickerPreviewCommand = null;
	canvas.dispatchEvent(drawingChangedEvent);
  });
canvas.addEventListener("drawing-changed", () => {
	redraw();
});

// create cursor canvas events
canvas.addEventListener("tool-moved", () => {
	redraw();
});

// define canvas functions
function redraw() {
	// ensure ctx isn't null
	if (!ctx) {
		return;
	}
	// clear the canvas so we can redraw the lines and/or cursor
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// draw the lines
	for (const lineCommand of displayCommands) {
		lineCommand(ctx); // execute
	}
	// draw the cursor
	if (showToolPreviewCommand) {	// != null
		showToolPreviewCommand(ctx);	// execute
	}
	// draw the sticker
	if (showStickerPreviewCommand) {	// != null
		showStickerPreviewCommand(ctx);	// execute
	}
}
app.append(canvas);

// Clear Button
const clearButton: HTMLButtonElement = document.createElement("button");
clearButton.innerHTML = "Clear";
clearButton.addEventListener("click", () => {
	// clear displayCommands
	displayCommands = [];
	// dispatch drawing changed event
	canvas.dispatchEvent(drawingChangedEvent);
});
app.append(clearButton);

// Undo Button
const undoButton: HTMLButtonElement = document.createElement("button");
undoButton.innerHTML = "Undo";
undoButton.addEventListener("click", () => {
	// attempt to get the lastest line command while removing it from displayCommands
	const lastLineCommand: RenderThingCommand | undefined = displayCommands.pop();
	if (lastLineCommand != undefined) {
		// add the command to redoCommands
		redoCommands.push(lastLineCommand);
		// dispatch drawing changed event
		canvas.dispatchEvent(drawingChangedEvent);
	}
});
app.append(undoButton);

// Redo Button
const redoButton: HTMLButtonElement = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", () => {
		// attempt to get the lastest line command while removing it from redoCommands
	const lastRedoLineCommand: RenderThingCommand | undefined = redoCommands.pop();
	if (lastRedoLineCommand != undefined) {
		// add the command to displayCommands
		displayCommands.push(lastRedoLineCommand);
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
	markerSelected = true;
	thinButton.disabled = true;
	thickButton.disabled = false;
	faceButton.disabled = false;
	heartButton.disabled = false;
	starButton.disabled = false;
	canvas.dispatchEvent(toolMovedEvent);
});
app.append(thinButton);

// Thick Button
const thickButton: HTMLButtonElement = document.createElement("button");
thickButton.innerHTML = "Thick";
thickButton.addEventListener("click", () => {
	lineWidth = THICK;
	markerSelected = true;
	thinButton.disabled = false;
	thickButton.disabled = true;
	faceButton.disabled = false;
	heartButton.disabled = false;
	starButton.disabled = false;
	canvas.dispatchEvent(toolMovedEvent);
});
app.append(thickButton);

// Sticker Buttons 😊💖⭐
const faceButton: HTMLButtonElement = document.createElement("button");
faceButton.innerHTML = "😊";
faceButton.addEventListener("click", () => {
	sticker = "😊";
	markerSelected = false;
	thinButton.disabled = false;
	thickButton.disabled = false;
	faceButton.disabled = true;
	heartButton.disabled = false;
	starButton.disabled = false;
	canvas.dispatchEvent(toolMovedEvent);
});
app.append(faceButton);

const heartButton: HTMLButtonElement = document.createElement("button");
heartButton.innerHTML = "💖";
heartButton.addEventListener("click", () => {
	sticker = "💖";
	markerSelected = false;
	thinButton.disabled = false;
	thickButton.disabled = false;
	faceButton.disabled = false;
	heartButton.disabled = true;
	starButton.disabled = false;
	canvas.dispatchEvent(toolMovedEvent);
});
app.append(heartButton);

const starButton: HTMLButtonElement = document.createElement("button");
starButton.innerHTML = "⭐";
starButton.addEventListener("click", () => {
	sticker = "⭐";
	markerSelected = false;
	thinButton.disabled = false;
	thickButton.disabled = false;
	faceButton.disabled = false;
	heartButton.disabled = false;
	starButton.disabled = true;
	canvas.dispatchEvent(toolMovedEvent);
});
app.append(starButton);