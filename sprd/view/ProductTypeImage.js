define(['xaml!sprd/view/Image', 'sprd/data/ImageService'], function (Image, ImageService) {

    var viewIdExtractor = /\/views\/(\d+)/,
        appearanceIdExtractor = /\/appearances\/(\d+)/;

    return Image.inherit('sprd.view.ProductTypeImage', {

        defaults: {
            type: "preview",
            productType: null,
            componentClass: "sprd-image product-type-image product-type-{productType.id}",
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

                if (this.$.type === "preview") {
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
                        if (!productType.getAppearanceById(appearanceId)) {
                            appearanceId = null;
                        }
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

                    if (!appearanceId) {
                        appearanceId = productType.getDefaultAppearanceId();
                    }

                    if (!viewId) {
                        viewId = productType.getDefaultViewId();
                    }

                    return imageService.productTypeImage(productTypeId, viewId, appearanceId, {
                        width: Math.max(this.$.width || 0, this.$.height || 0),
                        height: Math.max(this.$.width || 0, this.$.height || 0)
                    });

                } else if (this.$.type === "size") {
                    return imageService.productTypeSizeImage(productTypeId, {
                        width: this.$.width,
                        height: this.$.height
                    });

                }

            }

            return url;
        }.onChange('width', 'height', 'productType', 'appearance', 'view'),

        alt: function () {
            if (this.$.productType) {
                return this.$.productType.$.name;
            }
            return null;
        }

    });

});