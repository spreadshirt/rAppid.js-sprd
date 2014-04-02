define(['js/ui/FileUpload', 'sprd/data/IframeUpload'], function(FileUpload, IframeUpload) {

    return FileUpload.inherit('sprd.ui.FileUploadClass', {

        _initializationComplete: function () {
            var iframe,
                iframeContent,
                self = this;

            if (!window.FileReader) {
                iframe = this.$templates.iframe.createInstance();
                iframeContent = this.$templates.iframeContent.createInstance();

                iframe.bind('on:load', function (e) {
                    var target = e.target,
                        iframeInput;

                    target.$el.contentDocument.body.appendChild(iframeContent.render());

                    iframeInput = self.$.iframeInput;

                    iframeInput.bind('on:change', function () {
                        self.trigger('on:change', {iframeUpload: new IframeUpload(self)});
                    });

                    self.bind('on:click', function (ev) {
                        self.$.iframeInput.$el.click();
                        ev.preventDefault();
                    });
                });

                this.$stage.addChild(iframe);
            }
        }
    });
});