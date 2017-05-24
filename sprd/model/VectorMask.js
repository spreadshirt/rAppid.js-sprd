define(["sprd/model/Mask", "flow", "rAppid"], function(Mask, flow, rappid) {

    return Mask.inherit("sketchomat.model.VectorMask", {

        defaults: {
            src: null,
            data_uri: '{dataURL()}',
            svg: null,
            fetched: false
        },

        clone: function(options) {
            // Overwritten clone function, because a svg document contains circular content
            // e.g. parent -> child -> parent -> child ...
            // This will cause a stackoverflow.
            var oldSvg = this.$.svg;
            this.set('svg', null, {silent: true});

            var clonedVectorMask = this.callBase();
            clonedVectorMask.fetchSvg();

            this.set('svg', oldSvg, {silent: true});
            return clonedVectorMask;
        },

        initialize: function() {
            this.callBase();
            this.fetchSvg();
        },

        initImage: function(options, callback) {
            options = options || {};

            if (!this.url()) {
                return callback && callback(new Error('No src set for mask.'));
            }

            if (!options.force && this.get('htmlImage') && this.get('htmlImage').complete) {
                return callback && callback(null, this.get('htmlImage'));
            }

            var self = this;

            flow()
                .seq('data_uri', function(cb) {
                    self.fetchSvg(cb);
                })
                .seq('img', function(cb) {
                    var img = new Image();

                    img.onload = function() {
                        self.set('htmlImage', img);
                        cb && cb(null, img);
                    };

                    img.onerror = function(e) {
                        cb && cb(e);
                    };

                    img.src = this.vars.data_uri;
                })
                .exec(function(err, results) {
                    callback && callback(err, results.img);
                });
        },

        fetchSvg: function(callback) {
            var self = this,
                url = this.url();

            if (!this.$.svg || !this.$.svg.rootElement) {
                rappid.ajax(url, null, function(err, xhr) {
                    if (err) {
                        callback && callback(err, xhr);
                        return;
                    }

                    if (xhr.status == 200) {
                        var svg = xhr.responses.xml;
                        self.prepareSvg(svg);
                        self.set('svg', svg);
                        callback && callback(null, self.get('data_uri'));
                    } else {
                        callback && callback(new Error("Request was not successful for Vectormask with id " + self.$.id + " and name " + self.$.name), xhr);
                    }
                });
            } else {
                callback && callback(null, self.get('data_uri'));
            }
        },

        svgTextToDataUri: function(svgText) {
            var utf8 = "data:image/svg+xml;utf8," + encodeURIComponent(svgText);
            var base64 = "data:image/svg+xml;base64," + btoa(svgText);
            return {
                utf8: utf8,
                base64: base64
            }
        },

        prepareSvg: function(svg) {
            //Safari Hacks
            svg.documentElement.setAttribute('width', 100);
            svg.documentElement.setAttribute('height', 100);

            //Setting preserveAspectRatio explicitely. FF defaults to something other than none.
            svg.documentElement.setAttribute('preserveAspectRatio', 'none');

            this.changeColor(svg, '#00B2A5');
        },

        previewUrl: function() {
            return this.url();
        }.onChange('url()'),

        url: function() {
            return this.$.data_uri || this.$.src;
        }.onChange('src', 'data_uri'),

        changeColor: function(svg, color) {
            var styleAttribute = svg.documentElement.getAttribute('style');
            svg.documentElement.setAttribute('style', styleAttribute + 'fill: ' + color + ';');
            var styles = svg.getElementsByTagName('style');
            for (var i = 0; i < styles.length; i++) {
                var style = styles[i];
                var styleContent = style.textContent;
                var fillRegex = /(fill:\s*#[\dABCDEF]+|});/;
                //var regex = /\{([^}])}/;
                styleContent = styleContent.replace(fillRegex, '');
                styleContent = styleContent.replace(0, -1) + "fill:" + color + ";}";
                style.textContent = styleContent;
            }
        },

        dataURL: function() {
            if (this.$.svg && this.$.svg.documentElement) {
                var s = new XMLSerializer();
                return this.svgTextToDataUri(s.serializeToString(this.$.svg)).utf8;
            }

            return null;
        }.onChange('svg')
    });
});