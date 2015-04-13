define(["js/core/Error"], function (Error) {

    var DesignUploadError = Error.inherit('sprd.error.DesignUploadError', {
    });

    DesignUploadError.ErrorCodes = {
        DESIGN_RELOAD_ERROR: "-201",
        DESIGN_RELOAD_ZERO_WIDTH: "-202",
        DESIGN_RELOAD_ZERO_WIDTH_NOT_FIXABLE: "-203",
        DESIGN_UPLOAD_ERROR: "-204",
        DESIGN_SAVE_ERROR: "-205",
        DESIGN_UPLOAD_TIMEOUT: "-206",
        DESIGN_UPLOAD_EXTRACT_IMAGE: "-207",
        DESIGN_UPLOAD_SIZE_ERROR: "-208",
        DESIGN_UPLOAD_IMAGE_TO_LARGE: "-209",
        DESIGN_VECTOR_REJECTED: "-210"
    };

    return DesignUploadError;
});