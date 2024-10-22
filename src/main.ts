// Note: many of the things I wrote here were copied or inspired from https://glitch.com/~quant-paint

import "./style.css";

const APP_NAME: string = "Sticker Sketchpad";
const app: HTMLDivElement = document.querySelector<HTMLDivElement>("#app")!;
document.title = APP_NAME;

// Constants
const CANVAS_WIDTH: number = 256;
const CANVAS_HEIGHT: number = CANVAS_WIDTH; // square canvas
const EXPORT_CANVAS_WIDTH: number = 1024;
const EXPORT_CANVAS_HEIGHT: number = EXPORT_CANVAS_WIDTH;	// square canvas
const THIN: number = 1; // line width
const THICK: number = 4; // line width
const stickers: Sticker[] = [
	// default stickers
	{
		sticker: "😊",
	},
	{
		sticker: "💖",
	},
	{
		sticker: "⭐",
	},
];

// Interfaces
interface Point { // a Line would be an array of points: Point[]
	x: number;
	y: number;
}
interface Sticker {
	sticker: string;
}

// Commands
// with the recent "Functions are the Ultimate Commands" annoucement in Canvas, I'm unclear whether we're supposed to implement these line commands
// using classes like in paint2.html or using functional programming like in Functions are the Ultimate Commands (TS Playground)
// I'm choosing to go with functional programming because it seems to me like the "JavaScript/TypeScript" way of completing this task
type RenderThingCommand = (ctx: CanvasRenderingContext2D) => void;
function makeRenderLineCommand(
	line: Point[],
	width: number,
): RenderThingCommand {
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
	};
}
function makeRenderToolPreviewCommand(
	pos: Point,
	radius: number,
): RenderThingCommand {
	return (ctx: CanvasRenderingContext2D) => {
		// set line width
		ctx.lineWidth = THIN;
		// start a new line
		ctx.beginPath();
		// draw the circle
		ctx.ellipse(pos.x, pos.y, radius, radius, 0, 0, 2*Math.PI);
		// show the circle
		ctx.stroke();
	};
}
function makeRenderStickerCommand(
	pos: Point,
	sticker: string,
): RenderThingCommand { // used for sticker preview and placing stickers
	return (ctx: CanvasRenderingContext2D) => {
		ctx.font = "32px monospace";
		ctx.fillText(sticker, pos.x - 21, pos.y + 12); // center the sticker preview at the tip of the cursor
	};
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
let currentLineWidth: number = THIN; // thin by default
let currentSticker: string = "";
let markerSelected: boolean = true; // selected by default
let showToolPreviewCommand: RenderThingCommand | null = null;
let showStickerPreviewCommand: RenderThingCommand | null = null;
const drawingChangedEvent: Event = new Event("drawing-changed");
const toolMovedEvent: Event = new Event("tool-moved");

// set canvas dimensions
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// create drawing canvas events
canvas.addEventListener("mousedown", (e: MouseEvent) => {
	// drawing
	if (markerSelected) {
		// reset currentLine in case it still has the previous line in it (yeah I know this is a lazy bugfix)
		currentLine = [];
		// enter the first point into currentLine
		currentLine.push({ x: e.offsetX, y: e.offsetY });
		// convert currentLine into a line command, and enter that command into displayCommands so it can be popped in the mouse move or mouse up events
		displayCommands.push(
			makeRenderLineCommand(currentLine, currentLineWidth),
		);
		// hide the tool preview
		showToolPreviewCommand = null;
		canvas.dispatchEvent(drawingChangedEvent);
	} // placing stickers
	else {
		// place sticker
		displayCommands.push(
			makeRenderStickerCommand(
				{ x: e.offsetX, y: e.offsetY },
				currentSticker,
			),
		);
		// hide the sticker preview
		showStickerPreviewCommand = null;
	}

	// dispatch drawing changed event
	canvas.dispatchEvent(drawingChangedEvent);
	// clear redoCommands
	redoCommands = [];
});
canvas.addEventListener("mousemove", (e: MouseEvent) => {
	// draw
	if (markerSelected && e.buttons == 1) { // left mouse button down
		// push the cursor's position into currentLine
		currentLine.push({ x: e.offsetX, y: e.offsetY });
		// replace the current line command with a new one with an updated currentLine
		displayCommands.pop();
		displayCommands.push(
			makeRenderLineCommand(currentLine, currentLineWidth),
		);
		// dispatch drawing changed event
		canvas.dispatchEvent(drawingChangedEvent);
	} // make and show tool preview
	else if (markerSelected) {
		showToolPreviewCommand = makeRenderToolPreviewCommand({
			x: e.offsetX,
			y: e.offsetY,
		}, currentLineWidth);
		canvas.dispatchEvent(toolMovedEvent);
	} // move placed sticker
	else if (e.buttons == 1) { // left mouse button down
		// replace the current sticker command with a new one with an updated position
		displayCommands.pop();
		displayCommands.push(
			makeRenderStickerCommand(
				{ x: e.offsetX, y: e.offsetY },
				currentSticker,
			),
		);
		canvas.dispatchEvent(toolMovedEvent);
	} // make and show sticker preview
	else {
		showStickerPreviewCommand = makeRenderStickerCommand({
			x: e.offsetX,
			y: e.offsetY,
		}, currentSticker);
		canvas.dispatchEvent(toolMovedEvent);
	}
});
canvas.addEventListener("mouseup", (e: MouseEvent) => {
	// get rid of the most recent line command if the line is just a point and therefore isn't proper
	if (currentLine.length == 1) {
		displayCommands.pop();
	}
	// reset currentLine
	currentLine = [];
	// make and show tool/sticker preview
	if (markerSelected) {
		showToolPreviewCommand = makeRenderToolPreviewCommand({
			x: e.offsetX,
			y: e.offsetY,
		}, currentLineWidth);
		canvas.dispatchEvent(toolMovedEvent);
	} else {
		showStickerPreviewCommand = makeRenderStickerCommand({
			x: e.offsetX,
			y: e.offsetY,
		}, currentSticker);
		canvas.dispatchEvent(toolMovedEvent);
	}
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
function redraw(): void {
	// ensure ctx isn't null
	if (!ctx) {
		return;
	}
	// clear the canvas so we can redraw the lines and/or cursor
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// execute the display commands
	for (const command of displayCommands) {
		command(ctx); // execute
	}
	// draw the cursor
	if (showToolPreviewCommand) { // != null
		showToolPreviewCommand(ctx); // execute
	}
	// draw the sticker
	if (showStickerPreviewCommand) { // != null
		showStickerPreviewCommand(ctx); // execute
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
	// attempt to get the lastest command while removing it from displayCommands
	const lastCommand: RenderThingCommand | undefined = displayCommands.pop();
	if (lastCommand != undefined) {
		// add the command to redoCommands
		redoCommands.push(lastCommand);
		// dispatch drawing changed event
		canvas.dispatchEvent(drawingChangedEvent);
	}
});
app.append(undoButton);

// Redo Button
const redoButton: HTMLButtonElement = document.createElement("button");
redoButton.innerHTML = "Redo";
redoButton.addEventListener("click", () => {
	// attempt to get the lastest command while removing it from redoCommands
	const lastCommand: RenderThingCommand | undefined = redoCommands.pop();
	if (lastCommand != undefined) {
		// add the command to displayCommands
		displayCommands.push(lastCommand);
		// dispatch drawing changed event
		canvas.dispatchEvent(drawingChangedEvent);
	}
});
app.append(redoButton);

// Export Button
const exportButton: HTMLButtonElement = document.createElement("button");
exportButton.innerHTML = "Export";
exportButton.addEventListener("click", () => {
	// create temporary export canvas
	const exportCanvas: HTMLCanvasElement = document.createElement("canvas");
	exportCanvas.width = EXPORT_CANVAS_WIDTH;
	exportCanvas.height = EXPORT_CANVAS_HEIGHT;

	// create temporary ctx and scale it
	const exportCtx: CanvasRenderingContext2D | null = exportCanvas.getContext(
		"2d",
	); // ctx = "context" aka "CanvasRenderingContext2D object"
	if (exportCtx == null) throw new Error("ctx is null"); // ensure that we got something back from getContext(); brace told me to add this to remove warnings
	exportCtx.scale(
		EXPORT_CANVAS_WIDTH / CANVAS_WIDTH,
		EXPORT_CANVAS_HEIGHT / CANVAS_HEIGHT,
	);

	// render all display commands on the export canvas
	for (const command of displayCommands) {
		command(exportCtx); // execute
	}

	// download the canvas as a png file
	const anchor = document.createElement("a");
	anchor.href = exportCanvas.toDataURL("image/png");
	anchor.download = "sketchpad.png";
	anchor.click();
});
app.append(exportButton);

// Thin Button
const thinButton: HTMLButtonElement = document.createElement("button");
thinButton.innerHTML = "Thin";
thinButton.disabled = true; // thin is selected initially thus this button is disabled initially
thinButton.addEventListener("click", () => {
	currentLineWidth = THIN;
	markerSelected = true;
	thinButton.disabled = true;
	thickButton.disabled = false;
	for (const button of stickerButtons) {
		button.disabled = false;
	}
	canvas.dispatchEvent(toolMovedEvent);
});
app.append(thinButton);

// Thick Button
const thickButton: HTMLButtonElement = document.createElement("button");
thickButton.innerHTML = "Thick";
thickButton.addEventListener("click", () => {
	currentLineWidth = THICK;
	markerSelected = true;
	thinButton.disabled = false;
	thickButton.disabled = true;
	for (const button of stickerButtons) {
		button.disabled = false;
	}
	canvas.dispatchEvent(toolMovedEvent);
});
app.append(thickButton);

// Add Sticker Button
const addStickerButton: HTMLButtonElement = document.createElement("button");
addStickerButton.innerHTML = "Add Sticker";
addStickerButton.addEventListener("click", () => {
	const value: string | null = prompt("Enter sticker:", "🧽");
	if (value != null) {
		// create sticker object
		const sticker: Sticker = {
			sticker: value,
		};
		//  add sticker object to stickers array
		stickers.push(sticker);
		// use sticker object to create sticker button and add to stickerButtons array
		stickerButtons.push(createStickerButton(sticker));
	}
});
app.append(addStickerButton);

// Sticker Buttons 😊💖⭐
const stickerButtons: HTMLButtonElement[] = [];
for (const sticker of stickers) {
	stickerButtons.push(createStickerButton(sticker));
}

function createStickerButton(sticker: Sticker): HTMLButtonElement {
	const button: HTMLButtonElement = document.createElement("button");
	button.innerHTML = sticker.sticker;
	button.addEventListener("click", () => {
		currentSticker = sticker.sticker;
		markerSelected = false;
		thinButton.disabled = false;
		thickButton.disabled = false;

		// make this sticker button the only disabled one by enabling every button then specifically disabling this one
		for (const button of stickerButtons) {
			button.disabled = false;
		}
		button.disabled = true;

		canvas.dispatchEvent(toolMovedEvent);
	});
	app.append(button);
	return button;
}
