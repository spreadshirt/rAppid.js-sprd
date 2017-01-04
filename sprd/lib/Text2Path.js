define([], function() {
    return function(textNode, svgFont, options, callback) {

        options = options || {};

        var svgNamespace = 'http://www.w3.org/2000/svg',
            nsResolver = function(prefix) {
                var ns = {
                    'svg': svgNamespace
                };
                return ns[prefix] || null;
            };


        loadFont(svgFont, function(err, font) {

            if (err) {
                console.error(err);
                return;
            }

            var svg = document.createElementNS(svgNamespace, "svg");
            svg.setAttribute("viewBox", "0 0 100 100");

            if (options.fill) {
                svg.setAttribute("fill", options.fill);
            }

            svg.setAttribute("style", "opacity: 0; position: fixed; width: 1000px; height: 1000px; left: 0; top: 0; z-index: 999; pointer-events: none");

            var body = document.body || document.getElementsByTagName("body")[0];
            body.appendChild(svg);

            var clone = textNode.cloneNode(true);
            svg.appendChild(clone);


            clone.setAttribute("fill", "blue");

            var text = textNode.textContent,
                x = 0,
                i,
                chars = (text || "").replace(/^\s+|\s+$/g, "");

            var textPath;

            for (i = 0; i < clone.childNodes.length; i++) {
                if (clone.childNodes[i].localName == 'textPath') {
                    textPath = clone.childNodes[i];
                }
            }

            if (!textPath) {
                callback && callback("textPath not found");
                return;
            }

            textPath.textContent = "";

            for (i = 0; i < chars.length; i++) {
                if (chars[i] == " ") {
                    textPath.appendChild(document.createTextNode(" "));
                } else {
                    var tSpan = document.createElementNS(svgNamespace, "tspan");
                    tSpan.textContent = chars[i];
                    textPath.appendChild(tSpan);
                }


            }

            var number = 1;

            var unitsPerEm = xpath("//svg:font-face/@units-per-em", number) || 1000,
                defaultHorizontAdvX = xpath("//svg:font/@horiz-adv-x", number) || unitsPerEm,
                ascent = xpath("//svg:font-face/@ascent", number) || 0,
                descent = xpath("//svg:font-face/@descent", number) || 0,
                missingGlyphHorizontAdvX = xpath("//svg:missing-glyph/@horiz-adv-x", number) || 0,
                scale = parseInt(textNode.getAttribute("font-size") || 16) / unitsPerEm;

            var group = document.createElementNS(svgNamespace, "g");
            svg.appendChild(group);

            for (i = 0; i < chars.length; i++) {

                var char = chars[i],
                    glyph = (char != "'" ? xpath("//svg:glyph[@unicode='" + char + "']")[0] : null ) ||
                        xpath("//svg:glyph[@unicode='&#x" + chars.charCodeAt(i).toString(16) + "']")[0];


                if (!glyph) {
                    x += missingGlyphHorizontAdvX;
                    continue;
                }

                var d = glyph.getAttribute("d");

                if (d) {
                    var path = document.createElementNS(svgNamespace, "path");
                    var g = document.createElementNS(svgNamespace, "g");
                    var r = document.createElementNS(svgNamespace, "rect");
                    path.setAttribute("d", d);


                    var span = document.createElementNS(svgNamespace, "tspan");
                    var test = document.createElementNS(svgNamespace, "text");
                    span.textContent = chars[i];
                    svg.appendChild(test);
                    test.setAttribute("font-family", textNode.getAttribute("font-family"));
                    test.setAttribute("font-size", textNode.getAttribute("font-size"));
                    test.appendChild(span);
                    var spanTest = span.getExtentOfChar(0);

                    var width = glyph.getAttribute("horiz-adv-x") || defaultHorizontAdvX;
                    r.setAttribute("width", spanTest.width / scale);
                    r.setAttribute("height", spanTest.height / scale);

                    svg.removeChild(test);

                    var tspan = textPath.childNodes[i];

                    var rotationOfChar = tspan.getRotationOfChar(0);


                    var s = "scale(" + scale + ") rotate(" + rotationOfChar + ")";

                    g.setAttribute("transform", s);

                    var transform = "translate(0," + (ascent - descent) + ") scale(1,-1) ";
                    path.setAttribute("transform", transform);
                    g.appendChild(path);
                    g.appendChild(r);

                    group.appendChild(g);
                    r.setAttribute("style", "fill: red; opacity: 0.5");
                    g.setAttribute("width", width);

                    if (tspan.getNumberOfChars() <= 0) {
                        continue;
                    }

                    var box = tspan.getExtentOfChar(0);
                    var rect = r.getBoundingClientRect();

                    var xOffset = box.x - (rect.left / 10);
                    var yOffset = box.y - (rect.top / 10);

                    transform = "translate(" + xOffset + "," + yOffset + ") " + s;
                    g.setAttribute("transform", transform);

                    if (!rotationOfChar && Math.abs(xOffset) < 1 && Math.abs(yOffset) < 1) {
                        //char is not visible on path
                        group.removeChild(g);
                        continue;
                    }

                    if (descent) {
                        transform = "translate(0," + ascent + ") scale(1,-1) ";
                        path.setAttribute("transform", transform);
                    }

                    g.removeChild(r);
                }

                x += parseInt(glyph.getAttribute("horiz-adv-x") || defaultHorizontAdvX);

            }

            svg.removeChild(clone);
            var bBox = group.getBBox();

            svg.setAttribute("viewBox", [0, 0, bBox.width + bBox.x, bBox.height + bBox.y].join(" "));
            if (options.width) {
                svg.setAttribute("width", options.width);
            }
            svg.removeAttribute("style");

            body.removeChild(svg);

            svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            callback && callback(false, svg.outerHTML);


            function xpath (expression, type) {
                var xpathMap = {
                    1: "numberValue",
                    2: "stringValue",
                    3: "booleanValue"
                };

                if (font.evaluate) {
                    var iterator = font.evaluate(expression, font, nsResolver, type, null);

                    if (type) {
                        return iterator[xpathMap[type]];
                    }

                    var result = [],
                        node;
                    while (node = iterator.iterateNext()) {
                        result.push(node);
                    }

                    return result;
                } else {

                    if (type) {
                        var text = font.selectSingleNode(expression).text;
                        if (xpathMap[type] == "numberValue") {
                            text = parseFloat(text);
                        }
                        return text;
                    } else {
                        return font.selectNodes(expression);
                    }

                }


            }


        });

        function loadFont (svgFontSrc, callback) {

            var xhr = new XMLHttpRequest();
            xhr.open("GET", svgFontSrc, true);
            xhr.onreadystatechange = function(e) {
                if (xhr.readyState === 4) {

                    if (xhr.status === 200) {
                        try {
                            var doc = new ActiveXObject('Microsoft.XMLDOM');
                            doc.loadXML(xhr.responseText);

                            doc.setProperty("SelectionNamespaces", "xmlns:svg='" + svgNamespace + "'");
                            doc.setProperty("SelectionLanguage", "XPath");

                            callback && callback(null, doc);
                        } catch (e) { // deal with case that ActiveXObject is not supported }
                            callback && callback(null, xhr.responseXML);
                        }

                    } else {
                        return callback && callback("Cannot load " + svgFontSrc);
                    }
                }
            };
            xhr.send();
        }

    };

});

