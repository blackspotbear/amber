import * as glm from "gl-matrix";
import { Node } from "./Node";
import { MatrixStack } from "./MatrixStack";
import * as math from "./math";
import { AABBox } from "./AABBox";

export function cssColor(rgba: number): string {
	return "#" + ("000000" + ((rgba >> 8) & 0x00FFFFFF).toString(16)).slice(-6);
}

export function calcBounds(node : Node): void {
	node.bounds = node.bounds || new AABBox();

	if (! node.children.length) return;

	const out = glm.vec4.create();
	const mat = glm.mat4.create();

	node.children.forEach((c) => {
		calcBounds(c);
		glm.mat4.fromRotationTranslation(mat, c.rot, c.pos);
		for (let i = 0; i < 8; i++) {
			math.transformAABBVertex(out, c.bounds, mat, i);
			node.bounds.expand(out);
		}
	});
}