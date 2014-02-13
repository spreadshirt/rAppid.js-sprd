define(["js/core/Component", "require", "flow", "underscore", "sprd/model/User"], function (Component, require, flow, _, User) {

    // necessary dependency
    var U = User;

    return Component.inherit("sprd.manager.VirtualProductManager", {

        defaults: {
            context: null,

            platform: "EU"
        },

        /***
         * initialized the vp lib
         * @param callback
         */
        initializeVPLib: function (callback) {

            if (!this.$.context) {
                callback && callback(new Error("No context given"));
                return;
            }

            this.synchronizeFunctionCall(this._initializeVPLib, "initializeVPLib", callback, this);
        },

        _initializeVPLib: function (callback) {

            var self = this;

            flow()
                .seq(function(cb) {
                    self.$.context.fetch(cb);
                })
                .par({
                    loadVPLib: function (cb) {
                        var loadComplete = "onSprdLoad",
                            originalSprdLoad = window[loadComplete];

                        window[loadComplete] = function () {
                            try {
                                // invoke original onSprdLoad
                                originalSprdLoad && originalSprdLoad.apply(this, Array.prototype.slice.call(arguments))
                            } catch (e) {
                            }

                            window[loadComplete] = originalSprdLoad;

                            cb();
                        };

                        require(["/vplib/vplib.nocache.js"], function () {
                            // complete will be called via onSprdLoad

                                var vpLib = window.vplib;
                                if (vpLib) {
                                    vpLib.onInjectionDone('vplib');
                                } else {
                                    cb(new Error("vplib not found"));
                                }

                        }, cb);

                    },
                    printTypes: function (cb) {
                        self.$.context.getCollection("printTypes").fetch({
                            fullData: true
                        }, cb);
                    }
                })
                .seq("vpCreator", function () {

                    var printTypes = _.map(this.vars.printTypes.$items, function(printType) {
                        return printType.$context.$dataSource.composeModel(printType);
                    });

                    return window["sprd"].getVPCreator(
                        (self.$.platform || "EU").toLowerCase(),
                        null,
                        null,
                        null,
                        printTypes,
                        null);
                })
                .exec(function (err, results) {
                    callback && callback(err, results.vpCreator);
                });

        },

        _generate: function (method, originalProduct, newProductType, callback) {

            var self = this;

            //noinspection JSValidateTypes
            flow()
                .par({
                    designs: function (cb) {
                        var designs = [];

                        //noinspection JSValidateTypes
                        flow()
                            .seq(function (cb) {
                                originalProduct.fetch({
                                    fetchSubModels: ["productType"]
                                }, cb);
                            })
                            .seq(function (cb) {

                                _.each(originalProduct.$data.configurations, function(configuration) {
                                    if (configuration.type === "design") {
                                        var designId = configuration.designs[0].href.split("/").pop();
                                        designs.push(self.$.context.$.designs.createItem(designId));
                                    }
                                });

                                flow()
                                    .parEach(designs, function (design, cb) {
                                        design.fetch(cb);
                                    })
                                    .exec(cb);
                            })
                            .exec(function (err) {
                                cb && cb(err, designs);
                            });

                    },
                    newProductType: function (cb) {
                        newProductType.fetch(cb);
                    },
                    vpCreator: function (cb) {
                        self.initializeVPLib(cb);
                    }
                })
                .seq("result", function () {
                    var vpCreator = this.vars.vpCreator,
                        designs = _.map(this.vars.designs, function (design) {
                            return design.$data;
                        }),
                        productType = originalProduct.$.productType;

                    var result = vpCreator[method](originalProduct.$data, newProductType.$.id, null, designs, [
                        productType.$data,
                        newProductType.$data
                    ]);

                    if (!result) {
                        throw new Error("No result returned");
                    }

                    return result;
                })
                .exec(function (err, results) {
                    callback && callback(err, results.result);
                });

        },

        generateVPString: function (originalProduct, newProductType, callback) {
            this._generate("generateVirtualProductString", originalProduct, newProductType, callback);
        }

    });
});
