define(["sprd/model/Mask", "flow", "rAppid"], function(Mask, flow, rappid) {

    return Mask.inherit("sketchomat.model.VectorMask", {

            defaults: {
                vector: null,
                svg: null
            },

            initImage: function(callback) {
                if (!this.get('vector')) {
                    return callback && callback(null, null);
                }

                if (this.get('htmlImage')) {
                    return callback && callback(null, this.get('htmlImage'));
                }

                var self = this;

                flow()
                    .seq('data_uri', function(cb) {
                        self.fetchSvg(self.get('vector'), cb);
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

        fetchSvg: function(url, callback) {
                var self = this;
            rappid.ajax(url, null, function(err, xhr) {
                    if (err) {
                        callback && callback(err, xhr);
                        return;
                    }

                    if (xhr.status == 200) {
                        var svg = xhr.responses.xml;
                        self.prepareSvg(svg);
                        self.set('svg', svg);

                        var s = new XMLSerializer();
                        var data_uri = self.svgTextToDataUri(s.serializeToString(svg));
                        callback && callback(null, data_uri);
                    } else {
                        callback && callback(new Error("Request was not successful for Vectormask with id " + self.$.id + " and name " + self.$.name), xhr);
                    }
                });
            },

        svgTextToDataUri: function(svgText) {
            return "data:image/svg+xml;utf8," + encodeURIComponent(svgText);
        },

        prepareSvg: function(svg) {
            //Safari Hacks
            svg.documentElement.setAttribute('width', 100);
            svg.documentElement.setAttribute('height', 100);

            //Setting preserveAspectRatio explicitely. FF defaults to something other than none.
            svg.documentElement.setAttribute('preserveAspectRatio', this.$.fixedAspectRatio ? 'xMinYMin' : 'none');
        },

        previewUrl: function() {
            return this.$.vector;
        }.onChange('vector')
        }
    );
});