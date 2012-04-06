var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("sprd.model.Basket", ["sprd.data.SprdModel"], function (SprdModel) {
        return SprdModel.inherit({
        });
    })
});