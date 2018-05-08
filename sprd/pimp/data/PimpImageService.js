define(["js/core/Component", "rAppid", "JSON", "underscore", "js/lib/extension", "flow"], function (Component, rAppid, JSON, _, extension, flow) {

    return Component.inherit("sprd.pimp.data.PimpImageService", {
        defaults: {
            gateway: null,
            context: null
        },

        generateDesign: function (options, callback) {
            options = options || {};

            _.defaults(options, {
                size: "M",
                align: "justify",
                font: null,
                text: null,
                taskId: null
            });

            var self = this,
                shopId = this.getShopId();

            flow().
                seq("designId", function (cb) {
                    rAppid.ajax([self.$.gateway, 'fonts', 'tasks', (options.taskId || 0), 'designs'].join("/"), {
                        type: 'POST',
                        contentType: "application/json; charset=UTF-8",
                        data: JSON.stringify({
                            text: options.text,
                            align: options.align,
                            fontId: options.font.$.id,
                            shopId: shopId
                        })
                    }, function (err, xhr) {
                        if (!err && xhr && xhr.status === 201) {
                            cb(null, JSON.parse(xhr.responses.text).id);
                        } else {
                            cb(err || true);
                        }
                    });
                })
                .seq("design", function (cb) {
                    self.$.context.getCollection("designs").createItem(this.vars.designId).fetch(cb);
                })
                .exec(function (err, results) {
                    callback && callback(err, results.design);
                });
        },

        getShopId: function () {

            var parameter = this.PARAMETER();
            if (parameter.context === "shop") {
                return parameter.contextId;
            }

            return null;
        },

        /***
         * Calls the service and returns with a link to the generated image.
         *
         * @param options
         * @param options.fontsize - The font size
         * @param callback
         */
        generateImage: function (options, callback) {

            options = options || {};

            _.defaults(options, {
                size: "M",
                align: "justify",
                font: null,
                text: null,
                taskId: null
            });

            if (!(options.font && options.text)) {
                callback && callback("Font and text required");
                return;
            }
            options.text = (options.text || "").replace(/^\n+|\n+$/gi, "");
            options.fontId = options.font.$.id;

            delete options.font;

            var params = _.extend({}, options),
                cacheKeys = _.keys(params).sort(),
                cacheKey = [], key;

            for (var i = 0; i < cacheKeys.length; i++) {
                key = cacheKeys[i];
                if (key === "taskId" && !params[key]) {
                    cacheKey.push(key + "=" + new Date().getTime());
                } else {
                    cacheKey.push(key + "=" + (params[key]));
                }

            }

            cacheKey = cacheKey.join("&");

            this.synchronizeFunctionCall(requestImage, cacheKey, callback, this, true);

            function requestImage(callback) {

                var self = this;

                flow()
                    .seq("task", function (cb) {
                        rAppid.ajax(self.$.gateway + '/fonts/tasks' + (options.taskId ? '/' + options.taskId : ''), {
                            type: options.taskId ? 'PUT' : 'POST',
                            contentType: 'application/json',
                            data: JSON.stringify(options)
                        }, function (err, xhr) {
                            if (!err && (xhr.status == 200 || xhr.status == 201)) {
                                cb(null, JSON.parse(xhr.responses.text));
                            } else {
                                cb(err || true);
                            }
                        })
                    })
                    .seq("image", function (cb) {
                        var img = new Image(),
                            task = this.vars.task;

                        img.onload = function () {
                            cb && cb(null, {
                                width: img.width,
                                height: img.height,
                                src: img.src
                            });
                        };

                        img.onerror = function (e) {
                            cb && cb(e)
                        };

                        img.src = task.url;
                    })
                    .exec(callback);

            }
        }
    });
});