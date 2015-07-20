/*global candystore */
(function () {
    "use strict";

    var red = candystore.Canvas.create()
            .setChildName('red')
            .setCanvasAttributes({
                width          : 300,
                height         : 300,
                backgroundColor: '#ff0000'
            }),
        green = candystore.Canvas.create()
            .setChildName('green')
            .setCanvasAttributes({
                width          : 100,
                height         : 100,
                childWidth     : '30%',
                top            : 10,
                left           : 20,
                backgroundColor: '#00ff00',
                backgroundImage: 'logo.png',
                overlayColor   : [255, 0, 0],
                overlayAlpha   : 0.2
            }),
        blue = candystore.Canvas.create()
            .setChildName('blue')
            .setCanvasAttributes({
                width          : '75%',
                height         : '50%',
                top            : '25%',
                left           : 'center',
                backgroundColor: '#0000ff'
            }),
        teal = candystore.Canvas.create()
            .setChildName('teal')
            .setCanvasAttributes({
                width          : 'background',
                height         : 'background',
                childWidth     : 100,
                top            : 'center',
                left           : 'center',
                backgroundColor: '#00ffff',
                backgroundImage: 'logo.png'
            });

    candystore.CanvasContainer.create()
        .renderInto(document.body)
        .setCanvas(red
            .addChild(green)
            .addChild(teal));

    green
        .addChild(blue)
        .setCanvasAttributes({
            height: 150
        });

    teal.setCanvasAttributes({
        hue: 1.1
    });
}());
