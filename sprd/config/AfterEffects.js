define(["sprd/model/VectorMask", "sprd/model/PixelMask"], function(VectorMask, PixelMask) {
    return function(baseUrl) {
        return {
            masks: [
                new VectorMask({
                    name: "Heart",
                    vector: baseUrl("sprd/img/masks/heart.svg"),
                    preview: baseUrl("sprd/img/masks/previews/12_heart.png"),
                    id: 12
                }),
                new VectorMask({
                    name: "Circle",
                    vector: baseUrl("sprd/img/masks/circle_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/08_circle.png"),
                    id: 8
                }),
                new VectorMask({
                    name: "Ellipse",
                    vector: baseUrl("sprd/img/masks/ellipse_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/09_ellipse.png"),
                    id: 9
                }),
                new VectorMask({
                    name: "Triangle Rounded",
                    vector: baseUrl("sprd/img/masks/triangle_rounded_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/04_triangle_rounded.png"),
                    id: 3
                }),
                // new VectorMask({
                //     name: "Line",
                //     vector: baseUrl("sprd/img/masks/line_black.svg"),
                //     id: 5
                // }),
                new VectorMask({
                    name: "Rectangle #1",
                    vector: baseUrl("sprd/img/masks/rectangle_1_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/02_ rectangle_1.png"),
                    id: 2
                }),
                new VectorMask({
                    name: "Rectangle #2",
                    vector: baseUrl("sprd/img/masks/rectangle_2_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/03_rectangle_2.png"),
                    id: 3
                }),
                new VectorMask({
                    name: "Trapezium",
                    vector: baseUrl("sprd/img/masks/trapezium_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/07_trapezium.png"),
                    id: 7
                }),
                new VectorMask({
                    name: "S",
                    vector: baseUrl("sprd/img/masks/SlikeSusi_black.svg"),
                    id: 9
                }),
                new VectorMask({
                    name: "A",
                    vector: baseUrl("sprd/img/masks/AlikeAnton_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/13_AlikeAnton.png"),
                    id: 13
                }),
                new VectorMask({
                    name: "Star",
                    vector: baseUrl("sprd/img/masks/starrounded_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/10_starrounded.png"),
                    id: 10
                }),
                new VectorMask({
                    name: "Karo",
                    vector: baseUrl("sprd/img/masks/karo_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/06_karo.png"),
                    id: 6
                }),
                new VectorMask({
                    name: "It's complicated",
                    vector: baseUrl("sprd/img/masks/its_complicated_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/14_itscomlicated.png"),
                    id: 14
                }),
                new VectorMask({
                    name: "Polygon",
                    vector: baseUrl("sprd/img/masks/polygon_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/05_polygon.png"),
                    id: 5
                }),
                new VectorMask({
                    name: "Rounded Square",
                    vector: baseUrl("sprd/img/masks/roundedsquare_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/01_roundedsquare.png"),
                    id: 1
                }),
                new VectorMask({
                    name: "Rounded",
                    image: baseUrl("sprd/img/masks/rounded_black.svg"),
                    preview: baseUrl("sprd/img/masks/previews/11_rounded.png"),
                    id: 11
                }),
                new PixelMask({
                    name: "Große Kreuz",
                    image: baseUrl("sprd/img/masks/03-grosses-kreuz.png"),
                    preview: baseUrl("sprd/img/masks/previews/15-cross.png"),
                    id: 15
                }),
                new PixelMask({
                    name: "Rand",
                    image: baseUrl("sprd/img/masks/04-Rand.png"),
                    preview: baseUrl("sprd/img/masks/previews/17_marker01.png"),
                    id: 17
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