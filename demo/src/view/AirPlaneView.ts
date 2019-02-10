import * as glm from "gl-matrix";
import * as abr from "amber";
import { View } from "./View";

export class AirPlaneView implements View {
	cntr: number;
	willExit: boolean;

	airPlane: abr.Node;
	world: abr.Node;

	pos: glm.vec3;
	up: glm.vec3;
	center: glm.vec3;
	tm3: glm.mat3;

	constructor(airPlane: abr.Node, world: abr.Node) {
		this.airPlane = new abr.Node();
		this.airPlane.children.push(airPlane);
		this.world = world;
		this.tm3 = glm.mat3.create();
		this.reset();
	}

	reset(): void {
		this.cntr = 0;
		this.willExit = false;

		this.pos = glm.vec3.fromValues(3, 5, 9);
		this.up = glm.vec3.fromValues(0, 1, 0);
		this.center = glm.vec3.fromValues(0, 0, 0);

		glm.quat.identity(this.airPlane.rot);
		glm.vec3.set(this.airPlane.pos, 0, 0, 0);

		glm.quat.identity(this.world.rot);
		glm.vec3.set(this.world.pos, 0, -10, 0);
	}

	update(): boolean {
		const dur = (g.game.fps * 3) | 0;
		const t = (this.cntr % dur) / dur;

		this.airPlane.pos[0] = -1 + 2 * Math.sin(Math.PI * 2 * t);
		this.airPlane.pos[1] = -2 + (Math.sin(Math.PI * this.cntr / (g.game.fps * 1)) + 1) * 5;

		const deg = (this.cntr / dur) * 360;
		glm.quat.fromEuler(this.airPlane.rot, deg, deg, deg);

		glm.quat.fromEuler(this.world.rot, 0, 90, 90);
		glm.quat.mul(
			this.world.rot,
			glm.quat.fromEuler(glm.quat.create(), 0, -deg / 2, 0),
			glm.quat.fromEuler(glm.quat.create(), 0, 90, 90)
		);

		return this.willExit;
	}

	draw(traverser: abr.Traverser, renderer: abr.Renderer): void {
		const lightDir = glm.vec3.normalize(
			glm.vec3.create(), glm.vec3.fromValues(1, 1, 1)
		);
		const cameraMatrix = renderer.matrixStack.currentMatrix();
		glm.mat4.lookAt(cameraMatrix, this.pos, this.center, this.up);
		glm.vec3.transformMat3(renderer.lightDir, lightDir, glm.mat3.fromMat4(this.tm3, cameraMatrix));
		traverser.traverse(this.world, renderer);
		traverser.traverse(this.airPlane, renderer);
		this.cntr++;
	}

	onPointDown(pos: g.CommonOffset): void {
		this.willExit = true;
	}

	onPointUp(pos: g.CommonOffset): void {
		// nothing to do.
	}

	onPointMove(pos: g.CommonOffset): void {
		// nothing to do.
	}
}
