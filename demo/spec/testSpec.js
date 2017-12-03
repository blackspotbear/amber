// NOTE: スクリプトアセットとして実行される環境をエミュレーションするためにglobal.gを生成する
global.g = require("@akashic/akashic-engine");

describe("mainScene", function() {
	beforeEach(function() {
	});

	afterEach(function() {
	});

	it("example", function() {
		expect(g).not.toBe(undefined);
	});
});
