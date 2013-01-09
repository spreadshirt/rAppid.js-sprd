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

        subtract: function(vector) {
            return Vector.subtract(this, vector);
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