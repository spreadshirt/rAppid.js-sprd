define(["underscore"], function (_) {

    return {
        clamp: function (value, min, max) {

            if (min > max) {
                throw new Error('Min is bigger than max.');
            }

            return Math.min(Math.max(value, min), max);
        },
    };

});
