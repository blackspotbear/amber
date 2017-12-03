import * as glm from "gl-matrix";
import { Node } from "./Node";
import { Model } from "./Model";
import { FlatShader } from "./FlatShader";
import * as utils from "./Utils";

function findByUUID(arr: any, uuid: string): any {
	for (let i = 0; i < arr.length; i++) {
		const obj = arr[i];
		if (obj.uuid === uuid) {
			return obj;
		}
	}
	return null;
}

function findGeometry(data: any, uuid: string): any {
	return findByUUID(data.geometries, uuid);
}

function findMaterial(data: any, uuid: string): any {
	return findByUUID(data.materials, uuid);
}

function createNode(obj: any, data: any): Node {
	const node = new Node();
	glm.quat.identity(node.rot);
	return node;
}

function createModel(obj: any, data: any): Model {
	const model = new Model(new FlatShader());

	glm.quat.identity(model.rot);

	const geo = findGeometry(data, obj.geometry);

	model.geometry.indexBuffer = [];
	for (let i = 0; i < geo.data.index.array.length; i++) {
		model.geometry.indexBuffer.push(geo.data.index.array[i]);
	}

	model.geometry.vertexBuffer = [];
	model.geometry.normBuffer = [];
	for (let i = 0; i < geo.data.attributes.position.array.length; i += 3) {
		model.geometry.vertexBuffer.push(geo.data.attributes.position.array[i]);
		model.geometry.vertexBuffer.push(geo.data.attributes.position.array[i + 1]);
		model.geometry.vertexBuffer.push(geo.data.attributes.position.array[i + 2]);
		model.geometry.normBuffer.push(geo.data.attributes.normal.array[i]);
		model.geometry.normBuffer.push(geo.data.attributes.normal.array[i + 1]);
		model.geometry.normBuffer.push(geo.data.attributes.normal.array[i + 2]);
	}

	const mat = findMaterial(data, obj.material);
	model.material.diffuse[0] = ((mat.color >> 16) & 0xFF) / 0xFF;
	model.material.diffuse[1] = ((mat.color >>  8) & 0xFF) / 0xFF;
	model.material.diffuse[2] = ((mat.color >>  0) & 0xFF) / 0xFF;
	model.material.diffuse[3] = 1.0;
	glm.vec4.copy(model.material.ambient, model.material.diffuse);

	model.bounds.calcBounds(model.geometry.vertexBuffer);

	return model;
}

function parseObjectTree(obj: any, data: any): Node {
	let node: Node;

	switch (obj.type) {
		case "Scene": node = createNode(obj, data); break;
		case "Mesh": node = createModel(obj, data); break;
	}
	node.name = obj.name;

	if (obj.children) {
		for (let i = 0; i < obj.children.length; i++) {
			node.children.push(parseObjectTree(obj.children[i], data));
		}
	}

	return node;
}

export function loadSceneGraphFromJSON(jsonText: string): Node {
	const data = JSON.parse(jsonText);

	const node = parseObjectTree(data.object, data);

	utils.calcBounds(node);

	return node;
}
