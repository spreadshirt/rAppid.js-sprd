define(["js/ui/View", "js/core/List"], function (View, List) {

        return View.inherit('designer.view.SimpleHorizontalColorPickerClass', {

            defaults: {
                color: null,
                colors: List,
                itemWidth: 20,
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

                e.stopPropagation();

                this.$pointerDown = true;
                this.set('_showPreview', true);
                this.$tableWidth = this.$.colorList.$el.offsetWidth;

                this.$columnWidth = this.$tableWidth / this.$._numColors;

                this.dom(this.$stage.$window).bindDomEvent('pointermove', this.$moveHandler);
                this.dom(this.$stage.$window).bindDomEvent('pointerup', this.$upHandler);

                this._updatePanel(e.pointerEvent);
            },
            _updatePanel: function (e) {
                var pos = this.$.colorList.globalToLocal({x: e.pageX, y: e.pageY});

                var numColors = this.$._numColors,
                    colorIndex = Math.max(Math.min(this.$._numColors - 1, Math.floor((pos.x / this.$tableWidth) * numColors)), 0);

                this.set({
                    '_previewColor': this.$.colors.at(colorIndex)
                });
            },

            _updateColorPickerZoom: function (colorIndex, itemWidth) {
                this.$.colorPickerZoom.$el.style["left"] = (colorIndex + 0.5) * itemWidth + "px";
            },

            _render_previewColor: function (color) {
                if (color && this.$.colors) {
                    var index = this.$.colors.indexOf(color);
                    if (index > -1) {
                        this._updateColorPickerZoom(index, this.$.itemWidth);
                    }
                } else {
                    // TODO:
                }
            },

            _commitColor: function (color) {
                if (color) {
                    this.set('_previewColor', color);
                }
            }

        });
    }
);