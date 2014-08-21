/**************\
| ROTATE UNITS |-----------------------------------------------------------------------------------------------
\**************/

(function () {

    // CONVERSION HELPERS

    var conv = {
        deg: {
            rad: function (deg) {
                return deg % 360 * Math.PI / 180;
            }
        },
        rad: {
            deg: function (rad) {
                return rad * 180 / Math.PI % 360;
            },
            rad: function (rad) { return rad; },
            grad: function (rad) {
                return rad / Math.PI * 200;
            },
            turn: function (rad) {
                return rad / Math.PI / 2;
            }
        }
    };

    // SETUP

    var win = document.getElementById('rotate-units');
    var output = document.getElementById('rotate-units-value');

    var rotates = ['deg', 'rad', 'grad', 'turn'];
    var ridx = 0;
    var transBuilder = new TransformBuilder(output.textContent);
    var tbidx;
    transBuilder.parts.forEach(function (part, i) {
        if (part.type.substr(0, 6) === 'rotate') {
            tbidx = i;
            part.rad = conv.deg.rad(parseFloat(part.values[0]));
        }
    });

    win.querySelector('.tr-icon-rotate').addEventListener('click', function () {
        var oldUnit = rotates[ridx];
        ridx = (ridx + 1) % rotates.length;
        var newUnit = rotates[ridx];
        this.classList.remove('tr-icon-' + oldUnit);
        this.classList.add('tr-icon-' + newUnit);
        convert(newUnit);
        update();
    }, false);

    function convert(newUnit) {
        var rad = transBuilder.getPart(tbidx).rad;
        var newValue = conv.rad[newUnit](rad);
        newValue = Math.round(newValue * 1000) / 1000;
        transBuilder.setPart(tbidx, ['' + newValue + newUnit]);
    }

    function update() {
        output.textContent = transBuilder.toString();
    }

})();


/********************\
| TRANSFORM PREVIEWS |-----------------------------------------------------------------------------------------
\********************/

(function () {

    var win = document.getElementById('transform-previews');
    var output = document.getElementById('transform-previews-value');

    var CRAPPY_HARDCODED_MAX_SIZE = 14; // Pixels
    var transBuilder = new TransformBuilder(output.textContent);
    update();

    function update() {
        output.innerHTML = '';
        transBuilder.parts.forEach(function (part) {
            var el = put(output, 'span.trans-part')
            buildPreview(el, part)
            put(el, '$', TransformBuilder.partToString(part));
        });
    }

    function buildPreview(el, part) {
        // Add preview elements
        var root = put(el, 'span.trans-preview.trans-preview-' + part.type + ' span.trans-preview-before <');
        var preview = put(root, 'span.trans-preview-after');
        preview.style.transform = TransformBuilder.partToString(part);
        // Scale down preview to fix max width/height
        var rect = preview.getBoundingClientRect();
        var ratioW = CRAPPY_HARDCODED_MAX_SIZE / rect.width;
        var ratioH = CRAPPY_HARDCODED_MAX_SIZE / rect.height;
        var minRatio = Math.min(ratioW, ratioH);
        // Account for translate, which doesn't affect bounding rect
        if (minRatio === 1) {
            var rootRect = root.getBoundingClientRect();
            var fullW = Math.max(rect.right, rootRect.right) - Math.min(rect.left, rootRect.left);
            var fullH = Math.max(rect.bottom, rootRect.bottom) - Math.min(rect.top, rootRect.top);
            ratioW = CRAPPY_HARDCODED_MAX_SIZE / fullW;
            ratioH = CRAPPY_HARDCODED_MAX_SIZE / fullH;
            minRatio = Math.min(ratioW, ratioH);
        }
        if (minRatio < 1) {
            root.style.transform = 'scale(' + minRatio + ')';
        }

        return root;
    }

})();
