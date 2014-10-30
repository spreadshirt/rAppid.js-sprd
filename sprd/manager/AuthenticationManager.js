define(["js/core/Component", "xaml!sprd/data/SprdApiDataSource", "flow", "sprd/model/Session", "js/core/Bus"], function(Component, SprdApiDataSource, flow, Session, Bus) {

    return Component.inherit("sprd.manager.AuthenticationManager", {

        defaults: {
            session: null
        },

        inject: {
            api: SprdApiDataSource,
            bus: Bus
        },

        _commitSession: function(session) {
            var api = this.$.api;
            api && api.set("session", session);
        },

        /***
         *
         * @param sessionId
         * @param [withUser=true]
         * @param callback
         */
        initializeWithSessionId: function(sessionId, withUser, callback) {

            if (arguments[1] instanceof Function) {
                callback = withUser;
                withUser = true;
            }

            if (!sessionId) {
                callback && callback("No sessionId");
                return;
            }

            var api = this.$.api,
                self = this,
                session = api.createEntity(Session, sessionId);

            session.fetch({
                fetchSubModels: (withUser ? ["user"] : []),
                noCache: true
            }, function(err, session) {

                if (err) {
                    session = null;
                }

                api.set("session", session);
                self.set("session", session);

                callback && callback(err, session);
            });

        },

        loginWithSession: function(session, callback) {

            var self = this,
                api = this.$.api;

            session.login(function (err) {

                if (err) {
                    session = null;
                }

                api.set("session", session);
                self.set("session", session);

                callback && callback(err, session);
            });

        },

        login: function(username, password, callback) {

            var session = this.$.api.createEntity(Session);

            session.set({
                username: username,
                password: password
            });

            this.loginWithSession(session, callback);

        },

        logout: function(callback) {

            var session = this.$.session,
                self = this;

            if (!session) {
                session = this.$.api.createEntity(Session, "current");
            }

            session.remove(null, function(err) {
                if (self.$.session === session) {
                    self.set("session", null);
                }

                if (!err) {
                    self.$.bus.trigger('User.logout');
                }

                callback && callback(err);
            });

        }

    });

});