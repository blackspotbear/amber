import * as glm from "gl-matrix";
import { Color } from "../Color";
import { Material } from "../Material";

export function createFaceColor(n: glm.vec4, material: Material, lightDir: glm.vec3, ambient: glm.vec4): Color {
	const color = new Color();

	color.r = material.ambient[0] * ambient[0];
	color.g = material.ambient[1] * ambient[1];
	color.b = material.ambient[2] * ambient[2];
	color.a = material.ambient[3] * ambient[3];

	const intensity = glm.vec3.dot(lightDir, [n[0], n[1], n[2]]);
	if (intensity > 0) {
		color.r += intensity * material.diffuse[0];
		color.g += intensity * material.diffuse[1];
		color.b += intensity * material.diffuse[2];
		color.a += intensity * material.diffuse[3];
		color.r = Math.max(Math.min(color.r, 1), 0);
		color.g = Math.max(Math.min(color.g, 1), 0);
		color.b = Math.max(Math.min(color.b, 1), 0);
		color.a = Math.max(Math.min(color.a, 1), 0);
	}

	return color;
}
