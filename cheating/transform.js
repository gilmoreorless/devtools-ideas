(function (root) {

    var cheat = root.cheat = {};

    // DOM NODES

    var ref = document.querySelector('#ref');
    var transRoot = document.querySelector('#transform2d');
    var transBase = document.querySelector('.trans-base');
    var transDisplay = document.querySelector('.trans-elem');
    var transOrigin = transBase.querySelector('.origin');
    var propTrans  = document.querySelector('#t2d-prop-transform .value');
    var propOrigin = document.querySelector('#t2d-prop-transform-origin .value');
    var btnsContainer = document.querySelector('.trans-actions');
    var btn = {};
    ['rotate', 'scale', 'skew', 'translate'].forEach(function (trans) {
        btn[trans] = btnsContainer.querySelector('[data-action=' + trans + ']');
    });


    // STATE

    var curTrans = 'none';
    var curTransObj = new TransformBuilder();
    var curOrigin = '50% 50%';
    var curMode = '';
    var curPartIdx = -1;
    var dragStart = null;
    var units = 'deg';
    // Mousemove normalisers
    var pxPerSkew = 2;
    var pxPerScale = 50;


    // PRIVATE METHODS

    function setup() {
        btnsContainer.addEventListener('click', function (e) {
            var action = e.target.getAttribute('data-action');
            if (action) {
                var mode = action === curMode ? '' : action;
                cheat.setMode(mode);
            }
        }, false);
        propTrans.addEventListener('click', transPartSelected, false);
        transRoot.addEventListener('mousedown', actionMousedown, false);
    }

    function eachAction(callback) {
        ['rotate', 'scale', 'skew', 'translate'].forEach(function (action) {
            callback.call(this, action, btn[action]);
        });
    }

    function doNothing(e) {
        e.preventDefault();
    }

    function actionMousedown(e) {
        if (!curMode || e.target.classList.contains('trans-action') || e.target.classList.contains('trans-part')) {
            return;
        }
        dragStart = {
            x: e.pageX,
            y: e.pageY,
            originBounds: transOrigin.getBoundingClientRect(),
            values: [],
            isNewPart: false
        };
        var part;
        if (curPartIdx > -1) {
            part = curTransObj.getPart(curPartIdx);
        } else {
            part = curTransObj.getLastPart();
            if (!part || part.type !== curMode) {
                part = curTransObj.addPart(curMode);
                dragStart.isNewPart = true;
            }
            curPartIdx = curTransObj.parts.length - 1;
        }
        dragStart.values = [].concat(part.values); // Make sure it's a clone and not a reference

        document.addEventListener('selectstart', doNothing, false);
        document.addEventListener('mousemove', actionMousemove, false);
        document.addEventListener('mouseup', actionMouseup, false);
        transRoot.classList.add('dragging');
    }

    function actionMousemove(e) {
        if (!dragStart) {
            return;
        }
        if (dragHandlers[curMode]) {
            var x = e.pageX;
            var y = e.pageY;
            var dx = x - dragStart.x;
            var dy = y - dragStart.y;
            curTransObj.setPart(curPartIdx, dragHandlers[curMode].call(this, e, dx, dy));
            cheat.refresh();
        }
    }

    function actionMouseup(e) {
        if (dragStart.isNewPart && dragStart.x === e.pageX && dragStart.y === e.pageY) {
            curTransObj.popPart();
        }
        dragStart = null;
        curPartIdx = -1;
        document.removeEventListener('selectstart', doNothing, false);
        document.removeEventListener('mousemove', actionMousemove, false);
        document.removeEventListener('mouseup', actionMouseup, false);
        transRoot.classList.remove('dragging');
        cheat.refresh();
    }

    var dragHandlers = {
        rotate: function (e) {
            var ox = dragStart.originBounds.left + dragStart.originBounds.width / 2;
            var oy = dragStart.originBounds.top + dragStart.originBounds.height / 2;
            var dx = e.pageX - ox;
            var dy = e.pageY - oy;
            var rad = -Math.atan2(-dx, -dy);
            var angle = Math.round(rad * 180 / Math.PI % 360);
            return [angle + units];
        },
        scale: function (e, dx, dy) {
            var absx = Math.abs(dx);
            var absy = Math.abs(dy);
            var dist = absx > absy ? dx : -dy;
            var scale = dist / pxPerScale + (parseFloat(dragStart.values[0]) || 1);
            scale = Math.round(scale * 100) / 100;
            return [scale];
        },
        skew: function (e, dx, dy) {
            var skewX = Math.round(-dx / pxPerSkew) + (parseFloat(dragStart.values[0]) || 0);
            return [skewX + units, 0];
        },
        translate: function (e, dx, dy) {
            dx += parseFloat(dragStart.values[0]) || 0;
            dy += parseFloat(dragStart.values[1]) || 0;
            return [dx + 'px', dy + 'px'];
        }
    };

    function outputTransformPartNodes() {
        var parts = curTransObj.parts;
        var nodes = [];
        if (parts.length) {
            nodes = parts.map(function (part, i) {
                var str = '<span class="trans-part' +
                    (i === curPartIdx ? ' selected' : '') +
                    '"' +
                    ' data-index="' + i + '"' +
                    ' data-type="' + part.type + '"' +
                    '>' + TransformBuilder.partToString(part) +
                    '</span>';
                return str;
            });
        } else {
            nodes.push(
               '<span class="trans-part-read-only">' +
               curTransObj.toString() + '</span>');
        }
        propTrans.innerHTML = nodes.join(' ');
    }

    function transPartSelected(e) {
        var index = e.target.getAttribute('data-index');
        if (index == null) {
            return;
        }
        var type = e.target.getAttribute('data-type');
        curPartIdx = +index;
        cheat.setMode(type);
        e.target.classList.add('selected');
    }


    // PUBLIC METHODS

    cheat.refresh = function () {
        var curTrans = curTransObj + '';
        ref.style.webkitTransform = curTrans;
        ref.style.webkitTransformOrigin = curOrigin;
        transDisplay.style.webkitTransform = curTrans;
        transDisplay.style.webkitTransformOrigin = curOrigin;
        var xy = curOrigin.split(' ');
        transOrigin.style.left = xy[0];
        transOrigin.style.top = xy[1];
        propOrigin.innerHTML = '<span class="trans-part-read-only">' + curOrigin + '</span>';
        outputTransformPartNodes();
    };

    cheat.setTransform = function (transform) {
        curTrans = transform;
        cheat.refresh();
    };

    cheat.setOrigin = function (origin) {
        curOrigin = origin;
        cheat.refresh();
    };

    cheat.setMode = function (mode) {
        if (!mode) {
            mode = '';
        }
        curMode = mode;
        eachAction(function (action, btn) {
            var add = action === mode;
            btn.classList[add ? 'add' : 'remove']('selected');
        });
        transRoot.setAttribute('data-mode', mode);
    };


    setup();
})(this);

cheat.refresh();
