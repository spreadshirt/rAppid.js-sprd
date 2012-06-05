define(['sprd/view/svg/ConfigurationRenderer'], function (Renderer) {

    return Renderer.inherit("sprd/view/svg/TextConfigurationRenderer", {

        ctor: function() {
            this.callBase();

            this.bind('configuration', 'change:text', function(e) {

            });
        },

        _render: function (paper) {
            // this.get('offset.x'), this.get('offset.y')
//            return paper.print(0, 36 / 2, this.get('text'), paper.getFont('cutter'), 36);
        }
    })
});