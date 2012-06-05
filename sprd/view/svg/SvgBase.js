define(['js/core/Bindable'], function (Bindable) {
    return Bindable.inherit('sprd/view/svg/SvgBase', {

        render: function (paper) {
            this.$paper = paper;
            this.$svg = this._render(paper);

            return this.$svg;
        },

        _render: function (paper) {
            // abstract, which implements the render logic
            return this._clear();
        },

        _clear: function () {
            if (this.$svg) {
                this.$svg.remove();
                this.$svg = null;
            }
        },

        destroy: function () {
            this._clear();
        }

    });
});