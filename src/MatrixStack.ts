import * as glm from "gl-matrix";

export class MatrixStack {
	static MAX_STACK_SIZE: number = 32;

	private head: number;
	private stack: glm.mat4[];
	private tmp: glm.mat4;

	constructor() {
		this.head = 0;
		this.tmp = glm.mat4.create();

		this.stack = [];
		for (let i = 0; i < MatrixStack.MAX_STACK_SIZE; i++) {
			this.stack.push(glm.mat4.create());
		}
		glm.mat4.identity(this.stack[0]);
	}

	pushTransform(rot: glm.quat, pos: glm.vec3): void {
		glm.mat4.fromRotationTranslation(this.tmp, rot, pos);
		glm.mat4.multiply(this.stack[this.head + 1], this.stack[this.head], this.tmp);
		this.head++;
	}

	currentMatrix(): glm.mat4 {
		return this.stack[this.head];
	}

	pop(): void {
		if (this.head === 0) {
			return;
		}
		this.head--;
	}
}
