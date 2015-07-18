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

                switch (true) {
                case backgroundImageElement && width === 'background':
                    canvasElement.width = backgroundImageElement.width;
                    break;

                case parent && width === 'parent':
                    canvasElement.width = parent.canvasElement.width;
                    break;

                case !!width:
                    canvasElement.width = width;
                    break;
                }

                switch (true) {
                case backgroundImageElement && height === 'background':
                    canvasElement.height = backgroundImageElement.height;
                    break;

                case parent && height === 'parent':
                    canvasElement.height = parent.canvasElement.height;
                    break;

                case !!width:
                    canvasElement.height = height;
                    break;
                }
            },

            /** @private */
            _renderBackground: function () {
                var canvasAttributes = this.canvasAttributes,
                    backgroundImageElement = this.backgroundImageElement,
                    backgroundColor = canvasAttributes.getItem('backgroundColor');

                if (backgroundColor) {
                    candystore.CanvasUtils.fillWithColor(this, backgroundColor);
                }

                if (backgroundImageElement) {
                    candystore.CanvasUtils.drawImage(this, backgroundImageElement);
                }
            },

            /**
             * @param {candystore.Canvas} childCanvas
             * @private
             */
            _renderChildCanvas: function (childCanvas) {
                var childPosition = childCanvas.getRelativePosition(),
                    childElement = childCanvas.canvasElement,
                    canvasElement = this.canvasElement,
                    ctx = canvasElement.getContext('2d');

                ctx.drawImage(childElement, childPosition.left, childPosition.top);
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
                this.setEventPath(this.getLineage().prepend(self.eventPath));
                return this;
            },

            /**
             * @returns {candystore.Canvas}
             */
            removeFromParent: function () {
                shoeshine.Progenitor.removeFromParent.call(this);
                this.setEventPath([String(this.instanceId)].toPath().prepend(self.eventPath));
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
             * Retrieves the canvas' position relative to the parent Canvas instance.
             * @returns {{top: number, left: number}}
             */
            getRelativePosition: function () {
                var parentElement = this.parent.canvasElement,
                    canvasElement = this.canvasElement,
                    canvasAttributes = this.canvasAttributes,
                    top = canvasAttributes.getItem('top'),
                    left = canvasAttributes.getItem('left');

                return {
                    top : top === 'center' ?
                        (parentElement.height - canvasElement.height) / 2 :
                        top || 0,
                    left: left === 'center' ?
                        (parentElement.width - canvasElement.width) / 2 :
                        left || 0
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
                    relativePosition;

                while (canvas.parent) {
                    relativePosition = canvas.getRelativePosition();
                    result.top += relativePosition.top;
                    result.left += relativePosition.left;
                    canvas = canvas.parent;
                }

                return result;
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
