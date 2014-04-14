define(['js/ui/FileUpload', 'sprd/data/IframeUpload'], function(FileUpload, IframeUpload) {

    return FileUpload.inherit('sprd.ui.FileUploadClass', {

        _initializationComplete: function () {
            var iframe,
                iframeContent,
                self = this,
                stageDocument = this.$stage.$document;

            if (!window.FileReader) {
                iframe = this.$templates.iframe.createInstance();

                iframe.bind('on:load', function (e) {
                    var iframeInput,
                        iframeDocument = e.target.$el.contentDocument,
                        iframeBody;

                    if (iframeDocument) {
                        iframeBody = iframeDocument.getElementsByTagName('body')[0];
                        iframeContent = self.$templates.iframeContent.createInstance();

                        iframeBody.appendChild(iframeContent.render());

                        iframeInput = self.$.iframeInput;

                        iframeInput.bind('on:change', function () {
                            self.trigger('on:change', { iframeUpload: new IframeUpload(self) } );
                        });

                        self.bind('on:click', function (ev) {
                            self.$.iframeInput.$el.click();
                            ev.preventDefault();
                        });
                    }
                });

                this.$stage.addChild(iframe);
            }
        }
    });
});