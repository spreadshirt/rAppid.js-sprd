define(['sprd/data/SprdModel', 'sprd/model/User'], function (SprdModel, User) {
	return SprdModel.inherit('sprd.model.Session', {

        schema: {
            user: User
        },

        login: function(username, password, callback) {
            this.set({
                username: username,
                password: password
            });

            this.save(null, function(err, session) {
                if (!err && session) {
                    session.fetch({
                        fetchSubModels: ["user"]
                    }, callback);
                } else {
                    callback(err);
                }
            });
        },

        logout: function(callback) {
            this.remove(null, callback);
        }
	});
});