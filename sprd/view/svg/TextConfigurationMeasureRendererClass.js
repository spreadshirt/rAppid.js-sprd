define(['js/svg/Svg', "sprd/manager/ImageMeasurer", "flow", "sprd/data/ImageService", "js/core/Base"], function (Svg, ImageMeasurer, flow, ImageService, Base) {

    return Svg.inherit("sprd.view.svg.TextConfigurationMeasureRendererClass", {
        defaults: {
            configuration: null,
            textArea: null,
            width: "{configuration.width()}",
            height: "{configuration.height()}",
            preserveAspectRatio: "none",
            bbox: null,
            loadedFonts: null
        },

        inject: {
            imageService: ImageService
        },

        $classAttributes: ['configuration', 'textArea', 'bbox'],

        _initializationComplete: function () {
            this.callBase();
            this.bind('configuration', 'change:rotation', this.setInnerRect, this);
            this.bind('configuration', 'sizeChanged', this.setInnerRect, this);
            this.bind('change:configuration', this.setInnerRect, this);
            this.set('loadedFonts', []);
        },

        initViewBox: function () {

            var textBbox = this.$.textArea.$el.getBBox();
            this.set('bbox', textBbox);
            this.setViewBox(textBbox.x, textBbox.y, textBbox.width, textBbox.height);
        },

        loadFontsAsDataURI: function (callback) {
            var configuration = this.$.configuration;

            if (!configuration) {
                return;
            }

            var fonts = configuration.getUsedFonts && configuration.getUsedFonts() || [configuration.$.font],
                self = this;

            flow()
                .parEach(fonts, function (font, cb) {
                    var loadedFonts = self.$.loadedFonts;
                    if (loadedFonts.indexOf(font) !== -1) {
                        cb();
                        return;
                    }

                    self.fontToFontFace(font, function (err, ffDecl) {
                        if (!err) {
                            self.$.defs.$el.appendChild(ffDecl);
                            loadedFonts.push(font)
                        }
                        cb(err);
                    });
                })
                .exec(callback)
        },

        fontToFontFace: function (font, callback) {
            var fontName = font.getUniqueFontName(),
                format = "woff",
                url = this.$.imageService.fontUrl(font, format),
                self = this;

            flow()
                .seq("dataURI", function (cb) {
                    self.urlToBase64(url, "application/font-woff", cb);
                })
                .exec(function (err, result) {
                    if (!err) {
                        var css = "@font-face { font-family: '" + fontName + "'; src: url(" + result.dataURI + ") format('"+ format + "')}";
                        var style = document.createElement("style");
                        style.type = 'text/css';
                        if (style.styleSheet) {
                            style.styleSheet.cssText = "css";
                        } else {
                            style.appendChild(document.createTextNode(css));
                        }

                        callback && callback(err, style);
                        return;
                    }

                    callback && callback(err);
                })

        },

        urlToBase64: function (url, mime, callback) {
            flow()
                .seq("xhr", function (cb) {
                    var xhr = new XMLHttpRequest();
                    xhr.open("GET", url);

                    xhr.responseType = "arraybuffer";

                    xhr.onreadystatechange = function (e) {
                        if (xhr.readyState === 4) {
                            cb(null, xhr)
                        }
                    };

                    xhr.send();
                })
                .seq("blob", function () {
                    return new Blob([this.vars.xhr.response], {type: mime});
                })
                .seq("dataURI", function (cb) {
                    var reader = new FileReader();
                    reader.readAsDataURL(this.vars.blob);
                    reader.onloadend = function () {
                        cb(null, reader.result);
                    }
                })
                .exec(function (err, result) {
                    callback && callback(err, err? result : result.dataURI);
                })

        },

        setInnerRect: function () {
            var self = this,
                configuration = this.$.configuration;

            this.getInnerRect(function (err, results) {
                if (!err) {
                    configuration.set("innerRect", results.rect);
                }
            });
        },

        width: function () {
            var config = this.$.configuration;
            if (config) {
                return Math.round(config.widthInMM() + 50);
            } else {
                return 50;
            }
        }.on('configuration.widthInMM()'),

        getElement: function (callback) {
            var svgNamespace = 'http://www.w3.org/2000/svg',
                xlinkNS = 'http://www.w3.org/1999/xlink',
                elem = this.$el;

            if (!elem) {
                return null;
            }
            this.initViewBox();
            elem.setAttribute("xmlns", svgNamespace);
            elem.setAttribute("xmlns:xlink", xlinkNS);


            this.loadFontsAsDataURI(function (err) {
                callback(err, elem);
            });
        },

        getAsDataURI: function (el) {
            if (!el) {
                return "";
            }

            var s = new XMLSerializer(),
                svgText = s.serializeToString(el);

            return "data:image/svg+xml;base64," + btoa(svgText);
        },

        getInnerRect: function (callback) {
            var configuration = this.$.configuration,
                self = this;

            if (!configuration) {
                callback && callback(new Error("No configuration set."));
                return;
            }

            flow()
                .seq("element", function (cb) {
                    self.getElement(cb);
                })
                .seq("dataURI", function () {
                    return self.getAsDataURI(this.vars.element);
                })
                .seq("image", function (cb) {
                    ImageMeasurer.toImage(this.vars.dataURI, cb)
                })
                .seq("rect", function () {
                    return ImageMeasurer.getRealDesignSize(this.vars.image, configuration.$.rotation, configuration.$.width, configuration.$.height);
                })
                .exec(callback)
        }
    });
});
