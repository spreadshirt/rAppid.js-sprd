define(["js/data/validator/Validator", "underscore"], function(Validator, _) {

    return Validator.inherit("sprd.data.validator.LengthValidator", {
        defaults: {
            errorCode: 'maxLengthError',
            /**
             * The min length of the input
             *
             * @type number
             */
            minLength: 0,
            /**
             * The max length of the input
             * -1 is for unlimited
             *
             * @type number
             */
            maxLength: -1
        },
        _validate: function (entity, options) {
            var value = entity.get(this.$.field),
                schemaDefinition = entity.schema[this.$.field],
                required = schemaDefinition ? schemaDefinition.required : true;


            if (_.isString(value) && (required && value.length || !required)) {

                if (value.length < this.$.minLength || (this.$.maxLength > -1 && value.length > this.$.maxLength)) {
                    return this._createFieldError();
                }
            }
        }
    });
});