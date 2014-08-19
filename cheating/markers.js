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
    console.log(transBuilder);
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
