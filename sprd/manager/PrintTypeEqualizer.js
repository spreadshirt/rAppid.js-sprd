define(["js/core/Bindable", "sprd/util/ProductUtil", "sprd/entity/ConcreteElement"], function (Bindable, ProductUtil, ConcreteElement) {


    return Bindable.inherit('sprd.manager.PrintTypeEqualizer', {
            inject: {
                concreteElement: ConcreteElement
            },

            _setUp: function () {
                this.callBase();

                this.$.concreteElement.bind('getProduct().configurations', 'add', this._handleConfigurationAdd, this);
                this.$.concreteElement.bind('getProduct().configurations', 'remove', this._handleConfigurationRemove, this);
                this.$.concreteElement.bind('getProduct().configurations', 'item:printTypeSwitched', this._handlePrintTypeTransformed, this);
            },


            _tearDown: function () {
                this.callBase();

                this.$.concreteElement.unbind('getProduct().configurations', 'add', this._handleConfigurationAdd, this);
                this.$.concreteElement.unbind('getProduct().configurations', 'remove', this._handleConfigurationRemove, this);
                this.$.concreteElement.unbind('getProduct().configurations', 'item:printTypeSwitched', this._handlePrintTypeTransformed, this);
            },

            _handleConfigurationAdd: function (e) {
                this.equalizeConfigurations(this.$.concreteElement.getProduct(), e.$.item.$.printArea, e.$.item.$.printType);
            },

            _handleConfigurationRemove: function (e) {
                this.revertEqualization(this.$.concreteElement.getProduct(), e.$.item.$.printArea);
            },

            _handlePrintTypeTransformed: function (e) {
                this.equalizeConfigurations(this.$.concreteElement.getProduct(), e.$.item.$.printArea, e.$.item.$.printType, e.$.item);
            },

            revertEqualization: function (product, printArea) {
                if (!product) {
                    return;
                }

                var configurations = product.getConfigurationsOnPrintAreas([printArea]);

                for (var i = 0; i < configurations.length; i++) {
                    var config = configurations[i];
                    var originalPrintType = config.$.originalPrintType;
                    if (originalPrintType) {
                        config.set('printType', originalPrintType)
                    }
                }

                this.equalizeConfigurations(product, printArea);
            },

            equalizeConfigurations: function (product, printArea, targetPrintType, excludedConfiguration) {
                if (!printArea || !product || this.$equalizingConfigurations) {
                    return;
                }

                function checkPrintTypeForConfigurations (printType, appearance) {
                    for (i = 0; i < configurations.length; i++) {
                        config = configurations[i];
                        if (excludedConfiguration !== config) {
                            possiblePrintTypes = config.getPossiblePrintTypesForPrintArea(printArea, appearance);

                            if (possiblePrintTypes.indexOf(printType) === -1 || !config.isPrintTypeAvailable(printType)) {
                                return false;
                            }
                        }
                    }
                    return true;
                }

                var configurations = product.getConfigurationsOnPrintAreas([printArea]);
                if (configurations.length > 1) {
                    this.$equalizingConfigurations = true;
                    var appearance = product.get('appearance'),
                        possiblePrintTypesOnPrintArea = ProductUtil.getPossiblePrintTypesForPrintAreas([printArea], appearance),
                        possiblePrintType,
                        possiblePrintTypes,
                        config,
                        i;

                    // if we have a target print type
                    // check if this fits for all
                    if (targetPrintType) {
                        if (checkPrintTypeForConfigurations(targetPrintType)) {
                            possiblePrintType = targetPrintType;
                        }
                    }

                    if (!possiblePrintType && !excludedConfiguration) {
                        for (var j = 0; j < possiblePrintTypesOnPrintArea.length; j++) {
                            if (checkPrintTypeForConfigurations(possiblePrintTypesOnPrintArea[j], appearance)) {
                                possiblePrintType = possiblePrintTypesOnPrintArea[j];
                                break;
                            }
                        }
                    }

                    // switch print type
                    if (possiblePrintType) {
                        for (i = 0; i < configurations.length; i++) {
                            config = configurations[i];
                            if (excludedConfiguration !== config) {
                                if (possiblePrintType !== config.$.printType) {
                                    config.set('originalPrintType', config.$.printType, {silent: true});
                                }
                                config.set('printType', possiblePrintType, {
                                    printTypeEqualized: true,
                                    printTypeTransformed: true
                                });
                            }
                        }
                    }

                    this.$equalizingConfigurations = false;
                }
            }
        },


        {
            getPreferredPrintType: function (product, printArea, possiblePrintTypes) {
                var configurations = product.getConfigurationsOnPrintAreas(printArea);
                if (configurations && configurations.length) {
                    // first sort the possible print types by the configurations that are on print area
                    // so when the first configuration has flock then he returns flock
                    var config,
                        configPrintTypes;
                    for (var k = configurations.length - 1; k >= 0; k--) {
                        config = configurations[k];
                        var index = possiblePrintTypes.indexOf(config.$.printType);
                        if (index > 0) {
                            possiblePrintTypes.unshift(config.$.printType);
                            possiblePrintTypes.slice(index, 1);
                        }
                    }

                    var cache = {};
                    for (var j = 0; j < possiblePrintTypes.length; j++) {
                        var possiblePrintType = possiblePrintTypes[j];
                        var fitsForAll = true;
                        for (var i = 0; i < configurations.length; i++) {
                            config = configurations[i];
                            configPrintTypes = cache[config.$cid] || config.getPossiblePrintTypesForPrintArea(printArea, product.get('appearance'));
                            // if config on same printarea
                            // AND has DD print type
                            // AND this print type is supported
                            // use this print type
                            cache[config.$cid] = configPrintTypes;

                            if (configPrintTypes.indexOf(possiblePrintType) === -1 || possiblePrintTypes.indexOf(possiblePrintType) === -1 || !config.isPrintTypeAvailable(possiblePrintType)) {
                                fitsForAll = false;
                                break;
                            }
                        }
                        if (fitsForAll) {
                            return possiblePrintType;
                        }
                    }
                }
                return null;
            }

        })

});