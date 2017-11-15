define(['js/svg/Svg', "sprd/manager/ImageMeasurer", "flow", "sprd/data/ImageService", "js/core/Base"], function (Svg, ImageMeasurer, flow, ImageService, Base) {

    return Svg.inherit("sprd.view.svg.TextConfigurationMeasureRendererClass", {
        defaults: {
            configuration: null,
            textArea: null,
            width: null,
            height: null,
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
            this.bind('configuration', 'change:rotation', debouncedMeasuring);
            this.bind('configuration', 'sizeChanged', debouncedMeasuring);
            this.bind('change:configuration', debouncedMeasuring);
            this.set('loadedFonts', []);

            var debouncer = new Base(),
                self = this;
            function debouncedMeasuring(){
                debouncer._debounceFunctionCall(self.setInnerRect, "innerRect", 300, self);
            }
        },

        initViewBox: function () {

            var textBbox = this.$.textArea.$el.getBBox();
            this.set('bbox', textBbox);

            var x = Math.min(textBbox.x, 0),
                y = Math.min(textBbox.y, 0),
                widthDelta = Math.max(textBbox.x, 0),
                heightDelta = Math.max(textBbox.y, 0);

            this.setViewBox(x, y, textBbox.width + widthDelta, textBbox.height + heightDelta);
            this.set({
                "width": textBbox.x + textBbox.width,
                "height": textBbox.height + textBbox.y
            })
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
                    var viewBox = configuration.$.viewBox,
                        offset = configuration.$.offset.$;

                    if (viewBox) {
                        var viewBoxValues = viewBox.split(" "),
                            oldOffset = configuration.$.offset;

                        var newX = oldOffset.$.x + Number(viewBoxValues[0]),
                            newY = oldOffset.$.y + Number(viewBoxValues[1]);

                        offset = {x: newX, y: newY};
                    }

                    var oldInnerRect = configuration.$.innerRect;
                    configuration.set("innerRect", results.rect);

                    var deltaX = results.rect.x * configuration.width(),
                        deltaY = results.rect.y * configuration.height();

                    if (!oldInnerRect) {
                        configuration.$.offset.set({
                            x: -deltaX + offset.x,
                            y: -deltaY + offset.y
                        })
                    }
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

            svgText.replace("&nbsp;", " ");
            return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgText)));
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
                    return ImageMeasurer.getRealDesignSize(this.vars.image, configuration.$.rotation, configuration.width(1), configuration.height(1));
                })
                .exec(callback)
        }
    });
});
