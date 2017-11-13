define(['sprd/entity/Configuration', 'sprd/entity/Size', 'sprd/util/UnitUtil', 'sprd/model/Design', "sprd/entity/PrintTypeColor", "underscore", "sprd/model/PrintType", "sprd/util/ProductUtil", "js/core/List", "flow", "sprd/manager/IDesignConfigurationManager"],
    function(Configuration, Size, UnitUtil, Design, PrintTypeColor, _, PrintType, ProductUtil, List, flow, IDesignConfigurationManager) {
        return Configuration.inherit('sprd.model.DesignConfigurationBase', {
            schema: {
                design: Design,
                designs: {
                    type: Object,
                    required: false
                }
            },

            defaults: {
                type: 'design',
                design: null,
                textChanged: null
            },

            ctor: function() {
                this.$$ = {};
                this.callBase();
            },

            inject: {
                manager: IDesignConfigurationManager
            },

            init: function(options, callback) {
                this.$.manager.initializeConfiguration(this, options, callback);
            },

            compose: function() {
                var ret = this.callBase();

                var transform = [],
                    scale = this.$.scale,
                    rotation = this.$.rotation,
                    design = this.$.design,
                    width = this.width(),
                    height = this.height();

                if (rotation) {
                    transform.push("rotate(" + rotation + "," + Math.round(width / 2, 3) + "," + Math.round(height / 2, 3) + ")");
                }

                if (scale && (scale.x < 0 || scale.y < 0)) {
                    transform.push("scale(" + (scale.x < 0 ? -1 : 1) + "," + (scale.y < 0 ? -1 : 1) + ")");
                }

                var designId = this.get('design.wtfMbsId') || "";
                ret.content = {
                    unit: "mm",
                    dpi: "25.4",
                    svg: {
                        image: {
                            transform: transform.join(" "),
                            width: Math.round(width, 3),
                            height: Math.round(height, 3),
                            designId: designId
                        }
                    }
                };

                ret.designs = [{
                    id: designId,
                    href: "/" + this.get("design.id")
                }];

                if (design && design.isVectorDesign()) {
                    var printColorIds = [],
                        printColorRGBs = [];

                    this.$.printColors.each(function(printColor) {
                        printColorIds.push(printColor.$.id);
                        printColorRGBs.push(printColor.color().toRGB().toString());
                    });

                    if (this.$.printType.isPrintColorColorSpace()) {
                        ret.content.svg.image.printColorIds = printColorIds.join(" ");
                    } else {
                        ret.content.svg.image.printColorRGBs = printColorRGBs.join(" ");
                    }
                }

                delete ret.printColors;
                delete ret.design;

                ret.restrictions = {
                    changeable: true
                };

                return ret;
            },

            parse: function(data) {
                data = this.callBase();

                if (data.designs) {
                    this.$$.design = data.designs[0];
                }

                data.designs = undefined;

                if (data.printArea) {
                    // remove printArea from payload since it is the wrong one
                    // it will be set within the initSchema methods
                    this.$$.printArea = data.printArea;
                    data.printArea = null;
                }

                if (data.content) {
                    this.$$.svg = data.content.svg;
                }

                return data;
            },

            textChangedSinceCreation: function () {
                var initialText = this.$.initialText,
                    currentText = this.$.text,
                    textChanged = this.$.textChanged;

                if (!initialText) {
                    return true;
                }

                var result = textChanged || initialText !== currentText;
                this.set('textChanged', result);
                return result;
            },

            isOnlyWhiteSpace: function () {
                var text = this.$.text;
                if (!text) {
                    return false;
                }

                return /^[\s\n\r]*$/.test(text);
            }
        });

    }
);