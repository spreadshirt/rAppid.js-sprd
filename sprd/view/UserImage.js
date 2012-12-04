define(["xaml!sprd/view/Image", "sprd/data/ImageService"], function (Image, ImageService) {

    return Image.inherit('sprd.view.UserImage',{

        defaults: {
            // if null use default view
            user: null
        },

        inject: {
            imageService: ImageService
        },

        _commitChangedAttributes: function (attributes) {
            this.callBase();
            if (attributes.hasOwnProperty('design')) {
                this.set('loaded', false);
            }
        },

        imageUrl: function () {
            var url = null;
            var imageService = this.$.imageService;

            if (this.$.user) {
                var user = this.$.user;

                url = imageService.$.endPoint + "/users/" + user.$.id;

                url = this.extendUrlWithSizes(url);

                return url;
            }
            return url;

        }.onChange('user')
    });
});