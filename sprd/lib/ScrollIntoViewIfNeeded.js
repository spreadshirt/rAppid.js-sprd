define([], function () {

    var undefined;

    // easing functions http://goo.gl/5HLl8
    Math.easeInOutQuad = function (t, b, c, d) {
        t /= d / 2;
        if (t < 1) {
            return c / 2 * t * t + b
        }
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    };

    // requestAnimationFrame for Smart Animating http://goo.gl/sx5sts
    var requestAnimationFrame = (function () {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    })();


    /***
     *
     * @param {String|HTMLElement} idOrElement
     * @param {Number} [offset=0]
     * @param {Number} [duration=500]
     * @param {Function} callback
     */
    return function (idOrElement, offset, duration, callback) {

        if (offset instanceof Function) {
            callback = offset;
            offset = 0;
        }

        if (duration instanceof Function) {
            callback = duration;
            duration = null;
        }

        duration = (duration == null) ? 500 : duration;
        offset = offset || 0;

        if (!idOrElement) {
            callback && callback();
            return;
        }

        var to = undefined,
            element;

        if (idOrElement instanceof Number) {
            to = idOrElement;
        } else if (typeof(idOrElement) === "string") {
            element = document.querySelector(idOrElement);
        } else if (idOrElement instanceof (window.HTMLElement || window.Element)) {
            element = idOrElement;
        }

        if (!element) {
            callback && callback();
            return;
        }

        // find the parent that has an overflow

        var parent = element.parentNode,
            computedStyle;

        while (parent) {
            if (parent.nodeType == 9) {
                return;
            }

            try {
                computedStyle = window.getComputedStyle(parent, null);
            } catch (e) {
            }

            if (computedStyle.overflowY == "auto" || computedStyle.overflowY == "scroll" || computedStyle.overflowX == "auto" || computedStyle.overflowX == "scroll") {
                break;
            }

            parent = parent.parentNode;
        }

        if (!parent) {
            callback && callback();
        }

        // check if the element is in the view
        var parentRect = parent.getBoundingClientRect(),
            rect = element.getBoundingClientRect(),
            scrollToX = null,
            scrollToY = null;

        if ((computedStyle.overflowX == "auto" || computedStyle.overflowX == "scroll") &&
            rect.left < parentRect.left || rect.left >= parentRect.left + parentRect.width
        ) {
            scrollToX = parent.scrollLeft + (rect.left - (parentRect.left + parentRect.width) / 2);
        }

        if ((computedStyle.overflowY == "auto" || computedStyle.overflowY == "scroll") &&
            rect.top < parentRect.top || rect.top >= parentRect.top + parentRect.height
        ) {

        }


        scrollTo(scrollToX, scrollToY);

        function scrollTo(toX) {

            // figure out if this is moz || IE because they use documentElement
            var startX = parent.scrollLeft,
                change = toX - startX,
                currentTime = 0,
                increment = 20;

            var animateScroll = function () {
                // increment the time
                currentTime += increment;
                // find the value with the quadratic in-out easing function

                if (toX != null) {
                    parent.scrollLeft = Math.easeInOutQuad(currentTime, startX, change, duration);
                }

                // do the animation unless its over
                if (currentTime < duration) {
                    requestAnimationFrame(animateScroll);
                } else {
                    callback && callback();
                }
            };

            animateScroll();
        }

    };

});