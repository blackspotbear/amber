import * as abr from "amber";

function colorBuffer2ImageData(colorBuffer: number[], imageData: ImageData): void {
	const data = imageData.data;

	let dsti = 0;
	for (let i = 0; i < colorBuffer.length; i++) {
		const rgba = colorBuffer[i];
		data[dsti++] = (rgba >> 24) & 0xFF;
		data[dsti++] = (rgba >> 16) & 0xFF;
		data[dsti++] = (rgba >>  8) & 0xFF;
		data[dsti++] = (rgba >>  0) & 0xFF;
	}
}

function drawCanvas(renderer: g.Renderer, srcCanvas: HTMLCanvasElement): void {
	const ctx = (renderer as any).context as CanvasRenderingContext2D;
	const dstCanvas = ctx.canvas;

	const anyCtx = ctx as any;
	anyCtx.mozImageSmoothingEnabled = false;
	anyCtx.webkitImageSmoothingEnabled = false;
	anyCtx.msImageSmoothingEnabled = false;
	anyCtx.imageSmoothingEnabled = false;

	ctx.drawImage(
		srcCanvas,
		0, 0,
		srcCanvas.width, srcCanvas.height,
		0, 0,
		dstCanvas.width, dstCanvas.height
	);
}

export interface FrameBufferParameterObject extends g.EParameterObject {
	pixelSize: number;
}

export class FrameBuffer extends g.E implements abr.FrameBuffer {
	pixelSize: number;

	resolution: g.CommonSize;
	colorBuffer: number[]; // RGBA
	zBuffer: number[];

	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
	imageData: ImageData;

	constructor(param: FrameBufferParameterObject) {
		super(param);
		this.pixelSize = param.pixelSize;
		this.resolution = {
			width: (this.width / param.pixelSize) | 0,
			height: (this.width / param.pixelSize) | 0
		};

		// back buffer
		this.canvas = document.createElement("canvas");
		this.canvas.width = this.resolution.width;
		this.canvas.height = this.resolution.height;
		this.ctx = this.canvas.getContext("2d");
		this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

		this.colorBuffer = new Array(this.resolution.width * this.resolution.height);
		this.zBuffer = new Array(this.resolution.width * this.resolution.height);
	}

	renderSelf(renderer: g.Renderer, camera?: g.Camera): boolean {

		this.ctx.save();
		colorBuffer2ImageData(this.colorBuffer, this.imageData);
		this.ctx.putImageData(this.imageData, 0, 0);
		this.ctx.restore();

		renderer.save();
		drawCanvas(renderer, this.canvas);
		renderer.restore();

		return true;
	}
}
