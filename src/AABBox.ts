import * as glm from "gl-matrix";

export class AABBox {
    min: glm.vec3;
    max: glm.vec3;

    constructor(vertices?: number[]) {
        this.calcBounds(vertices);
    }

    isEmpty(): boolean {
        return this.min[0] > this.max[0];
    }

    empty(): void {
        this.min = glm.vec3.fromValues(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
        this.max = glm.vec3.fromValues(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    }

    center(out: glm.vec3): glm.vec3 {
        glm.vec3.add(out, this.min, this.max);
        return glm.vec3.scale(out, out, 0.5);
    }

    expand(v: glm.vec3 | glm.vec4 | number[]): void {
        this._expands(v[0], v[1], v[2]);
    }

    calcBounds(vertices: number[]): void {
        this.empty();
        if (!vertices || !vertices.length) return;
        for (let i = 0; i < vertices.length; i += 3) {
            this._expands(vertices[i + 0], vertices[i + 1], vertices[i + 2]);
        }
    }

    private _expands(x: number, y: number, z: number): void {
        if (x < this.min[0]) this.min[0] = x;
        if (x > this.max[0]) this.max[0] = x;
        if (y < this.min[1]) this.min[1] = y;
        if (y > this.max[1]) this.max[1] = y;
        if (z < this.min[2]) this.min[2] = z;
        if (z > this.max[2]) this.max[2] = z;
    }
}