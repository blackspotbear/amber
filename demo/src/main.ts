import * as glm from "gl-matrix";
import * as abr from "amber";
import * as a3d from "./a3d";
import * as view from "./view";

function main(param: g.GameMainParameterObject): void {
	const scene = new g.Scene({game: g.game, assetIds: [
		// Obj, Material, Texture
		"Airplane_01",     "Airplane_01_mtl",
		"Chicken_01",      "Chicken_01_mtl",
		"CliffSwallow",    "CliffSwallow_mtl",    "CliffSwallow_BaseColor",
		"Dolphin_01",      "Dolphin_01_mtl",
		"Hippopotamus",    "Hippopotamus_mtl",    "Hippopotamus_BaseColor",
		"Ice_Cream_01",    "Ice_Cream_01_mtl",
		"Kangaroo_01",     "Kangaroo_01_mtl",
		"Lobster_01",      "Lobster_01_mtl",
		"RocketShip_1393", "RocketShip_1393_mtl",
		"Tugboat_1362",    "Tugboat_1362_mtl",
		"bacon",           "bacon_mtl",           "baconTxt",
		"cracker",         "cracker_mtl",         "crackerTxt",
		"duck",            "duck_mtl",
		"pizza",           "pizza_mtl",           "pizzaTxt",

		// Three.js' ASCII JSON
		"plane",
		"rect",
		"world"
	]});

	scene.loaded.add(() => {
		const resource: abr.ObjResource = {
			getMaterialText: (name: string) => (scene.assets[name.replace(/\./g, "_")] as g.TextAsset).data,
			getTextureData: (name: string) => {
				const imageAsset = scene.assets[name.match(/(.*)(?:\.([^.]+$))/)[1]] as g.ImageAsset;

				const surface = g.game.resourceFactory.createSurface(imageAsset.width, imageAsset.height);
				// tslint:disable-next-line:no-shadowed-variable
				const renderer = surface.renderer();
				renderer.begin();
				renderer.transform([1, 0, 0, -1, 0, imageAsset.height]);
				renderer.drawImage(imageAsset.asSurface(), 0, 0, imageAsset.width, imageAsset.height, 0, 0);
				renderer.end();

				const imageData = renderer._getImageData(0, 0, imageAsset.width, imageAsset.height);
				return { rgba: imageData.data, width: imageData.width, height: imageData.height };
			}
		};

		const targetModels = [
			abr.loadSceneGraphFromObj((scene.assets["bacon"] as g.TextAsset).data, resource),
			abr.loadSceneGraphFromObj((scene.assets["cracker"] as g.TextAsset).data, resource),
			abr.loadSceneGraphFromObj((scene.assets["Airplane_01"] as g.TextAsset).data, resource),
			abr.loadSceneGraphFromObj((scene.assets["Chicken_01"] as g.TextAsset).data, resource),
			abr.loadSceneGraphFromObj((scene.assets["CliffSwallow"] as g.TextAsset).data, resource),
			abr.loadSceneGraphFromObj((scene.assets["Dolphin_01"] as g.TextAsset).data, resource),
			abr.loadSceneGraphFromObj((scene.assets["Hippopotamus"] as g.TextAsset).data, resource),
			abr.loadSceneGraphFromObj((scene.assets["Ice_Cream_01"] as g.TextAsset).data, resource),
			abr.loadSceneGraphFromObj((scene.assets["Kangaroo_01"] as g.TextAsset).data, resource),
			abr.loadSceneGraphFromObj((scene.assets["Lobster_01"] as g.TextAsset).data, resource),
			abr.loadSceneGraphFromObj((scene.assets["RocketShip_1393"] as g.TextAsset).data, resource),
			abr.loadSceneGraphFromObj((scene.assets["Tugboat_1362"] as g.TextAsset).data, resource)
		];
		const airPlaneModel = abr.loadSceneGraphFromJSON((scene.assets["plane"] as g.TextAsset).data);
		glm.quat.fromEuler(airPlaneModel.rot, 0, 90, 90);
		const worldModel = abr.loadSceneGraphFromJSON((scene.assets["world"] as g.TextAsset).data);

		const pixelSize = 4;
		const frameBuffer = new a3d.FrameBuffer({
			scene: scene,
			width: 128 * pixelSize,
			height: 128 * pixelSize,
			pixelSize: pixelSize
		});
		const renderer = new abr.Renderer({
			frameBuffer: frameBuffer,
			clearColor: 0x87CEFAFF
		});
		glm.vec4.set(renderer.ambient, 0.25, 0.25, 0.25, 1.0);
		const traverser = new abr.Traverser();

		let viewIdx = 0;
		const views: view.View[] = [
			new view.AirPlaneView(airPlaneModel, worldModel),
			new view.PolyView(targetModels)
		];

		scene.pointDownCapture.add((e: g.PointDownEvent) => views[viewIdx].onPointDown(e.point));
		scene.pointUpCapture.add((e: g.PointUpEvent) => views[viewIdx].onPointUp(e.point));
		scene.pointMoveCapture.add((e: g.PointMoveEvent) => views[viewIdx].onPointMove(e.point));

		scene.update.add(() => {
			const aView = views[viewIdx];

			const exit = aView.update();
			renderer.clear();
			aView.draw(traverser, renderer);

			frameBuffer.modified();

			if (exit) {
				viewIdx++;
				viewIdx %= views.length;
				aView.reset();
			}
		});

		scene.append(frameBuffer);
	});

	g.game.pushScene(scene);
}

export = main;
