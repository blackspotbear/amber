import * as abr from "amber";

function colorBuffer2ImageData(colorBuffer: number[], imageData: g.ImageData): void {
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

export interface FrameBufferParameterObject extends g.EParameterObject {
	pixelSize: number;
}

export class FrameBuffer extends g.E implements abr.FrameBuffer {
	pixelSize: number;

	resolution: g.CommonSize;
	colorBuffer: number[]; // RGBA
	zBuffer: number[];

	backSurface: g.Surface;
	imageData: g.ImageData;

	constructor(param: FrameBufferParameterObject) {
		super(param);

		const width = (this.width / param.pixelSize) | 0;
		const height = (this.width / param.pixelSize) | 0;

		this.pixelSize = param.pixelSize;
		this.resolution = { width, height };
		this.backSurface = g.game.resourceFactory.createSurface(width, height);
		this.imageData = this.backSurface.renderer()._getImageData(0, 0, width, height);
		this.colorBuffer = new Array(width * height);
		this.zBuffer = new Array(width * height);
	}

	renderSelf(renderer: g.Renderer, camera?: g.Camera): boolean {
		this.updateBackSurface();

		const sx = g.game.width / this.backSurface.width;
		const sy = g.game.height / this.backSurface.height;

		renderer.save();
		renderer.transform([sx, 0, 0, sy, 0, 0]);
		renderer.drawImage(this.backSurface, 0, 0, this.backSurface.width, this.backSurface.height, 0, 0);
		renderer.restore();

		return true;
	}

	private updateBackSurface(): void {
		colorBuffer2ImageData(this.colorBuffer, this.imageData);
		this.backSurface.renderer()._putImageData(this.imageData, 0, 0);
	}
}
