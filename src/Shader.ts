import * as glm from "gl-matrix";
import { Geometry } from "./Geometry";
import { Vertex } from "./Vertex";
import { Color } from "./Color";
import { Material } from "./Material";

export interface ShaderUniform {
	mv: glm.mat4;
	mvp: glm.mat4;
	material: Material;
	lightDir: glm.vec3;
	ambient: glm.vec4;
}

export interface Shader {
	uniform: ShaderUniform;
	vertex(geo: Geometry, vIdx: number, vtxOut: Vertex): void;
	fragment(vtx1: Vertex, vtx2: Vertex, vtx3: Vertex, bc: glm.vec3): number;
}
