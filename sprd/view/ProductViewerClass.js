define(["js/ui/View"], function (View) {
    return View.inherit('sprd.view.ProductViewerClass', {

        defaults: {
            view: null,
            product: null,
            width: 300,
            height: 300,
            selectedConfiguration: null,
            editable: true,

            productViewerSvg: null,
            textArea: null,
            textAreaPosition: null
        },

        ctor: function(){
            this.callBase();
            this.bind('productViewerSvg','add:configurationViewer', this._onConfigurationViewerAdded, this);
            this.bind('selectedConfiguration', 'change:scale', this._positionTextArea, this);
            this.bind('selectedConfiguration', 'change:offset', this._positionTextArea, this);
        },

        _commitSelectedConfiguration: function(selectedConfiguration) {
            this._positionTextArea();
        },

        keypress: function(e) {
            this.$.textArea.$el.value = "";
            this._keyPressHandler(e.domEvent);
        },

        keydown: function(e) {
            this.$.textArea.$el.value = "";
            this._keyDownHandler(e.domEvent);
        },

        _positionTextArea: function() {
            var position = null,
                selectedConfiguration = this.$.selectedConfiguration;

            if (this.$.editable && selectedConfiguration && selectedConfiguration.type === "text") {
                var factor = this.$.productViewerSvg.localToGlobalFactor(),
                    view = this.$.productViewerSvg.$currentProductTypeViewViewer.$._view,
                    viewMap;

                for (var i = 0; i < view.$.viewMaps.$items.length; i++) {
                    if (view.$.viewMaps.$items[i].$.printArea === selectedConfiguration.$.printArea) {
                        viewMap = view.$.viewMaps.$items[i];
                        break;
                    }
                }

                position = {
                    x: (viewMap.get("offset.x")  + selectedConfiguration.get("offset.x")) * factor.x ,
                    y: (viewMap.get("offset.y")  + selectedConfiguration.get("offset.y")) * factor.y ,
                    width: selectedConfiguration.width() * factor.x - 10,
                    height: selectedConfiguration.height() * factor.y - 10
                };

            }

            this.set("textAreaPosition", position);
        },

        _onConfigurationViewerAdded: function(e){
            var viewer = e.$;
            if(viewer.$.configuration === this.$.selectedConfiguration){
                this.set('selectedConfigurationViewer', viewer);
            }
            this.trigger('add:configurationViewer',viewer);

        },

        _clickHandler: function (e) {
            if (this.$.editable && !(e.isDefaultPrevented || e.defaultPrevented) && e.domEvent.target !== this.$.textArea.$el) {
                this.set('selectedConfiguration', null);
            }

            e.stopPropagation();

        },

        _commitChangedAttributes: function ($) {
            this.callBase();
            if($.hasOwnProperty('selectedConfiguration')){
                var configuration = $['selectedConfiguration'],
                    viewer = null;
                if (!configuration) {
                    viewer = null;
                } else {
                    viewer = this.getViewerForConfiguration(configuration);
                }

                this.set('selectedConfigurationViewer', viewer);

            }
        },

        getViewerForConfiguration: function(configuration){
            if (this.$.productViewerSvg) {
                return this.$.productViewerSvg.getViewerForConfiguration(configuration);
            }
            return null;
        },

        _keyDownHandler: function (e) {
            var self = this,
                product = self.$.product;

            var viewer = this.$.selectedConfigurationViewer;
            if (viewer) {
                viewer._keyDown(e);
                if(e.defaultPrevented){
                    return;
                }
            }

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
                    e.stopPropagation();
                }


                if (e.keyCode === 8 || e.keyCode === 46) {
                    // backspace || delete --> remove selected configuration

                    product.$.configurations.remove(selectedConfiguration);
                    self.set('selectedConfiguration', null);

                    e.preventDefault();
                    e.stopPropagation();
                }
            }

        },

        _keyPressHandler: function(e){
            var viewer = this.$.selectedConfigurationViewer;
            if(viewer){
                viewer._keyPress(e);
            }
        },

        _bindDomEvents: function () {
            if (this.runsInBrowser() && this.$.editable) {
                var self = this;

                this.bind("on:click", this._clickHandler, this);

                this.bindDomEvent("keydown", function (e) {
                    self._keyDownHandler(e);
                });

                this.callBase();
            }
        },

        textAreaFocused: function() {
            this.$.textArea.set('visibility', 'hidden');
        },

        textAreaBlured: function(e) {
            this.$.textArea.set('visibility', 'visible');
        },

        showTextAreaOverlay: function() {
            return this.$.editable &&
                this.$.selectedConfiguration && this.$.selectedConfiguration.type === "text" &&
                this.runsInBrowser() && ('ontouchstart' in window);
        }.onChange("selectedConfiguration", "editable")
    });
});