var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("sprd.data.SprdModel", ["js.data.Model"], function (Model) {
        return Model.inherit({
        });
    })
});