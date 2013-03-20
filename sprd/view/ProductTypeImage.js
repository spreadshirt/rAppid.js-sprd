define([
    'xaml!sprd/view/Image',
    "sprd/data/ImageService"
], function (Image, ImageService) {

    var viewIdExtractor = /\/views\/(\d+)/;

    return Image.inherit('app.view.ProductTypeImage', {

        defaults: {
            type: "preview",
            productType: null,

            appearance: null,
            view: null
        },

        inject: {
            imageService: ImageService
        },

        imageUrl: function () {
            var url = null;

            if (this.$.productType) {
                var imageService = this.$.imageService;

                var productType = this.$.productType;

                if (this.$.type == "preview") {
                    url = imageService.$.endPoint + "/productTypes/" + productType.$.id;
                } else {
                    url = imageService.$.endPoint + "/compositions/" + productType.$.id;
                }


                var viewId = this.$.view ? this.$.view.$.id : null;
                if(!viewId){
                    var view = productType.getDefaultView();
                    if(view){
                        viewId = view.$.id;
                    }
                }

                var resources = productType.$.resources;

                if (!viewId && resources instanceof Array) {
                    // get view id from resource -> this is a hack, because image server
                    // can't generate an image without the view id -> should be implemented by image server

                    for (var i = 0; i < resources.length; i++) {
                        viewId = viewIdExtractor.exec(resources[i].href);
                        if (viewId) {
                            viewId = viewId[1];
                            break;
                        }
                    }

                }

                url += '/views/' + viewId;


                if (this.$.appearance) {
                    url += "/appearances/" + this.$.appearance.$.id;
                }

                url = this.extendUrlWithSizes(url);

                return url;
            }
            return url;
        }.onChange('width', 'height', 'productType'),

        alt: function () {
            if (this.$.productType) {
                return this.$.productType.$.name;
            }
            return null;
        }

    });

});