define(['sprd/data/SprdModel', 'sprd/model/User'], function (SprdModel, User) {
	return SprdModel.inherit('sprd.model.Session', {

        defaults: {
            username: null,
            password: null
        },

        schema: {
            user: {
                type: User,
                required: false
            },
            // FIXME remove all data which isn't part of the schema
            href: {
                type: String,
                required: false
            },
            username: String,
            password: String
        },

        /***
         *
         * @param [username]
         * @param [password]
         * @param callback
         */
        login: function(username, password, callback) {

            var args = Array.prototype.slice.call(arguments);

            if (args.length === 1) {
                callback = arguments[0];
            } else {
                this.set({
                    username: username,
                    password: password
                });
            }

            this.validateAndSave(null, function(err, session) {
                if (!err && session) {
                    session.set("password", null);

                    session.fetch({
                        fetchSubModels: ["user"]
                    }, callback);
                } else {
                    callback(err);
                }
            });
        },

        /***
         *
         * @param callback
         */
        logout: function(callback) {
            this.remove(null, callback);
        }
	});
});