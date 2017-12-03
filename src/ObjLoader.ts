import * as glm from "gl-matrix";
import { Texture } from "./Texture";
import { FlatShader } from "./FlatShader";
import { Node } from "./Node";
import { Model } from "./Model";
import { Material } from "./Material";
import * as utils from "./Utils";

interface ObjMaterial {
	name: string;
	Ka?: number[];
	Kd?: number[];
	Ks?: number[];
	Tf?: number[];
	Ni?: number;
	d?: number;
	illum?: number;
	map_Ka?: string;
	map_Kd?: string;
	map_Ks?: string;
}

function parseMaterial(mtlText: string): ObjMaterial[] {
	const lines = mtlText.match(/[^\r\n]+/g);

	let material: ObjMaterial;
	const materials: ObjMaterial[] = [];
	lines.forEach((line) => {

		const elems = line.trim().split(/\s+/);
		if (elems[0] === "newmtl") {
			material = { name: elems[1] };
			materials.push(material);
		} else if (elems[0] === "Ka") {
			material.Ka = [ parseFloat(elems[1]), parseFloat(elems[2]), parseFloat(elems[3])];
		} else if (elems[0] === "Kd") {
			material.Kd = [ parseFloat(elems[1]), parseFloat(elems[2]), parseFloat(elems[3])];
		} else if (elems[0] === "Ks") {
			material.Ks = [ parseFloat(elems[1]), parseFloat(elems[2]), parseFloat(elems[3])];
		} else if (elems[0] === "Tf") {
			material.Tf = [ parseFloat(elems[1]), parseFloat(elems[2]), parseFloat(elems[3])];
		} else if (elems[0] === "Ni") {
			material.Ni = parseFloat(elems[1]);
		} else if (elems[0] === "d") {
			material.d = parseFloat(elems[1]);
		} else if (elems[0] === "illum") {
			material.illum = parseInt(elems[1], 10);
		} else if (elems[0] === "map_Ka") {
			material.map_Ka = elems[1];
		} else if (elems[0] === "map_Kd") {
			material.map_Kd = elems[1];
		} else if (elems[0] === "map_Ks") {
			material.map_Ks = elems[1];
		}
	});

	return materials;
}

export interface ObjResource {
	getTextureData(name: string): { width: number; height: number; rgba: Uint8ClampedArray};
	getMaterialText(name: string): string;
}

class ObjConverter {
	positions: number[];
	normals: number[];
	uvs: number[];
	mtls: {[key: string]: ObjMaterial};

	private vIdx: number;
	private vIndices: {[key: string]: number};

	constructor() {
		this.reset();
	}

	reset(): void {
		this.positions = [];
		this.normals = [];
		this.uvs = [];
		this.mtls = {};
	}

	convert(objText: string, resource: ObjResource): Node {
		const lines = objText.match(/[^\r\n]+/g);
		this.parseVertexMaterial(lines, resource);
		const node = this.createNode(lines, resource);
		utils.calcBounds(node);
		return node;
	}

	private parseVertexMaterial(lines: string[], resource: ObjResource): void {
		lines.forEach((line) => {
			const elems = line.split(/\s+/);
			if (elems[0] === "v") { // x, y, z
				Array.prototype.push.apply(this.positions, elems.slice(1, 4).map((e) => parseFloat(e)));
			} else if (elems[0] === "vt") { // u, v
				Array.prototype.push.apply(this.uvs, elems.slice(1, 3).map((e) => parseFloat(e)));
			} else if (elems[0] === "vn") { // nx, ny, nz
				Array.prototype.push.apply(this.normals, elems.slice(1, 4).map((e) => parseFloat(e)));
			} else if (elems[0] === "mtllib") {
				parseMaterial(resource.getMaterialText(elems[1])).forEach((m) => {
					this.mtls[m.name] = m;
				});
			}
		});
	}

	private createNode(lines: string[], resource: ObjResource): Node {
		const models: Model[] = [];

		lines.forEach((line) => {
			const elems = line.split(/\s+/);
			if (elems[0] === "usemtl") {
				models.push(this.createModel(elems[1], resource));
				this.clearVertexIndices();
			} else if (elems[0] === "f") {
				elems.shift();
				this.parseFace(elems, models[models.length - 1]);
			}
		});

		models.forEach((model) => model.bounds.calcBounds(model.geometry.vertexBuffer));

		if (models.length >= 2) {
			const root = new Node();
			root.children = models;
			return root;
		} else {
			return models[0];
		}
	}

	private createModel(materialName: string, resource: ObjResource): Model {
		const model = new Model(new FlatShader());
		const objMtl = this.mtls[materialName];

		if (! objMtl) {
			console.log("material not found, " + materialName);
			glm.vec4.copy(model.material.ambient, [1, 1, 1, 1]);
			glm.vec4.copy(model.material.diffuse, [1, 1, 1, 1]);
			glm.vec4.copy(model.material.specular, [1, 1, 1, 1]);
		} else {
			if (objMtl.illum === 4) {
				glm.vec4.set(model.material.ambient, 1, 1, 1, 1);
				glm.vec4.set(model.material.diffuse, 1, 1, 1, 1);
				glm.vec4.set(model.material.specular, 1, 1, 1, 1);
			} else {
				glm.vec4.copy(model.material.ambient, objMtl.Ka ?
					[objMtl.Ka[0], objMtl.Ka[1], objMtl.Ka[2], 1] :
					[1, 1, 1, 1]
				);
				glm.vec4.copy(model.material.diffuse, objMtl.Kd ?
					[objMtl.Kd[0], objMtl.Kd[1], objMtl.Kd[2], 1] :
					[1, 1, 1, 1]
				);
				glm.vec4.copy(model.material.specular, objMtl.Ks ?
					[objMtl.Ks[0], objMtl.Ks[1], objMtl.Ks[2], 1] :
					[1, 1, 1, 1]
				);
			}
		}

		if (objMtl.map_Kd) {
			const data = resource.getTextureData(objMtl.map_Kd);
			model.material.texture = new Texture(data.rgba, data.width, data.height);
		}

		model.geometry.indexBuffer = [];
		if (this.positions.length) model.geometry.vertexBuffer = [];
		if (this.normals.length) model.geometry.normBuffer = [];
		if (this.uvs.length) model.geometry.uvBuffer = [];

		return model;
	}

	private parseFace(elems: string[], model: Model): void {

		// see: http://paulbourke.net/dataformats/obj/
		//
		// 1.	Square
		//
		// This example shows a square that measures two units on each side and
		// faces in the positive direction (toward the camera).  Note that the
		// ordering of the vertices is counterclockwise. This ordering determines
		// that the square is facing forward.
		//
		// 	v 0.000000 2.000000 0.000000
		// 	v 0.000000 0.000000 0.000000
		// 	v 2.000000 0.000000 0.000000
		// 	v 2.000000 2.000000 0.000000
		// 	f 1 2 3 4
		//
		if (elems.length >= 4) { // square, ccw
			for (let i = 3; i < elems.length; i += 3) {
				elems.splice(i, 0, elems[0], elems[i - 1]);
			}
		}

		elems.forEach((e) => {
			if (this.vIndices[e] === undefined) {
				const indices = e.split("/").map((e) => parseInt(e, 10));
				const v  = indices[0] - 1;
				const vt = indices[1] ? indices[1] - 1 : null;
				const vn = indices[2] ? indices[2] - 1 : null;

				model.geometry.vertexBuffer.push(this.positions[v * 3 + 0]);
				model.geometry.vertexBuffer.push(this.positions[v * 3 + 1]);
				model.geometry.vertexBuffer.push(this.positions[v * 3 + 2]);

				if (vt !== null) {
					model.geometry.uvBuffer.push(this.uvs[vt * 2 + 0]);
					model.geometry.uvBuffer.push(this.uvs[vt * 2 + 1]);
				}

				if (vn !== null) {
					model.geometry.normBuffer.push(this.normals[vn * 3 + 0]);
					model.geometry.normBuffer.push(this.normals[vn * 3 + 1]);
					model.geometry.normBuffer.push(this.normals[vn * 3 + 2]);
				}

				this.vIndices[e] = this.vIdx++;
			}
			model.geometry.indexBuffer.push(this.vIndices[e]);
		});
	}

	private clearVertexIndices(): void {
		this.vIdx = 0;
		this.vIndices = {};
	}
}

export function loadSceneGraphFromObj(objText: string, resource: ObjResource): Node {
	return (new ObjConverter()).convert(objText, resource);
}
