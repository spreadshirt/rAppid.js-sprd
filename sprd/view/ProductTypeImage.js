define(['xaml!sprd/view/Image', 'sprd/data/ImageService'], function (Image, ImageService) {

    var viewIdExtractor = /\/views\/(\d+)/,
        appearanceIdExtractor = /\/appearances\/(\d+)/;

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
            var url = null,
                imageService = this.$.imageService,
                productType = this.$.productType,
                productTypeId,
                viewId,
                appearanceId;

            if (productType) {
                productTypeId = productType.$.id;
                viewId = this.$.view ? this.$.view.$.id : null;
                if (!viewId) {
                    var view = productType.getDefaultView();
                    if (view) {
                        viewId = view.$.id;
                    }
                }

                var resources = productType.$.resources;

                if (this.$.appearance) {
                    appearanceId = this.$.appearance.$.id;
                }

                if (resources instanceof Array) {
                    // get view id from resource -> this is a hack, because image server
                    // can't generate an image without the view id -> should be implemented by image server

                    for (var i = 0; i < resources.length; i++) {

                        if (viewId && appearanceId) {
                            break;
                        }

                        var extracted;

                        if (!viewId) {
                            extracted = viewIdExtractor.exec(resources[i].href);
                            if (extracted) {
                                viewId = extracted[1];
                            }
                        }

                        if (!appearanceId) {
                            extracted = appearanceIdExtractor.exec(resources[i].href);
                            if (extracted) {
                                appearanceId = extracted[1];
                            }
                        }

                    }

                }


                return imageService.productTypeImage(productTypeId, viewId, appearanceId, {
                    width: this.$.width,
                    height: this.$.height
                });

            }

            return url;
        }.onChange('width', 'height', 'productType', 'appearance'),

        alt: function () {
            if (this.$.productType) {
                return this.$.productType.$.name;
            }
            return null;
        }

    });

});