
import * as glm from "gl-matrix";
import { AABBox } from "../AABBox";

export function calcOutCode(pos: glm.vec4): number {
	const x = pos[0];
	const y = pos[1];
	const z = pos[2];
	const w = pos[3];

	let code = 0;
	if (x < -w) code |= 0x01; else if (x > w) code |= 0x02;
	if (y < -w) code |= 0x04; else if (y > w) code |= 0x08;
	if (z < -w) code |= 0x10; else if (z > w) code |= 0x20;

	return code;
}

export function transformAABBVertex(out: glm.vec4, aabb: AABBox, mtrx: glm.mat4, nth: number): glm.vec4 {
	const dx = nth & 0x01 ? aabb.max[0] - aabb.min[0] : 0;
	const dy = nth & 0x02 ? aabb.max[1] - aabb.min[1] : 0;
	const dz = nth & 0x04 ? aabb.max[2] - aabb.min[2] : 0;

	glm.vec4.set(out, aabb.min[0] + dx, aabb.min[1] + dy, aabb.min[2] + dz, 1);
	glm.vec4.transformMat4(out, out, mtrx);

	return out;
}
