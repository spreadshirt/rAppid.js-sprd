define(["sprd/model/VectorMask", "sprd/model/PixelMask"], function(VectorMask, PixelMask) {
    return function(baseUrl) {
        return {
            masks: [
                new VectorMask({
                    name: "Heart",
                    vector: baseUrl("sprd/img/masks/heart.svg"),
                    id: 1
                }),
                new VectorMask({
                    name: "Circle",
                    vector: baseUrl("sprd/img/masks/circle_black.svg"),
                    id: 2
                }),
                new VectorMask({
                    name: "Ellipse",
                    vector: baseUrl("sprd/img/masks/ellipse_black.svg"),
                    id: 3
                }),
                new VectorMask({
                    name: "Triangle Rounded",
                    vector: baseUrl("sprd/img/masks/triangle_rounded_black.svg"),
                    id: 4
                }),
                // new VectorMask({
                //     name: "Line",
                //     vector: baseUrl("sprd/img/masks/line_black.svg"),
                //     id: 5
                // }),
                new VectorMask({
                    name: "Rectangle #1",
                    vector: baseUrl("sprd/img/masks/rectangle_1_black.svg"),
                    id: 6
                }),
                new VectorMask({
                    name: "Rectangle #2",
                    vector: baseUrl("sprd/img/masks/rectangle_2_black.svg"),
                    id: 7
                }),
                new VectorMask({
                    name: "Trapezium",
                    vector: baseUrl("sprd/img/masks/trapezium_black.svg"),
                    id: 8
                }),
                new VectorMask({
                    name: "S",
                    vector: baseUrl("sprd/img/masks/SlikeSusi_black.svg"),
                    id: 9
                }),
                new VectorMask({
                    name: "A",
                    vector: baseUrl("sprd/img/masks/AlikeAnton_black.svg"),
                    id: 10
                }),
                new VectorMask({
                    name: "Star",
                    vector: baseUrl("sprd/img/masks/starrounded_black.svg"),
                    id: 11
                }),
                new VectorMask({
                    name: "Karo",
                    vector: baseUrl("sprd/img/masks/karo_black.svg"),
                    id: 12
                }),
                new VectorMask({
                    name: "It's complicated",
                    vector: baseUrl("sprd/img/masks/its_complicated_black.svg"),
                    id: 13
                }),
                new VectorMask({
                    name: "Polygon",
                    vector: baseUrl("sprd/img/masks/polygon_black.svg"),
                    id: 14
                }),
                new PixelMask({
                    name: "Kreuz",
                    image: baseUrl("sprd/img/masks/kreuz_black.png"),
                    id: 15
                }),
                new VectorMask({
                    name: "Rouneded Square",
                    vector: baseUrl("sprd/img/masks/roundedsquare_black.svg"),
                    id: 16
                }),
                new VectorMask({
                    name: "Rounded",
                    image: baseUrl("sprd/img/masks/rounded_black.svg"),
                    id: 17
                }),
                new PixelMask({
                    name: "Kreis",
                    image: baseUrl("sprd/img/masks/02-kreis.png"),
                    id: 17
                }),
                new PixelMask({
                    name: "Große Kreuz",
                    image: baseUrl("sprd/img/masks/03-grosses-kreuz.png"),
                    id: 18
                }),
                new PixelMask({
                    name: "Rand",
                    image: baseUrl("sprd/img/masks/04-Rand.png"),
                    id: 19
                })

            ]
            // ,
            // frames: [
            //     new Frame({
            //         name: "GrungeFrame",
            //         image: "sprd/img/masks/grunge-frame-2.png"
            //     })]
        }
    }
});