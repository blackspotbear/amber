import * as glm from "gl-matrix";

export class Vertex {
	pos: glm.vec4;
	nrm: glm.vec4;
	uv: glm.vec2;

	color: glm.vec4;

	constructor() {
		this.pos = glm.vec4.create();
		this.nrm = glm.vec4.create();
		this.uv = glm.vec2.create();
		this.color = glm.vec4.create();
	}
}
