define(['js/core/Component', "sprd/error/ProductCreationError"],
    function (Component, ProductCreationError) {
        return Component.inherit("sprd.manager.ProductCreationErrorManager", {
            defaults: {
                errorMessage: null,
                copyrightErrorMessage: null
            },

            getErrorMessages: function (err) {
                var customerErrorMessage,
                    detailedErrorMessage;

                if (err instanceof ProductCreationError) {
                    if (err.baseError && err.baseError.xhr) {
                        detailedErrorMessage = err.baseError.xhr.responses.text;
                    }
                }

                if (err.xhr) {
                    if (err.xhr.status === 400) {
                        detailedErrorMessage = err.xhr.responses.text;
                    } else {
                        // 503 and 502 errors are handled somewhere else
                        return;
                    }
                }

                if (detailedErrorMessage && detailedErrorMessage.indexOf("blacklisted terms") !== -1) {
                    var matches = /.*'(.+)'.*\[(.+)\]/.exec(detailedErrorMessage);
                    // copy right error
                    customerErrorMessage = this.$.copyrightErrorMessage.replace("%0", matches[1]).replace("%1", matches[2]);
                } else {
                    customerErrorMessage = this.$.errorMessage;
                }

                return {
                    customerErrorMessage: customerErrorMessage,
                    detailedErrorMessage: detailedErrorMessage
                };
            }
        });
    });