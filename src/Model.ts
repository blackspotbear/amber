import * as glm from "gl-matrix";
import { Node } from "./Node";
import { Geometry } from "./Geometry";
import { Material } from "./Material";
import { Shader } from "./Shader";
import { Renderer } from "./Renderer";
import { AABBox } from "./AABBox";

export class Model extends Node {
	material: Material;
	geometry: Geometry;

	private prevMaterial: Material;

	constructor(shader: Shader) {
		super();
		this.geometry = new Geometry();
		this.material = new Material(shader);
		this.bounds = new AABBox();
	}

	begin(renderer: Renderer): void {
		super.begin(renderer);
		this.prevMaterial = renderer.material;
		renderer.material = this.material;
	}

	draw(renderer: Renderer): void {
		renderer.material = this.material;
		renderer.drawPrimitives(this.geometry);
	}

	end(renderer: Renderer): void {
		renderer.material = this.prevMaterial;
		super.end(renderer);
	}
}
