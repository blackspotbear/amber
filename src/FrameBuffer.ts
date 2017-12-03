export interface FrameBuffer {
	resolution: { width: number, height: number };
	colorBuffer: number[];
	zBuffer: number[];
}
