define(["js/core/Bindable"], function (Bindable) {

    var State = {
        ERROR: "error",
        LOADING: "loading",
        LOADED: "loaded",
        NONE: "none"
    };

    var UploadDesign = Bindable.inherit("sprd.type.UploadDesign", {

        defaults: {
            design: null,
            image: null,
            uploadProgress: 0,
            xhr: null,
            designLoaded: false,
            isPrintable: true,
            state: State.NONE
        },

        cancelUpload: function () {
            var xhr = this.$.xhr,
                self = this;

            if (xhr) {
                xhr.abort();
            } else {
                this.bind('change:xhr', function abortXhr () {
                    xhr.abort();
                    self.unbind('change:xhr', abortXhr);
                });
            }
        }
    });

    UploadDesign.State = State;

    return UploadDesign;
});