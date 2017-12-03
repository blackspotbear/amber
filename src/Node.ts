import * as glm from "gl-matrix";
import { Renderer } from "./Renderer";
import { AABBox } from "./AABBox";

export class Node {
	children: Node[];
	rot: glm.quat;
	pos: glm.vec3;
	bounds: AABBox;
	name: string;

	constructor() {
		this.children = [];
		this.rot = glm.quat.identity(glm.quat.create());
		this.pos = glm.vec3.create();
		this.bounds = null;
		this.name = null;
	}

	begin(renderer: Renderer): void {
		renderer.matrixStack.pushTransform(this.rot, this.pos);
	}

	draw(renderer: Renderer): void {
		// nothing to do
	}

	end(renderer: Renderer): void {
		renderer.matrixStack.pop();
	}
}
