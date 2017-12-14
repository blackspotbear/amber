import * as glm from "gl-matrix";
import * as abr from "amber";
import { View } from "./View";

export class PolyView implements View {
	cntr: number;
	willExit: boolean;

	root: abr.Node;
	pos: glm.vec3;
	up: glm.vec3;
	center: glm.vec3;
	tm3: glm.mat3;

	targets: abr.Node[];
	targetIndex: number;

	constructor(targets: abr.Node[]) {
		this.root = new abr.Node();
		this.pos = glm.vec3.create();
		this.up = glm.vec3.fromValues(0, 1, 0);
		this.center = glm.vec3.create();
		this.tm3 = glm.mat3.create();
		this.targets = targets;
		this.reset();
	}

	reset(): void {
		this.cntr = 0;
		this.willExit = false;
		this.targetIndex = 0;
		this.root.children = [this.targets[this.targetIndex]];
	}

	update(): boolean {
		glm.quat.fromEuler(this.root.rot, 0, this.cntr / g.game.fps * 30, 0);
		return this.willExit;
	}

	draw(traverser: abr.Traverser, renderer: abr.Renderer): void {
		this.dollyCamera(renderer);
		const lightDir = glm.vec3.normalize(
			glm.vec3.create(), glm.vec3.fromValues(1, 1, 1)
		);
		const cameraMatrix = renderer.matrixStack.currentMatrix();
		glm.vec3.transformMat3(renderer.lightDir, lightDir, glm.mat3.fromMat4(this.tm3, cameraMatrix));
		traverser.traverse(this.root, renderer);
		this.cntr++;
	}

	onPointDown(pos: g.CommonOffset): void {
		if (this.targetIndex < this.targets.length - 1) {
			this.targetIndex += 1;
			this.root.children.shift();
			this.root.children.push(this.targets[this.targetIndex]);
		} else {
			this.willExit = true;
		}
	}

	onPointUp(pos: g.CommonOffset): void {
		// nothing to do.
	}

	onPointMove(pos: g.CommonOffset): void {
		// nothing to do.
	}

	private dollyCamera(renderer: abr.Renderer): void {
		const cam = renderer.matrixStack.currentMatrix();
		const target = this.targets[this.targetIndex];
		const aabb = target.bounds;
		const ax = -Math.PI / 6;

		if (aabb) {
			aabb.center(this.center);
		} else {
			glm.vec3.set(this.center, 0, 0, 0);
		}

		glm.vec3.rotateX(this.pos, [0, 0, 10], [0, 0, 0], ax);
		glm.vec3.add(this.pos, this.center, this.pos);
		glm.mat4.lookAt(cam, this.pos, this.center, this.up);

		if (! aabb) {
			return;
		}

		const pos = glm.vec4.create();
		const mvp = glm.mat4.multiply(glm.mat4.create(), renderer.projectionMatrix, cam);

		let max = Number.NEGATIVE_INFINITY;
		for (let i = 0; i < 8; i++) {
			abr.math.transformAABBVertex(pos, aabb, mvp, i);
			for (let j = 0; j < 2; j++) { // x, y
				max = Math.max(max, Math.abs(pos[j]));
			}
		}

		glm.vec3.rotateX(this.pos, [0, 0, max * 2], [0, 0, 0], ax);
		glm.vec3.add(this.pos, this.center, this.pos);
		glm.mat4.lookAt(cam, this.pos, this.center, this.up);
	}
}

