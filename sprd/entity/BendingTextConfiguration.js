define(["sprd/entity/DesignConfigurationBase", "sprd/entity/Size", "sprd/entity/Font", "sprd/util/ProductUtil", "designer/lib/Text2Path", "sprd/entity/BlobImage", "sprd/data/IImageUploadService"], function(DesignConfigurationBase, Size, Font, ProductUtil, Text2Path, BlobImage, IImageUploadService) {
    var PATH_TYPE = {
        OUTER_CIRCLE: "outer_circle",
        INNER_CIRCLE: "inner_circle",
        HEART: "heart"
    };

    var designCache = {};

    return DesignConfigurationBase.inherit('sprd.model.BendingTextConfiguration', {

        defaults: {
            fontSize: 25,

            _size: Size,
            aspectRatio: 1,
            _allowScale: true,
            loading: false,
            initialized: false,
            isNew: false,

            angle: 50,
            path: PATH_TYPE.OUTER_CIRCLE,
            textPath: "{textPath()}",
            dy: "{dy()}",

            textPathOffsetX: 0,
            textPathOffsetY: 0
        },

        type: "bendingText",

        $events: [
            "recalculateSize"
        ],

        inject: {
            imageUploadService: IImageUploadService,
            context: "context"
        },

        ctor: function() {
            this.callBase();
            this.$synchronizeCache = designCache;
        },

        init: function(callback) {
            var properties = this.$.properties,
                context = this.$.context,
                self = this;

            if (!_.isEmpty(properties)) {
                flow()
                    .seq(function(cb) {
                        DesignConfigurationBase.prototype.init.call(self, cb);
                    })
                    .seq(function(cb) {
                        var fontFamilies = context.$.fontFamilies;
                        if (fontFamilies.size()) {
                            cb();
                        } else {
                            fontFamilies.fetch({fullData: true}, cb);
                        }
                    })
                    .seq("fontFamily", function() {
                        var fontFamilyId = properties.fontFamilyId;
                        if (fontFamilyId) {
                            var items = context.$.fontFamilies.$items;

                            for (var i = items.length; i--;) {
                                if (items[i].$.id == properties.fontFamilyId) {
                                    return items[i];
                                }
                            }
                        }
                    })
                    .seq(function() {
                        if (properties.text) {

                            var fontFamily = this.vars.fontFamily,
                                fontWeight = properties.fontWeight,
                                fontStyle = properties.fontStyle;


                            var scale = {
                                x: properties.scale,
                                y: properties.scale
                            };

                            self.set({
                                text: properties.text,
                                angle: properties.angle || 50,
                                path: properties.path || PATH_TYPE.OUTER_CIRCLE,
                                font: fontFamily.getFont(fontWeight, fontStyle),
                                scale: scale
                            })
                        }
                    })
                    .exec(function(err) {
                        self.set("initialized", true);
                        callback && callback(err);
                    });
            }

            callback && callback(false);
        },

        size: function() {
            return this.$._size || Size.empty;
        }.onChange("_size").on("sizeChanged"),

        compose: function() {
            var ret = this.callBase();
            var font = this.$.font;
            ret.properties.type = "bendingText";
            ret.properties.text = this.$.text;
            ret.properties.angle = this.$.angle;
            ret.properties.fontFamilyId = font.getFontFamily().$.id;
            ret.properties.fontWeight = font.$.weight;
            ret.properties.fontStyle = font.$.style;
            ret.properties.path = this.$.path;
            ret.properties.scale = this.$.scale.x;

            return ret;
        },

        _initializeBindingsBeforeComplete: function() {
            this.callBase();

            var recalculateSize = function() {
                var self = this;
                this.trigger('configurationChanged');

                setTimeout(function() {
                    self.trigger("recalculateSize", this);
                }, 1);
            };

            this.bind("change:text", recalculateSize, this);
            this.bind("change:angle", recalculateSize, this);
            this.bind("change:font", recalculateSize, this);
            this.bind("change:printColors", function() {
                this.trigger('configurationChanged');
            }, this)
        },

        textPath: function() {
            var a = this.$.angle;

            this.set("path", PATH_TYPE.OUTER_CIRCLE);
            if (a < 0) {
                a = -a;

                return "M 0 0 m oneTime,twoTime a oneTime,oneTime 0 1,0 0,twoTime a oneTime,oneTime 0 1,0 0,-twoTime"
                    .replace(/oneTime/g, "" + a)
                    .replace(/twoTime/g, "" + (2 * a));

            } else {
                return "M 0 0 m oneTime,0 a oneTime,oneTime 0 1,1 0,-twoTime a oneTime,oneTime 0 1,1 0,twoTime"
                    .replace(/oneTime/g, "" + a)
                    .replace(/twoTime/g, "" + (2 * a));
            }


        }.on("recalculateSize"),

        dy: function() {
            return this.$.angle < 0 ? 16 : 0;
        }.onChange("angle"),

        getPossiblePrintTypes: function(appearance) {
            var ret = [],
                tmp,
                printArea = this.$.printArea,
                font = this.$.font;

            if (!printArea || !font) {
                return ret;
            }

            tmp = ProductUtil.getPossiblePrintTypesForTextOnPrintArea(font.getFontFamily(), printArea, appearance.$.id);
            _.each(tmp, function(element) {
                if (ret.indexOf(element) === -1) {
                    ret.push(element);
                }
            });

            return ret;
        }.onChange("printArea"),

        setColor: function(layerIndex, color) {
            var printColors = this.$.printColors;
            if (printColors) {
                printColors.reset([color]);
            }
        },

        getPossiblePrintTypesForPrintArea: function(printArea, appearanceId) {
            var fontFamily = this.$.font.getFontFamily(),
                text = this.$.text;

            if (text) {
                return ProductUtil.getPossiblePrintTypesForTextOnPrintArea(fontFamily, printArea, appearanceId);
            }
        },

        save: function(callback) {
            var text = this.mainConfigurationRenderer.$.text,
                font = this.$.font,
                self = this,
                fontSVGUrl = this.mainConfigurationRenderer.$.imageService.fontUrl(font, "svg#font"),
                digitalPrint = !this.$.printType.isPrintColorColorSpace();

            var cacheId = [self.$.angle, self.$.text, self.$.font.$.id];
            var fill = self.$.printColors.at(0).toHexString();

            if (digitalPrint) {
                cacheId.push(fill);
            }

            cacheId = cacheId.join("-");


            this.synchronizeFunctionCall(function(callback) {

                flow()
                    .seq('svg', function(cb) {
                        Text2Path(text.$el, fontSVGUrl, {
                            fill: fill,
                            width: Math.round((self.width() * self.$.printType.$.dpi / 25.4) + 50, 0) + "px"
                        }, cb);
                    })
                    .seq("blob", function(cb) {
                        var svg = this.vars.svg;

                        if (digitalPrint) {
                            var image = new Image();
                            image.onload = function() {
                                var canvas = document.createElement("canvas");
                                canvas.width = image.naturalWidth;
                                canvas.height = image.naturalHeight;
                                canvas.getContext('2d').drawImage(image, 0, 0);

                                canvas.toBlob(function(blob) {
                                    cb(null, blob);
                                }, "image/png");
                            };

                            image.onerror = cb;

                            image.src = "data:image/svg+xml;base64," + btoa(svg);

                        } else {
                            svg = '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE svg PUBLIC " -//W3C//DTD SVG 20000303 Stylable//EN" "http://www.w3.org/TR/2000/03/WD-SVG-20000303/DTD/svg-20000303-stylable.dtd">' + this.vars.svg;
                            cb(null, new Blob([svg], {type: "image/svg"}));
                        }
                    })
                    .seq('uploadDesign', function(cb) {
                        var img = new BlobImage({
                            blob: this.vars.blob,
                            filename: "bending-text" + (digitalPrint ? ".png" : ".svg")
                        });

                        self.$.imageUploadService.upload(img, cb);
                    })
                    .seq("design",function() {
                        return this.vars.uploadDesign.$.design;
                    })
                    .exec(function(err, results) {
                        callback(err, results.design);
                    });

            }, cacheId, function(err, design) {
                self.set('design', design);
                callback(err);
            }, this);

        },

        saveTakesTime: function() {
            return true;
        },

        isAllowedOnPrintArea: function(printArea) {
            return printArea && printArea.get("restrictions.textAllowed") == true;
        }
    });
});
