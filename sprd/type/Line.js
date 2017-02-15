define(['js/core/Base', 'sprd/type/Vector', "sprd/extensions/Number"], function(Base, Vector, extension) {

    var Line = Base.inherit('sprd.type.Line', {
        ctor: function(x, y, angle) {
            this.x = x;
            this.y = y;
            this.vector = new Vector([x, y]);
            this.angle = angle % Math.PI;
        },

        project: function(x, y) {
            var passedVector = new Vector([x, y]),
                differenceVector = passedVector.subtract(this.vector),
                helpVector = this.getPointOnLine(1).subtract(this.vector);

            var scalar = differenceVector.multiply(helpVector) / helpVector.distance();
            return this.getPointOnLine(scalar);
        },

        getSlope: function() {
            return this.angle.equals(Math.PI / 2) ? Number.POSITIVE_INFINITY : Math.tan(this.angle);
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
                x1: firstPoint.getX(),
                x2: secondPoint.getX(),
                y1: firstPoint.getY(),
                y2: secondPoint.getY()
            }
        },

        containsPoint: function(x, y) {
            if (x == this.x && y == this.y) {
                return true;
            }

            var projectedVector = this.project(x, y);
            return x.equals(projectedVector.getX()) && y.equals(projectedVector.getY());
        },

        difference: function(line) {
            if (!this.isParallelTo(line)) {
                throw new Error("Lines are not parallel");
            }

            return this.project(line.x, line.y).subtract(line.vector);
        },

        isParallelTo: function(line) {
            return this.angle.equals(line.angle);
        },

        isPerpendicular: function(line) {
            return this.angle.equals(line.angle + Math.PI / 2);
        },

        equals: function(line) {
            if (!(line instanceof Line)) return false;
            if (!this.angle.equals(line.angle)) return false;

            return this.containsPoint(line.x, line.y);
        }
    });

    return Line;
});