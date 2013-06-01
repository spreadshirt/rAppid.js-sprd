define(["js/core/Base"], function (Base) {

    var Matrix2d = Base.inherit("sprd.type.Matrix2d", {
        ctor: function (components) {
            this.components = components || [
                1, 0, 0,
                0, 1, 0,
                0, 0, 1];
        },

        translate: function (x, y) {
            return this.multiply([
                1, 0, x,
                0, 1, y,
                0, 0, 1]);
        },

        scale: function (x, y) {
            return this.multiply([
                x, 0, 0,
                0, y, 0,
                0, 0, 1]);
        },

        rotate: function (rad) {
            return this.multiply([
                Math.cos(rad), -Math.sin(rad), 0,
                Math.sin(rad), Math.cos(rad), 0,
                0, 0, 1]);
        },

        rotateDeg: function (deg) {
            return this.rotate(Math.PI * deg / 180);
        },

        multiply: function (matrix) {
            return Matrix2d.multiply(this, matrix);
        },

        transformPoint: function (point) {

            var args = Array.prototype.slice.call(arguments);
            if (args.length > 1) {
                point = [args[0], args[1], args[2] || 1];
            } else if (point instanceof Array) {
                point = [point[0], point[1], point[2] || 1];
            } else if (point instanceof Object) {
                point = [point.x, point.y, 1];
            } else {
                throw new Error("unknown point format");
            }

            var a = this.components;
            var a00 = a[0], a01 = a[1], a02 = a[2],
                a10 = a[3], a11 = a[4], a12 = a[5],
                a20 = a[6], a21 = a[7], a22 = a[8],
                x = point[0], y = point[1], z = point[2];

            return [
                a00 * x + a01 * y + a02 * z,
                a10 * x + a11 * y + a12 * z,
                a20 * x + a21 * y + a22 * z
            ];
        },

        clone: function () {
            return new Matrix2d(this.components);
        }
    }, {

        getComponents: function (matrix) {
            return matrix instanceof Matrix2d ? matrix.components : matrix;
        },

        multiply: function (a, b) {
            a = Matrix2d.getComponents(a);
            b = Matrix2d.getComponents(b);

            var a00 = a[0], a01 = a[1], a02 = a[2],
                a10 = a[3], a11 = a[4], a12 = a[5],
                a20 = a[6], a21 = a[7], a22 = a[8],

                b00 = b[0], b01 = b[1], b02 = b[2],
                b10 = b[3], b11 = b[4], b12 = b[5],
                b20 = b[6], b21 = b[7], b22 = b[8];

            return new Matrix2d([
                b00 * a00 + b01 * a10 + b02 * a20,
                b00 * a01 + b01 * a11 + b02 * a21,
                b00 * a02 + b01 * a12 + b02 * a22,

                b10 * a00 + b11 * a10 + b12 * a20,
                b10 * a01 + b11 * a11 + b12 * a21,
                b10 * a02 + b11 * a12 + b12 * a22,

                b20 * a00 + b21 * a10 + b22 * a20,
                b20 * a01 + b21 * a11 + b22 * a21,
                b20 * a02 + b21 * a12 + b22 * a22
            ]);
        }
    });

    return Matrix2d;
});