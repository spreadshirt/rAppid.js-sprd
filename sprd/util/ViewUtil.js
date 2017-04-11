define([], function() {

    return {
        surroundingRectOfViewMapsInView: function(view) {
            view = view || this.get('_view');

            if (!view) {
                return null
            }

            return this.surroundingRectForViewMaps(view.$.viewMaps.$items);
        },

        surroundingRectForViewMaps: function(viewMaps) {
            if (!viewMaps || !viewMaps.length) {
                return null;
            }

            var viewMapsRects = _.map(viewMaps, function(viewMap) {
                return {
                    x: viewMap.$.offset.$.x,
                    y: viewMap.$.offset.$.y,
                    width: viewMap.$.printArea.$._size.width,
                    height: viewMap.$.printArea.$._size.height
                }
            });

            return this.surroundingRect(viewMapsRects);
        },

        surroundingRect: function(rects) {
            if (!rects || !rects.length) {
                return null;
            }


            var smallestXRect = _.min(rects, function(rect) {
                return rect.x;
            });

            var smallestYRect = _.min(rects, function(rect) {
                return rect.y;
            });

            var biggestXRect = _.max(rects, function(rect) {
                return rect.x + rect.width;
            });

            var biggestYRect = _.max(rects, function(rect) {
                return rect.y + rect.height;
            });

            return {
                x: smallestXRect.x,
                y: smallestYRect.y,
                width: biggestXRect.x + biggestXRect.width - smallestXRect.x,
                height: biggestYRect.y + biggestXRect.height - smallestYRect.y
            }
        }
    }
});

