import * as glm from "gl-matrix";
import { Geometry } from "./Geometry";
import { Vertex } from "./Vertex";
import { FrameBuffer } from "./FrameBuffer";
import { Color } from "./Color";
import { Material } from "./Material";
import { MatrixStack } from "./MatrixStack";
import { Shader } from "./Shader";
import * as cmn from "./internal/common";

function clip(vertices: Vertex[], num: number, clipped: Vertex[], elemIdx: number, coef: number): number {
	let head = 0;

	for (let i = 0; i < num; i++) {
		const p1 = vertices[i].pos;
		const n1 = vertices[i].nrm;
		const uv1 = vertices[i].uv;
		const c1 = vertices[i].color;
		const e1 = p1[elemIdx];
		const w1 = p1[3];

		const j = (i + 1) % num;
		const p2 = vertices[j].pos;
		const n2 = vertices[j].nrm;
		const uv2 = vertices[j].uv;
		const c2 = vertices[j].color;
		const e2 = p2[elemIdx];
		const w2 = p2[3];

		const e1In = (coef * e1 <= w1);
		const e2In = (coef * e2 <= w2);

		const c = coef * -1;
		if (e1In && e2In) {
			glm.vec4.copy(clipped[head].pos, p1);
			glm.vec4.copy(clipped[head].nrm, n1);
			glm.vec2.copy(clipped[head].uv, uv1);
			glm.vec4.copy(clipped[head].color, c1);
			head++;
		} else if (!e1In && !e2In) {
			// no output
		} else if (!e1In && e2In) {
			const t = -(c * e1 + w1) / (c * (e2 - e1) + (w2 - w1));
			glm.vec4.lerp(clipped[head].pos, p1, p2, t);
			glm.vec4.lerp(clipped[head].nrm, n1, n2, t);
			glm.vec4.normalize(clipped[head].nrm, clipped[head].nrm);
			glm.vec2.lerp(clipped[head].uv, uv1, uv2, t);
			glm.vec4.lerp(clipped[head].color, c1, c2, t);
			head++;
		} else if (e1In && !e2In) {
			glm.vec4.copy(clipped[head].pos, p1);
			glm.vec4.copy(clipped[head].nrm, n1);
			glm.vec2.copy(clipped[head].uv, uv1);
			glm.vec4.copy(clipped[head].color, c1);
			head++;

			const t = -(c * e1 + w1) / (c * (e2 - e1) + (w2 - w1));
			glm.vec4.lerp(clipped[head].pos, p1, p2, t);
			glm.vec4.lerp(clipped[head].nrm, n1, n2, t);
			glm.vec4.normalize(clipped[head].nrm, clipped[head].nrm);
			glm.vec2.lerp(clipped[head].uv, uv1, uv2, t);
			glm.vec4.lerp(clipped[head].color, c1, c2, t);
			head++;
		}
	}

	return head;
}

function clipVertices(proj: glm.mat4, vertices: Vertex[], origNum: number, tmp: Vertex[], clipped: Vertex[]): number {
	let num = origNum;

	num = clip(vertices, num, tmp,     0, -1);
	num = clip(tmp,      num, clipped, 0, +1);
	num = clip(clipped,  num, tmp,     1, -1);
	num = clip(tmp,      num, clipped, 1, +1);
	num = clip(clipped,  num, tmp,     2, -1);
	num = clip(tmp,      num, clipped, 2, +1);

	return num;
}

function isCCW(vertices: Vertex[]): boolean {
	const v0 = vertices[0];
	const v1 = vertices[1];
	const v2 = vertices[2];
	const x1 = v1.pos[0] - v0.pos[0];
	const y1 = v1.pos[1] - v0.pos[1];
	const x2 = v2.pos[0] - v0.pos[0];
	const y2 = v2.pos[1] - v0.pos[1];
	const p = x1 * y2 - x2 * y1;
	return p > 0;
}

export interface RendererParameterObject {
	frameBuffer: FrameBuffer;
	clearColor: number;
}

export class Renderer {
	frameBuffer: FrameBuffer;

	lightDir: glm.vec3;
	ambient: glm.vec4;

	projectionMatrix: glm.mat4;
	matrixStack: MatrixStack;

	clearColor: number;
	material: Material;

	private ndcVertices: Vertex[];
	private ndcClippedVertices: Vertex[];
	private ndcTmpClippedVertices: Vertex[];
	private tmpVtx: glm.vec4;
	private tmpNrm: glm.vec4;
	private tmpBC: glm.vec3;

	constructor(param: RendererParameterObject) {
		this.frameBuffer = param.frameBuffer;

		this.lightDir = glm.vec3.normalize(
			glm.vec3.create(), glm.vec3.fromValues(1, 1, 1)
		);

		this.ambient = glm.vec4.fromValues(0.1, 0.1, 0.1, 1);

		this.projectionMatrix = glm.mat4.create();
		glm.mat4.perspective(
			this.projectionMatrix,
			Math.PI / 2,
			this.frameBuffer.resolution.width / this.frameBuffer.resolution.height,
			1.0, 300
		);

		this.matrixStack = new MatrixStack();
		this.clearColor = param.clearColor;

		// temporary buffers
		this.tmpVtx = glm.vec4.create();
		this.tmpNrm = glm.vec4.create();
		this.tmpBC = glm.vec3.create();
		this.ndcVertices = [];
		for (let i = 0; i < 3; i++) {
			this.ndcVertices.push(new Vertex());
		}
		this.ndcClippedVertices = [];
		this.ndcTmpClippedVertices = [];
		for (let i = 0; i < 3 + 6; i++) {
			this.ndcClippedVertices.push(new Vertex());
			this.ndcTmpClippedVertices.push(new Vertex());
		}
	}

	clear(): void {
		this.clearBuffer(this.clearColor, this.frameBuffer.colorBuffer);
		this.clearBuffer(1, this.frameBuffer.zBuffer);
	}

	drawPrimitives(geo: Geometry): void {
		const ib = geo.indexBuffer;
		const mv = this.matrixStack.currentMatrix();
		const mvp = glm.mat4.multiply(glm.mat4.create(), this.projectionMatrix, this.matrixStack.currentMatrix());

		const shader = this.material.shader;
		shader.uniform.mv = mv;
		shader.uniform.mvp = mvp;
		shader.uniform.material = this.material;
		shader.uniform.lightDir = this.lightDir;
		shader.uniform.ambient = this.ambient;

		for (let i = 0; i < ib.length; i += 3) {
			for (let j = 0; j < 3; j++) {
				shader.vertex(geo, i + j, this.ndcVertices[j]);
			}

			const clippedVertexCount = clipVertices(
				this.projectionMatrix,
				this.ndcVertices,
				3,
				this.ndcTmpClippedVertices,
				this.ndcClippedVertices
			);

			// to NDC
			for (let j = 0; j < clippedVertexCount; j++) {
				const v = this.ndcClippedVertices[j];
				v.pos[0] /= v.pos[3];
				v.pos[1] /= v.pos[3];
				v.pos[2] /= v.pos[3];
			}

			// backface culling
			if (!isCCW(this.ndcClippedVertices)) {
				continue;
			}

			// to Screen
			for (let j = 0; j < clippedVertexCount; j++) {
				const v = this.ndcClippedVertices[j];
				v.pos[0] = (v.pos[0] + 1) / 2 * this.frameBuffer.resolution.width;
				v.pos[1] = (v.pos[1] + 1) / 2;
				v.pos[1] = (v.pos[1] - 1) * -1 * this.frameBuffer.resolution.height; // upside down
			}

			// draw
			for (let j = 0; j < clippedVertexCount - 2; j++) {
				const v0 = this.ndcClippedVertices[0];
				const v1 = this.ndcClippedVertices[1 + j];
				const v2 = this.ndcClippedVertices[2 + j];
				this.drawTriangle_bc(v0, v1, v2);
			}
		}
	}

	// draw triangle in screen space
	drawTriangle_bc(v1: Vertex, v2: Vertex, v3: Vertex): void {
		const positions = [v1.pos, v2.pos, v3.pos];

		let minX = this.frameBuffer.resolution.width;
		let maxX = 0;
		let minY = this.frameBuffer.resolution.height;
		let maxY = 0;
		positions.forEach((v) => {
			if (v[0] < minX) minX = v[0];
			if (v[0] > maxX) maxX = v[0];
			if (v[1] < minY) minY = v[1];
			if (v[1] > maxY) maxY = v[1];
		});

		if (minX < 0) minX = 0;
		if (minY < 0) minY = 0;
		if (maxX > this.frameBuffer.resolution.width) maxX = this.frameBuffer.resolution.width;
		if (maxY > this.frameBuffer.resolution.height) maxY = this.frameBuffer.resolution.height;

		const barycentric = (A: glm.vec4, B: glm.vec4, C: glm.vec4, x: number, y: number, bc: glm.vec3) => {
			const ABx = B[0] - A[0];
			const ACx = C[0] - A[0];
			const PAx = A[0] - x;
			const ABy = B[1] - A[1];
			const ACy = C[1] - A[1];
			const PAy = A[1] - y;

			const crossU = ACx * PAy - PAx * ACy;
			const crossV = PAx * ABy - ABx * PAy;
			const crossW = ABx * ACy - ACx * ABy;

			if (Math.abs(crossW) < 0.1) { // degenerate
				bc[0] = -1;
				return;
			}

			bc[0] = 1 - (crossU + crossV) / crossW;
			bc[1] = crossU / crossW;
			bc[2] = crossV / crossW;
		};

		const bc = this.tmpBC;
		for (let y = minY | 0; y < maxY; y++) {
			const sx = this.frameBuffer.resolution.width * y;
			for (let x = minX | 0; x < maxX; x++) {
				barycentric(v1.pos, v2.pos, v3.pos, x, y, bc);
				if (bc[0] < 0 || bc[1] < 0 || bc[2] < 0) {
					continue;
				}
				let z = 0;
				positions.forEach((v, i) => {
					z += v[2] * bc[i];
				});
				const idx = sx + x;
				if (this.frameBuffer.zBuffer[idx] < z) {
					continue;
				}
				const hexColor = this.material.shader.fragment(v1, v2, v3, bc);
				if (hexColor === null) continue;
				this.frameBuffer.colorBuffer[idx] = hexColor;
				this.frameBuffer.zBuffer[idx] = z;
			}
		}
	}

	drawTriangle(__v1: Vertex, __v2: Vertex, __v3: Vertex): void {
		const _v1 = __v1.pos;
		const _v2 = __v2.pos;
		const _v3 = __v3.pos;
		let n1 = __v1.nrm;
		let n2 = __v2.nrm;
		let n3 = __v3.nrm;

		const sorted = [[_v1, n1], [_v2, n2], [_v3, n3]].sort((a, b) => a[0][1] - b[0][1]);
		const v1 = glm.vec3.fromValues(sorted[0][0][0] | 0, sorted[0][0][1] | 0, sorted[0][0][2]);
		const v2 = glm.vec3.fromValues(sorted[1][0][0] | 0, sorted[1][0][1] | 0, sorted[1][0][2]);
		const v3 = glm.vec3.fromValues(sorted[2][0][0] | 0, sorted[2][0][1] | 0, sorted[2][0][2]);
		n1 = sorted[0][1]; n2 = sorted[1][1]; n3 = sorted[2][1];
		if (v3[1] < 0) return;

		const totalHeight = v3[1] - v1[1];
		if (totalHeight < 1) return;

		const hexColor = cmn.createFaceColor(n1, this.material, this.lightDir, this.ambient).toHex();
		const buffer = this.frameBuffer.colorBuffer;

		for (let i = 0; i < totalHeight; i++) {
			const y = v1[1] + i;
			if (y < 0) continue;
			if (y >= buffer.length) break;

			const isUpper = y < v2[1];
			const currentHeight = isUpper ? v2[1] - v1[1] : v3[1] - v2[1];
			if (currentHeight < 1) continue;
			const dx1 = v3[0] - v1[0];
			const dx2 = isUpper ? (v2[0] - v1[0]) : (v3[0] - v2[0]);
			const dz1 = v3[2] - v1[2];
			const dz2 = isUpper ? (v2[2] - v1[2]) : (v3[2] - v2[2]);
			const t1 = i / totalHeight;
			const t2 = (isUpper ? i : i - (v2[1] - v1[1])) / currentHeight;

			let e1x = dx1 * t1 + v1[0];
			let e2x = dx2 * t2 + (isUpper ? v1[0] : v2[0]);
			let e1z = dz1 * t1 + v1[2];
			let e2z = dz2 * t2 + (isUpper ? v1[2] : v2[2]);
			if (e1x > e2x) {
				// swap x
				let tmp = e2x;
				e2x = e1x;
				e1x = tmp;
				// swap z
				tmp = e2z;
				e2z = e1z;
				e1z = tmp;
			}

			const sx = this.frameBuffer.resolution.width * (y | 0);
			let z = e1z;
			const dhz = (e2z - e1z) / (e2x - e1x);
			for (let x = e1x | 0; x < e2x; x++) {
				if (x >= this.frameBuffer.resolution.width) break;
				const idx = sx + x;
				if (x >= 0 && this.frameBuffer.zBuffer[idx] >= z) {
					this.frameBuffer.colorBuffer[idx] = hexColor;
					this.frameBuffer.zBuffer[idx] = z;
				}
				z += dhz;
			}
		}
	}

	private clearBuffer(value: number, buffer: number[]): void {
		for (let i = 0, len = buffer.length; i < len; i++) {
			buffer[i] = value;
		}
	}
}
