define(['sprd/view/svg/ConfigurationRenderer'], function(ConfigurationRenderer) {

    return ConfigurationRenderer.inherit("sprd/view/svg/TextConfigurationRenderer", {

        ctor: function() {
            this.callBase();

            this.bind('configuration', 'change:text', function() {
                this.$configurationViewer._transform(this.render(this.$paper));
            }, this)
        },

        _render: function(paper) {
            this.callBase();

            if (!this.$.configuration) {
                return null;
            }

            return paper.print(0, 0, this.get('configuration.text'), paper.getFont(this.get('configuration.font')), this.get('configuration.fontSize'));
        }
    })
});