define(["js/ui/View"], function (View) {
    return View.inherit('sprd.view.ConfomatClass', {

        defaults: {
            width: 980,
            height: 650,
            mode: "D2C",

            api: "http://api.spreadshirt.net/api",
            imageServer: "http://image.spreadshirt.net/image-server",

            context: "shop",
            contextId: "205909"
        }

    });
});