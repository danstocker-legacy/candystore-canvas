/*global dessert, troop, sntls, evan, shoeshine, app */
troop.postpone(candystore, 'UnitUtils', function () {
    "use strict";

    var base = troop.Base,
        self = base.extend();

    /**
     * @class
     * @extends troop.Base
     */
    candystore.UnitUtils = self
        .addConstants(/** @lends candystore.UnitUtils */{
            /**
             * @type {RegExp}
             * @constant
             */
            RE_PERCENTAGE: /^\s*(\d+(?:\.\d+)?)%\s*$/
        })
        .addMethods(/** @lends candystore.UnitUtils# */{
            /**
             * @param {string|number} dimension
             * @param {number} parentDimension
             * @returns {number}
             */
            parseDimension: function (dimension, parentDimension) {
                var parsedDimension;
                switch (typeof dimension) {
                case 'string':
                    parsedDimension = this.RE_PERCENTAGE.exec(dimension);
                    return parsedDimension ?
                        parseFloat(parsedDimension[1]) * parentDimension / 100 :
                        undefined;

                case 'number':
                    return dimension;

                default:
                    return undefined;
                }
            }
        });
});
