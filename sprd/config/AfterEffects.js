define(["sprd/model/VectorMask", "sprd/model/PixelMask", "underscore"], function(VectorMask, PixelMask, _) {
    return function(baseUrl) {
        var masks = [
            new VectorMask({
                name: "Heart",
                vector: baseUrl("sprd/img/masks/heart.svg"),
                id: 12,
                fixedAspectRatio: true
            }),
            new VectorMask({
                name: "Circle",
                vector: baseUrl("sprd/img/masks/circle_black.svg"),
                id: 8,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "Ellipse",
                vector: baseUrl("sprd/img/masks/ellipse_black.svg"),
                id: 9,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "Triangle Rounded",
                vector: baseUrl("sprd/img/masks/triangle_rounded_black.svg"),
                id: 3,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "Rectangle #1",
                vector: baseUrl("sprd/img/masks/rectangle_1_black.svg"),
                id: 2,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "Rectangle #2",
                vector: baseUrl("sprd/img/masks/rectangle_2_black.svg"),
                id: 3,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "Trapezium",
                vector: baseUrl("sprd/img/masks/trapezium_black.svg"),
                id: 7,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "S",
                vector: baseUrl("sprd/img/masks/SlikeSusi_black.svg"),
                id: 9,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "A",
                vector: baseUrl("sprd/img/masks/AlikeAnton_black.svg"),
                id: 13,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "Star",
                vector: baseUrl("sprd/img/masks/starrounded_black.svg"),
                id: 10,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "Karo",
                vector: baseUrl("sprd/img/masks/karo_black.svg"),
                id: 6,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "It's complicated",
                vector: baseUrl("sprd/img/masks/its_complicated_black.svg"),
                id: 14,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "Polygon",
                vector: baseUrl("sprd/img/masks/polygon_black.svg"),
                id: 5,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "Rounded Square",
                vector: baseUrl("sprd/img/masks/roundedsquare_black.svg"),
                id: 1,
                fixedAspectRatio: false
            }),
            new VectorMask({
                name: "Rounded",
                vector: baseUrl("sprd/img/masks/rounded_black.svg"),
                id: 11,
                fixedAspectRatio: false
            }),
            new PixelMask({
                name: "Große Kreuz",
                image: baseUrl("sprd/img/masks/03-grosses-kreuz.png"),
                id: 15
            }),
            new PixelMask({
                name: "Rand",
                image: baseUrl("sprd/img/masks/04-Rand.png"),
                id: 17
            })
        ];

        return {
            masks: _.sortBy(masks, function(mask) {
                return mask.$.id;
            })
        }
    }
});