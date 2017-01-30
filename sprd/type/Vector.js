define(['js/core/Base'], function (Base) {

    var Vector = Base.inherit('sprd.type.Vector', {
        ctor: function(components) {
            this.components = components || [0, 0, 0];
        },

        distance: function() {
            return Vector.distance(this);
        },

        multiply: function(s) {
            if (s instanceof Vector) {
                return Vector.scalarProduct(this, s);
            } else {
                return Vector.multiply(this, s);
            }
        },

        vectorProduct: function(vector) {
            return Vector.vectorProduct(this, vector);
        },

        subtract: function(vector) {
            return Vector.subtract(this, vector);
        },

        add: function(vector) {
            return Vector.add(this, vector);
        },

        getX: function() {
            return this.components[0];
        },

        getY: function() {
            return this.components[1];
        },

        getZ: function() {
            return this.components[2];
        }
    }, {
        distance: function(vector) {
            vector = Vector.getComponents(vector);

            var sum = 0;
            for (var i = 0; i < vector.length; i++) {
                sum += (vector[i] || 0) * (vector[i] || 0);
            }

            return Math.sqrt(sum);
        },

        subtract: function(vector1, vector2) {
            vector1 = Vector.getComponents(vector1);
            vector2 = Vector.getComponents(vector2);

            var length = Math.max(vector1.length, vector2.length),
                ret = [];

            for (var i = 0; i < length; i++) {
                ret.push((vector1[i] || 0) - (vector2[i] || 0));
            }

            return new Vector(ret);
        },

        add: function(vector1, vector2) {
            return Vector.subtract(vector1, Vector.multiply(vector2, -1));
        },

        multiply: function(vector, scalar) {
            var ret = Vector.clone(vector),
                components = Vector.getComponents(vector);

            for (var i = 0; i < components.length; i++) {
                components[i] = components[i] * scalar;
            }

            return ret;
        },

        clone: function(vector) {
            if (vector instanceof Vector) {
                return new Vector(vector.components.slice());
            }

            return vector.components.slice();
        },

        scalarProduct: function(vector1, vector2) {
            vector1 = Vector.getComponents(vector1);
            vector2 = Vector.getComponents(vector2);

            return vector1[0] * vector2[0] +
                vector1[1] * vector2[1] +
                (vector1[2] || 0) * (vector1[2] || 0)

        },

        vectorProduct: function(a, b) {
            a = Vector.getComponents(a);
            b = Vector.getComponents(b);

            return new Vector([
                a[1] * b[2] - a[2] * b[1],
                a[2] * b[0] - a[0] * b[2],
                a[0] * b[1] - a[1] * b[0]
            ]);
        },

        getComponents: function(vector) {
            if (vector instanceof Vector) {
                return vector.components;
            }

            return vector;
        }
    });

    return Vector;
});