export class Texture {
	rgba: Uint8ClampedArray;
	width: number;
	height: number;

	constructor(rgba: Uint8ClampedArray, width: number, height: number) {
		this.rgba = rgba;
		this.width = width;
		this.height = height;
	}
}