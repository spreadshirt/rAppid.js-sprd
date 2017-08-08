define(["js/core/Error"], function(Error) {

    var errorTests,
        ProductCreationError = Error.inherit('sprd.error.ProductCreationError', {
            parseMessage: function(defaultMessage) {
                if (this.detailedMessage && this.detailedMessage.message) {
                    return this.detailedMessage.message.replace(/^(.*?)net\.sprd.*/g, "$1");
                } else {
                    return defaultMessage;
                }
            }
        }, {
            createFromResponse: function(err) {

                if (!err) {
                    return null;
                }

                var productCreationError;
                if (err.xhr && err.xhr.responses) {
                    var message = err.xhr.responses.text;

                    for (var i = 0; i < errorTests.length; i++) {
                        var errorTest = errorTests[i];
                        if (errorTest.test.test(message)) {
                            productCreationError = new ProductCreationError(errorTest.type,
                                ProductCreationError.ErrorCodes[errorTest.type] || ProductCreationError.ErrorCodes.PRODUCT_CREATION,
                                err);

                            productCreationError.detailedMessage = JSON.parse(message);

                            return productCreationError;
                        }
                    }
                }
                productCreationError = new ProductCreationError("ProductCreationError", ProductCreationError.ErrorCodes.PRODUCT_CREATION, err);

                if (message) {
                    var detailedMessage = null;
                    try {
                        detailedMessage = JSON.parse(message);
                    } catch (e) {
                        detailedMessage = {};
                    }

                    productCreationError.detailedMessage = detailedMessage;
                }
                return productCreationError;
            }

        });

    ProductCreationError.ErrorCodes = {
        PRODUCT_CREATION: -100,
        HARD_BOUNDARY: -101,
        CONFIGURATION_OVERLAP: -102,
        MAX_BOUND: -103,
        MIN_BOUND: -104,
        COPYRIGHT: -105,
        COLOR_OVERLAP: -106,
        DPI_BOUND: -107
    };

    errorTests = [
        {
            test: /smaller\sthan/,
            type: "MIN_BOUND"
        },
        {
            test: /It is not allowed to enlarge/,
            type: "DPI_BOUND"
        },
        {
            test: /HARD\sBOUNDARY/,
            type: "HARD_BOUNDARY"
        },
        {
            test: /is\sto\sbig\sfor\sprinttype/,
            type: "MAX_BOUND"
        },
        {
            test: /blacklisted\sterm/,
            type: "COPYRIGHT"
        },
        {
            test: /is\snot\sallowed\sabove/,
            type: "CONFIGURATION_OVERLAP"
        },
        {
            test: /not\sallowed\sabove\scolor/,
            type: "COLOR_OVERLAP"
        }
    ];

    return ProductCreationError;
});