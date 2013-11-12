define(["js/ui/View", "js/core/List"], function (View, List) {

        return View.inherit('designer.view.SimpleColorPickerClass', {

            defaults: {
                color: null,
                colors: List,
                itemHeight: 15,
                _previewColor: null,
                _showPreview: false,
                _numColors: "{colors.size()}"
            },

            events: ['on:colorSelect'],

            $excludedStyleAttributes: ["color"],

            _onPointerDown: function (e) {

                var self = this;
                if (!this.$moveHandler) {
                    this.$moveHandler = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.changedTouches) {
                            e = e.changedTouches[0];
                        }
                        self._updatePanel(e);

                    };
                }

                if (!this.$upHandler) {
                    this.$upHandler = function (e) {
                        e.preventDefault();
                        e.stopPropagation();

                        self.$pointerDown = false;
                        self.set('color', self.$._previewColor);
                        self.dom(self.$stage.$window).unbindDomEvent('pointermove', self.$moveHandler);
                        self.dom(self.$stage.$window).unbindDomEvent('pointerup', self.$upHandler);
                        self.set('_showPreview', false);
                        self.trigger('on:colorSelect', self.$.color);
                    };
                }

                e.preventDefault();

                this.$pointerDown = true;
                this.set('_showPreview', true);
                this.$colorListHeight = this.$.colorListView.$el.offsetHeight;

                this.dom(this.$stage.$window).bindDomEvent('pointermove', this.$moveHandler);
                this.dom(this.$stage.$window).bindDomEvent('pointerup', this.$upHandler);

                this._updatePanel(e.pointerEvent);
            },

            _updatePanel: function (e) {
                var pos = this.$.colorListView.globalToLocal({x: e.pageX, y: e.pageY});

                var numColors = this.$._numColors,
                    colorIndex = Math.floor((pos.y / this.$colorListHeight) * numColors);
                if (colorIndex >= 0 && colorIndex < this.$._numColors) {
                    this.set({
                        '_previewColor': this.$.colors.at(colorIndex)
                    });
                }
            },

            _updateColorPickerZoom: function (colorIndex, itemHeight) {
                this.$.colorPickerZoom.$el.style["top"] = (colorIndex + 0.5) * itemHeight + "px";
            },

            _render_previewColor: function (color, oldColor) {
                if (color && this.$.colors) {
                    var index = this.$.colors.indexOf(color);
                    if (index > -1) {
                        this._updateColorPickerZoom(index, this.$.itemHeight);
                    }
                } else {
                    // TODO:
                }
            },
//
            _commitColor: function (color) {
                if (color) {
                    this.set('_previewColor', color);
                }
            }

        });
    }
);