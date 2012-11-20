define(['js/ui/View', 'js/core/List', 'sprd/entity/FileSystemImage'],
    function(View, List, FileSystemImage) {

    return View.inherit('sprd.view.ImageUploadClass', {

        defaults: {
            items: List,
            imageWidth: 100,
            displayNotice: true
        },

        initialize: function() {
            this.callBase();

            var self = this;
            this.$.items.bind('add', function() {
                self.set('displayNotice', self.$.items.size() === 0);
            });

            this.$.items.bind('remove', function () {
                self.set('displayNotice', self.$.items.size() === 0);
            })
        },


        dragEnter: function() {
            this.addClass('drag-over');
            return false;
        },

        dragExit: function() {
            this.removeClass('drag-over');
            return false;
        },

        dropImage: function(e) {
            this.removeClass('drag-over');
            if (e && e.$) {

                e = e.$;
                var self = this;

                function addFile(file) {
                    var reader = new FileReader();

                    reader.onload = function (evt) {
                        var img = new FileSystemImage({
                            file: file,
                            url: evt.target.result
                        });

                        self.$.items.add(img);
                    };

                    reader.readAsDataURL(file)
                }

                if (e.dataTransfer && e.dataTransfer.files.length) {

                    for (var i = 0; i < e.dataTransfer.files.length; i++) {
                        addFile(e.dataTransfer.files[i]);
                    }

                }

                e.preventDefault();
                return false;
            }
        }
    });
});