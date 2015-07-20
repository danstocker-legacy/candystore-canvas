/*global dessert, troop, sntls, evan, candystore, shoeshine */
troop.postpone(candystore, 'Canvas', function (ns, className) {
    "use strict";

    var base = troop.Base,
        self = base.extend()
            .addTrait(evan.Evented)
            .addTrait(shoeshine.Progenitor)
            .extend(className);

    /**
     * @name candystore.Canvas.create
     * @function
     * @returns {candystore.Canvas}
     */

    /**
     * @class
     * @extends troop.Base
     * @extends evan.Evented
     * @extends shoeshine.Progenitor
     */
    candystore.Canvas = self
        .setEventSpace(shoeshine.widgetEventSpace)
        .setEventPath('canvas'.toPath())
        .addConstants(/** @lends candystore.Canvas */{
            /** @constant */
            EVENT_BACKGROUND_LOAD: 'background-load',

            /** @constant */
            EVENT_ATTRIBUTE_CHANGE: 'attribute-change'
        })
        .addPrivateMethods(/** @lends candystore.Canvas# */{
            /**
             * @param {object} canvasAttributes
             * @private
             */
            _applyImmediateAttributes: function (canvasAttributes) {
                var that = this,
                    currentCanvasAttributes = this.canvasAttributes,
                    backgroundImage = canvasAttributes.backgroundImage;

                if (backgroundImage && backgroundImage !== currentCanvasAttributes.getItem('backgroundImage')) {
                    backgroundImage.toImageUrl().loadImage()
                        .then(function (imageUrl, imageElement) {
                            that.backgroundImageElement = imageElement;
                            that.triggerSync(that.EVENT_BACKGROUND_LOAD);
                        });
                }
            },

            /** @private */
            _applyDimensions: function () {
                var canvasElement = this.canvasElement,
                    canvasAttributes = this.canvasAttributes,
                    backgroundImageElement = this.backgroundImageElement,
                    width = canvasAttributes.getItem('width'),
                    height = canvasAttributes.getItem('height'),
                    parent = this.parent;

                canvasElement.width = backgroundImageElement && width === 'background' ?
                    backgroundImageElement.width :
                    candystore.UnitUtils.parseDimension(width, parent && parent.canvasElement.width);

                canvasElement.height = backgroundImageElement && height === 'background' ?
                    backgroundImageElement.height :
                    candystore.UnitUtils.parseDimension(height, parent && parent.canvasElement.height);
            },

            /** @private */
            _renderBackground: function () {
                var canvasAttributes = this.canvasAttributes,
                    backgroundImageElement = this.backgroundImageElement,
                    backgroundColor = canvasAttributes.getItem('backgroundColor');

                if (backgroundColor) {
                    candystore.CanvasUtils.fillWithColor(this, backgroundColor);
                }

                if (backgroundImageElement && backgroundImageElement.height && backgroundImageElement.width) {
                    candystore.CanvasUtils.drawImage(this, backgroundImageElement);
                }
            },

            /**
             * @param {candystore.Canvas} childCanvas
             * @private
             */
            _renderChildCanvas: function (childCanvas) {
                if (childCanvas.canvasAttributes.getItem('display') === 'none') {
                    return;
                }

                var childElement = childCanvas.canvasElement;

                if (!childElement.width || !childElement.height) {
                    return;
                }

                var childPosition = childCanvas.getRelativePosition(),
                    childScaling = childCanvas.getRelativeScaling(),
                    canvasElement = this.canvasElement,
                    ctx = canvasElement.getContext('2d');

                ctx.drawImage(
                    childElement,
                    childPosition.left,
                    childPosition.top,
                    childElement.width * childScaling.width,
                    childElement.height * childScaling.height);
            },

            /** @private */
            _applyFilters: function () {
                var canvasAttributes = this.canvasAttributes,
                    hue = canvasAttributes.getItem('hue'),
                    overlayColor = canvasAttributes.getItem('overlayColor'),
                    overlayAlpha = canvasAttributes.getItem('overlayAlpha');

                if (hue) {
                    candystore.CanvasUtils.makeMonochrome(this, hue);
                }

                if (overlayColor) {
                    candystore.CanvasUtils.addColorOverlay(this, overlayColor, overlayAlpha || 0);
                }
            }
        })
        .addMethods(/** @lends candystore.Canvas# */{
            /**
             * @ignore
             */
            init: function () {
                shoeshine.Progenitor.init.call(this);

                /**
                 * @type {HTMLElement}
                 */
                this.canvasElement = document.createElement('canvas');

                /**
                 * @type {sntls.Collection}
                 */
                this.canvasAttributes = sntls.Collection.create();

                /**
                 * @type {HTMLElement}
                 */
                this.backgroundImageElement = undefined;

                this.setEventPath([String(this.instanceId)].toPath().prepend(self.eventPath));
            },

            /**
             * @param {candystore.Canvas} parent
             * @returns {candystore.Canvas}
             */
            addToParent: function (parent) {
                shoeshine.Progenitor.addToParent.call(this, parent);
                this.updateEventPath();
                return this;
            },

            /**
             * @returns {candystore.Canvas}
             */
            removeFromParent: function () {
                shoeshine.Progenitor.removeFromParent.call(this);
                this.updateEventPath();
                return this;
            },

            /**
             * @returns {candystore.Canvas}
             */
            updateEventPath: function () {
                this.setEventPath(this.getLineage().prepend(self.eventPath));
                this.children.callOnEachItem('updateEventPath');
                return this;
            },

            /**
             * @param {object} canvasAttributes
             * @returns {candystore.Canvas}
             */
            setCanvasAttributes: function (canvasAttributes) {
                // applying attributes that must be set immediately
                this._applyImmediateAttributes(canvasAttributes);

                // merging new / changed attributes
                var currentCanvasAttributes = this.canvasAttributes,
                    attributeNames = Object.keys(canvasAttributes),
                    i, attributeName, attributeValue,
                    hasChanged = false;

                for (i = 0; i < attributeNames.length; i++) {
                    attributeName = attributeNames[i];
                    attributeValue = canvasAttributes[attributeName];
                    if (attributeValue !== currentCanvasAttributes.getItem(attributeName)) {
                        currentCanvasAttributes.setItem(attributeName, attributeValue);
                        hasChanged = true;
                    }
                }

                if (hasChanged) {
                    this.triggerSync(this.EVENT_ATTRIBUTE_CHANGE);
                }

                return this;
            },

            /**
             * Retrieves the canvas' scaling ratios relative to the parent Canvas instance.
             * @returns {{width: number, height: number}}
             */
            getRelativeScaling: function () {
                var parent = this.parent,
                    parentElement = parent && parent.canvasElement,
                    canvasElement = this.canvasElement,
                    canvasAttributes = this.canvasAttributes,
                    childWidth = canvasAttributes.getItem('childWidth'),
                    childHeight = canvasAttributes.getItem('childHeight'),
                    xScaling = candystore.UnitUtils.parseDimension(childWidth, parentElement && parentElement.width) / canvasElement.width,
                    yScaling = candystore.UnitUtils.parseDimension(childHeight, parentElement && parentElement.height) / canvasElement.height;

                return {
                    width : xScaling || yScaling || 1,
                    height: yScaling || xScaling || 1
                };
            },

            /**
             * Retrieves the canvas' position relative to the parent Canvas instance.
             * @returns {{top: number, left: number}}
             */
            getRelativePosition: function () {
                var parentElement = this.parent.canvasElement,
                    canvasElement = this.canvasElement,
                    canvasAttributes = this.canvasAttributes,
                    top = canvasAttributes.getItem('top'),
                    left = canvasAttributes.getItem('left'),
                    scaling = this.getRelativeScaling();

                return {
                    top : top === 'center' ?
                        (parentElement.height - (canvasElement.height * scaling.width)) / 2 :
                        candystore.UnitUtils.parseDimension(top, parentElement && parentElement.height) || 0,
                    left: left === 'center' ?
                        (parentElement.width - (canvasElement.width * scaling.height)) / 2 :
                        candystore.UnitUtils.parseDimension(left, parentElement && parentElement.width) || 0
                };
            },

            /**
             * Retrieves the canvas' position relative to the CanvasContainer.
             * @returns {{top: number, left: number}}
             */
            getAbsolutePosition: function () {
                var result = {
                        top : 0,
                        left: 0
                    },
                    canvas = this,
                    parent = canvas.parent,
                    relativePosition,
                    relativeScaling;

                while (parent) {
                    relativePosition = canvas.getRelativePosition();
                    relativeScaling = parent.getRelativeScaling();
                    result.top += relativePosition.top * relativeScaling.height;
                    result.left += relativePosition.left * relativeScaling.width;
                    canvas = canvas.parent;
                    parent = canvas.parent;
                }

                return result;
            },

            /**
             * Gets absolute size of the Canvas.
             * @returns {{width: number, height: number}}
             */
            getAbsoluteSize: function () {
                var canvasElement = this.canvasElement,
                    absoluteScaling = {
                        width : 1,
                        height: 1
                    },
                    canvas = this,
                    relativeScaling;

                while (canvas.parent) {
                    relativeScaling = canvas.getRelativeScaling();
                    absoluteScaling.width = absoluteScaling.width * relativeScaling.width;
                    absoluteScaling.height = absoluteScaling.height * relativeScaling.height;
                    canvas = canvas.parent;
                }

                return {
                    width : canvasElement.width * absoluteScaling.width,
                    height: canvasElement.height * absoluteScaling.height
                };
            },

            /**
             * @returns {candystore.Canvas}
             */
            render: function () {
                this._applyDimensions();
                this._renderBackground();

                this.children
                    .callOnEachItem('render')
                    .passEachItemTo(this._renderChildCanvas, this);

                this._applyFilters();

                return this;
            }
        });
});
