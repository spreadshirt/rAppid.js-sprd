define(["js/ui/View"], function(View) {
    return View.inherit('sprd.view.ProductViewerClass', {

        defaults: {
            view: null,
            product: null,
            width: 300,
            height: 300,
            selectedConfiguration: null,
            editable: true,
            tabindex: 1
        },

        _clickHandler: function (e) {
            if (this.$.editable && !e.isDefaultPrevented) {
                this.set('selectedConfiguration', null);
            }

            if (this.$el && this.$el.focus) {
                this.$el.focus();
            }
        },

        _bindDomEvents: function () {
            if (this.runsInBrowser() && this.$.editable) {
                var self = this;

                this.bind("on:click", this._clickHandler, this);

                this.bindDomEvent("keydown", function (e) {
                    var product = self.$.product;

                    var selectedConfiguration = self.$.selectedConfiguration;

                    if (selectedConfiguration && product) {

                        var deltaX = 0,
                            deltaY = 0;

                        switch (e.keyCode) {
                            case 40:
                                deltaY = 1;
                                break;
                            case 38:
                                deltaY = -1;
                                break;
                            case 37:
                                deltaX = -1;
                                break;
                            case 39:
                                deltaX = 1;
                        }

                        if (deltaX || deltaY) {

                            if (e.shiftKey) {
                                deltaX *= 10;
                                deltaY *= 10;
                            }

                            var offset = selectedConfiguration.$.offset;
                            offset.set({
                                x: offset.$.x + deltaX,
                                y: offset.$.y + deltaY
                            });
                            selectedConfiguration.set('offset', offset);

                            e.preventDefault();
                        }


                        if (e.keyCode === 8 || e.keyCode === 46) {
                            // backspace || delete --> remove selected configuration

                            product.$.configurations.remove(selectedConfiguration);
                            self.set('selectedConfiguration', null);

                            e.preventDefault();
                        }
                    }

                });

            }

            this.callBase();
        }

    });
});