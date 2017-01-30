define(['js/core/Base', 'sprd/type/Vector'], function(Base, Vector) {

    var Line = Base.inherit('sprd.type.Line', {
        ctor: function(x, y, rot) {
            this.x = x;
            this.y = y;
            this.vector = new Vector([x, y]);
            this.rot = rot % Math.PI;
        },

        project: function(x, y) {
            var passedVector = new Vector([x, y]),
                differenceVector = passedVector.subtract(this.vector),
                helpVector = this.getPointOnLine(1).subtract(this.vector);

            var scalar = differenceVector.multiply(helpVector) / helpVector.distance();
            return this.getPointOnLine(scalar);
        },

        getSlope: function() {
            return this.floatEqual(this.rot, Math.PI / 2) ? Number.POSITIVE_INFINITY : Math.tan(this.rot);
        },

        isInfinite: function(val) {
            return val == Number.NEGATIVE_INFINITY || val == Number.POSITIVE_INFINITY;
        },

        getPointOnLine: function(scalar) {
            var slope = this.getSlope(),
                pointX = this.x + (this.isInfinite(slope) ? 0 : scalar),
                pointY = this.y + (this.isInfinite(slope) ? scalar : this.getSlope() * scalar);

            return new Vector([pointX, pointY]);
        },

        getSvgLine: function(length) {
            var firstPoint = this.getPointOnLine(-length / 2);
            var secondPoint = this.getPointOnLine(length / 2);
            return {
                x1: firstPoint.components[0],
                x2: secondPoint.components[0],
                y1: firstPoint.components[1],
                y2: secondPoint.components[1]
            }
        },

        containsPoint: function(x, y) {
            if (x == this.x && y == this.y) {
                return true;
            }

            var projectedVector = this.project(x, y);
            return this.floatEqual(projectedVector.components[0], x) && this.floatEqual(projectedVector.components[1], y);
        },

        equals: function(line) {
            if (!(line instanceof Line)) return false;
            if (this.rot != line.rot) return false;

            return this.containsPoint(line.x, line.y);
        },

        floatEqual: function(a, b) {
            var epsilon = Math.pow(10, -10);
            return Math.abs(a - b) < epsilon;
        }
    });

    return Line;
});