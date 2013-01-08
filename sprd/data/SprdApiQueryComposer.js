define(["js/data/Query"], function (Query) {


    SprdApiQueryComposer = {

        compose: function (query) {

            query = query.query;
            var params = {};

            if (query.sort) {
                params.sortField = query.sort[0].field;
                params.sortOrder = query.sort[0].direction ? "asc" : "desc";
            }

            if (query.where) {
                params.query = this.translateOperator(query.where);
            }

            if (query.extra) {
                for (var key in query.extra) {
                    if (query.extra.hasOwnProperty(key)) {
                        params[key] = query.extra[key];
                    }
                }
            }

            return params;
        },

        translateOperator: function (operator, depth) {
            depth = depth === undefined ? 0 : depth;
            var name = operator.operator;
            if (operator instanceof Query.Where) {
                return this.translateExpressions(operator.expressions, depth + 1).join(" ");
            } else if (operator instanceof Query.Comparator) {

                if (name === "in") {
                    return ["+",operator.field,":(", operator.value.join(" "),")"].join("");
                } else if (name === "eql") {
                    return operator.value;
                }
            }

            return "";
        },

        translateExpressions: function (expressions, depth) {
            var ret = [];
            for (var i = 0; i < expressions.length; i++) {
                ret.push(this.translateOperator(expressions[i], depth));
            }
            return ret;
        }

    };

    return SprdApiQueryComposer;

});