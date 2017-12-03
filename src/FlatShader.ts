import * as glm from "gl-matrix";
import { Vertex } from "./Vertex";
import { Color } from "./Color";
import { Material } from "./Material";
import { Shader, ShaderUniform } from "./Shader";
import { Geometry } from "./Geometry";
import * as cmn from "./internal/common";

function vec4ToHex(v: glm.vec4): number {
	return ((Math.min(1, v[0]) * 0xFF) << 24) |
		   ((Math.min(1, v[1]) * 0xFF) << 16) |
		   ((Math.min(1, v[2]) * 0xFF) <<  8) |
		   ((Math.min(1, v[3]) * 0xFF) <<  0);
}

export class FlatShader implements Shader {
	uniform: ShaderUniform;

	constructor() {
		this.uniform = {
			mv: null,
			mvp: null,
			material: null,
			lightDir: null,
			ambient: null
		};
	}

	vertex(geo: Geometry, iIdx: number, vtxOut: Vertex): void {
		const vb = geo.vertexBuffer;
		const vIdx = geo.indexBuffer[iIdx];
		glm.vec4.set(vtxOut.pos, vb[vIdx * 3 + 0], vb[vIdx * 3 + 1], vb[vIdx * 3 + 2], 1);
		glm.vec4.transformMat4(vtxOut.pos, vtxOut.pos, this.uniform.mvp);

		const nb = geo.normBuffer;
		if (nb) {
			glm.vec4.set(vtxOut.nrm, nb[vIdx * 3 + 0], nb[vIdx * 3 + 1], nb[vIdx * 3 + 2], 0);
			glm.vec4.transformMat4(vtxOut.nrm, vtxOut.nrm, this.uniform.mv);

			glm.vec4.mul(vtxOut.color, this.uniform.material.ambient, this.uniform.ambient);
			const intensity = Math.max(0, glm.vec3.dot(this.uniform.lightDir, [vtxOut.nrm[0], vtxOut.nrm[1], vtxOut.nrm[2]]));
			glm.vec4.scaleAndAdd(vtxOut.color, vtxOut.color, this.uniform.material.diffuse, intensity);
		} else {
			glm.vec4.set(vtxOut.color, 1, 1, 1, 1);
		}

		const uvb = geo.uvBuffer;
		if (uvb) {
			glm.vec2.set(vtxOut.uv, uvb[vIdx * 2], uvb[vIdx * 2 + 1]);
		}
	}

	fragment(vtx1: Vertex, vtx2: Vertex, vtx3: Vertex, bc: glm.vec3): number {
		if (! this.uniform.material) {
			return null;
		}

		const tex = this.uniform.material.texture;

		if (! tex) {
			return vec4ToHex(vtx1.color);
		}

		const u = (glm.vec3.dot(bc, [vtx1.uv[0], vtx2.uv[0], vtx3.uv[0]]) * tex.width) | 0;
		const v = (glm.vec3.dot(bc, [vtx1.uv[1], vtx2.uv[1], vtx3.uv[1]]) * tex.height) | 0;
		const idx4 = (tex.width * v + u) * 4;
		const r = Math.min(0xFF, (tex.rgba[idx4 + 0] * vtx1.color[0]) | 0);
		const g = Math.min(0xFF, (tex.rgba[idx4 + 1] * vtx1.color[1]) | 0);
		const b = Math.min(0xFF, (tex.rgba[idx4 + 2] * vtx1.color[2]) | 0);
		const a = Math.min(0xFF, (tex.rgba[idx4 + 3] * vtx1.color[3]) | 0);

		return (r << 24) | (g << 16) | (b << 8) | a;

	}
}
