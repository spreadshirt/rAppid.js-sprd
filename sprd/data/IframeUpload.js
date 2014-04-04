define(['js/core/Bindable'], function (Bindable) {
    return Bindable.inherit('sprd.data.IframeUpload', {
        defaults: {
            iframe: null,
            form: null,
            input: null
        },

        ctor: function (fileInput) {
            this.callBase();

            this.set({
                'form': fileInput.$.uploadForm,
                'iframe': fileInput.$.uploadIframe,
                'input': fileInput.$.iframeInput
            });
        },

        upload: function (options, callback) {
            var url = options.url || '',
                params = options.queryParams || '';

            this.$.form.$el.setAttribute('action', url + params);

            this.$.iframe.bind('on:load', function () {
                rAppid.ajax(url, {}, callback);
            });

            this.$.form.$el.submit();
        }
    })
});