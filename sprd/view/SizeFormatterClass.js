define(["js/ui/TextWrapper"], function (TextWrapper) {

    return TextWrapper.inherit({

        defaults: {
            componentClass: 'size-formatter',
            size: null,
            string: "{formatSizeName(size.name)}"
        },

        formatSizeName: function (sizeName) {
            sizeName = sizeName || "";

            var match = sizeName.match(/(.+)(\(.+\))/);
            if (match) {
                return match[1] + "[" + match[2] + "|0]";
            }

            return sizeName;
        }
    });


});