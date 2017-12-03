import * as glm from "gl-matrix";
import { Shader } from "./Shader";
import { Texture } from "./Texture";

export class Material {
	shader: Shader;
	ambient: glm.vec4;
	diffuse: glm.vec4;
	specular: glm.vec4;
	texture: Texture;

	constructor(shader: Shader) {
		this.shader = shader;
		this.ambient = glm.vec4.create();
		this.diffuse = glm.vec4.create();
		this.specular = glm.vec4.create();
		this.texture = null;
	}
}
