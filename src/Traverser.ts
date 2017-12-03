import * as glm from "gl-matrix";
import { Node } from "./Node";
import { Renderer } from "./Renderer";
import { AABBox } from "./AABBox";
import * as math from "./math";

interface VisibilityResult {
	offscreen: boolean;
	inside: boolean;
}

function isVisible(aabb: AABBox, renderer: Renderer): VisibilityResult {
	if (!aabb || aabb.isEmpty()) return { offscreen: false, inside: false };

	const mvp = glm.mat4.multiply(glm.mat4.create(), renderer.projectionMatrix, renderer.matrixStack.currentMatrix());
	const pos = glm.vec4.create();

	let codeAnd = 0x3F;
	let codeOr = 0x00;

	for (let i = 0; i < 8; i++) {
		const code = math.calcOutCode(math.transformAABBVertex(pos, aabb, mvp, i));
		codeAnd &= code;
		codeOr |= code;
	}

	return { offscreen: codeAnd !== 0, inside: codeOr === 0 };
}

export class Traverser {
	traverse(node: Node, renderer: Renderer): void {
		node.begin(renderer);

		const visibility = isVisible(node.bounds, renderer);
		if (! visibility.offscreen) {
			node.draw(renderer); // TODO: skip clipping if visibility.inside === false

			const children = node.children;
			for (let i = 0; i < children.length; i++) {
				this.traverse(children[i], renderer);
			}
		}

		node.end(renderer);
	}
}
