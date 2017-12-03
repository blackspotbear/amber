export class Color {
	r: number;
	g: number;
	b: number;
	a: number;


	set(r: number, g: number, b: number, a: number): void {
		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a ;
	}

	toHex(): number {
		return (this.r * 0xFF) << 24 | (this.g * 0xFF) << 16 | (this.b * 0xFF) << 8 | (this.a * 0xFF);
	}
}
