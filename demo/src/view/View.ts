import * as abr from "amber";

export interface View {
	reset(): void;
	update(): boolean;
	draw(traverser: abr.Traverser, renderer: abr.Renderer): void;
	onPointUp(pos: g.CommonOffset): void;
	onPointDown(pos: g.CommonOffset): void;
	onPointMove(pos: g.CommonOffset): void;
}

