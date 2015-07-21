/*global dessert, troop, sntls, evan, candystore, shoeshine */
troop.postpone(candystore, 'CanvasContainer', function (ns, className) {
    "use strict";

    var base = shoeshine.Widget,
        self = base.extend(className);

    /**
     * @name candystore.CanvasContainer.create
     * @function
     * @returns {candystore.CanvasContainer}
     */

    /**
     * @class
     * @extends shoeshine.Widget
     */
    candystore.CanvasContainer = self
        .addConstants(/** @lends candystore.CanvasContainer */{
            /** @constant */
            EVENT_CANVAS_UPDATE: 'canvas-update'
        })
        .addPrivateMethods(/** @lends candystore.CanvasContainer# */{
            /** @private */
            _updateCanvas: function () {
                var canvas = this.canvas,
                    element = this.getElement(),
                    canvasElement = canvas && canvas.canvasElement;

                if (canvas && element) {
                    canvasElement.width = element.clientWidth;
                    canvasElement.height = element.clientHeight;
                    canvas.render();
                    element.appendChild(canvasElement);

                    this.triggerSync(this.EVENT_CANVAS_UPDATE);
                }
            }
        })
        .addMethods(/** @lends candystore.CanvasContainer# */{
            /** @ignore */
            init: function () {
                base.init.call(this);

                this.elevateMethods(
                    '_updateCanvas',
                    'onBackgroundLoad',
                    'onAttributeChange');

                /**
                 * @type {candystore.Canvas}
                 */
                this.canvas = undefined;

                /**
                 * @type {sntls.Debouncer}
                 */
                this.updateCanvasDebouncer = this._updateCanvas.toDebouncer();
            },

            /** @ignore */
            afterRender: function () {
                base.afterRender.call(this);
                this._updateCanvas();
            },

            /**
             * Sets the Canvas instance that will manifest in the DOM.
             * @param {candystore.Canvas} canvas
             * @returns {candystore.CanvasContainer}
             */
            setCanvas: function (canvas) {
                var oldCanvas = this.canvas;

                this.canvas = canvas;

                if (oldCanvas) {
                    oldCanvas
                        .unsubscribeFrom(candystore.Canvas.EVENT_BACKGROUND_LOAD, this.onBackgroundLoad)
                        .unsubscribeFrom(candystore.Canvas.EVENT_ATTRIBUTE_CHANGE, this.onAttributeChange);
                }

                canvas
                    .subscribeTo(candystore.Canvas.EVENT_BACKGROUND_LOAD, this.onBackgroundLoad)
                    .subscribeTo(candystore.Canvas.EVENT_ATTRIBUTE_CHANGE, this.onAttributeChange);

                this._updateCanvas();

                return this;
            },

            /**
             * Retrieves a list of Canvas instances inside the current container matching the specified name.
             * @param {string} canvasName
             * @returns {sntls.Collection}
             */
            getCanvasByName: function (canvasName) {
                dessert.isString(canvasName, "Invalid canvas name");

                var canvas = this.canvas;

                return canvas ?
                    canvas.getAllDescendants()
                        .filterBySelector(function (canvas) {
                            return canvas.childName === canvasName;
                        }) :
                    sntls.Collection.create();
            },

            /**
             * @param {evan.Event} event
             * @ignore
             */
            onBackgroundLoad: function (event) {
                var link = evan.pushOriginalEvent(event);
                this.updateCanvasDebouncer.runDebounced(16);
                link.unLink();
            },

            /**
             * @param {evan.Event} event
             * @ignore
             */
            onAttributeChange: function (event) {
                var link = evan.pushOriginalEvent(event);
                this.updateCanvasDebouncer.runDebounced(16);
                link.unLink();
            }
        });
});
