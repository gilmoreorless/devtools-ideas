(function (root) {

    var cheat = root.cheat = {};

    /*******\
    | SETUP |------------------------------------------------------------------------------------------------------
    \*******/

    // PUBLIC OPTIONS

    cheat.shouldShowGuides = true;


    // DOM NODES

    var body = document.querySelector('.fake-page');
    var ref = document.querySelector('#ref');
    var transRoot = document.querySelector('#transform2d');
    var transContainer = document.querySelector('.trans-container');
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
    var guidesParent = document.createElement('div');
    var guidesElemParent = document.createElement('div');
    guidesParent.className = guidesElemParent.className = 'trans-action-guides-container trans-cursor';


    // PARAMETERS
    var units = 'deg';
    // Mousemove normalisers
    var pxPerSkew = 2;
    var pxPerScale = 50;


    // STATE

    var curTransObj = new TransformBuilder();
    var curOrigin = '50% 50%';
    var curMode = '';
    var curPartIdx = -1;
    var curAxis = '';
    var curGuide;
    var curElemGuide;
    var dragStart = null;
    var axisBounds = {};
    var axisElemBounds = {};



    /*****************\
    | PRIVATE METHODS |-------------------------------------------------------------------------------------------
    \*****************/

    // UTILS

    function setup() {
        transRoot.appendChild(guidesParent);
        body.appendChild(guidesElemParent);

        btnsContainer.addEventListener('click', function (e) {
            var action = e.target.getAttribute('data-action');
            if (action) {
                var mode = action === curMode ? '' : action;
                cheat.setMode(mode);
            }
        }, false);
        propTrans.addEventListener('click', transPartSelected, false);
        transContainer.addEventListener('mousedown', actionMousedown, false);
        transContainer.addEventListener('mousemove', pickAxis, false);
    }

    function eachAction(callback) {
        ['rotate', 'scale', 'skew', 'translate'].forEach(function (action) {
            callback.call(this, action, btn[action]);
        });
    }

    function doNothing(e) {
        e.preventDefault();
    }

    function extend(o, n) {
        Object.keys(n).forEach(function (key) {
            o[key] = n[key];
        });
        return o;
    }

    function getBounds(elem) {
        var rect = elem.getBoundingClientRect();
        var bounds = {};
        var extra = {left: window.scrollX, top: window.scrollY};
        Object.keys(rect).forEach(function (key) {
            bounds[key] = rect[key] + (extra[key] || 0);
        });
        return bounds;
    }



    // DRAG HANDLERS

    function actionMousedown(e) {
        if (!curMode) {
            return;
        }
        dragStart = {
            x: e.pageX,
            y: e.pageY,
            originBounds: getBounds(transOrigin),
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
            var values = dragHandlers[curMode].call(this, e, dx, dy);
            curTransObj.setPart(curPartIdx, values);
            cheat.refresh();
            updateGuides(curTransObj.getPart(curPartIdx));
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
            function round(num) {
                return Math.round(num * 100) / 100;
            }
            var scaleX = parseFloat(dragStart.values[0]) || 1;
            var scaleY = parseFloat(dragStart.values[1]) || scaleX;
            var absx = Math.abs(dx);
            var absy = Math.abs(dy);
            var values;
            if (!curAxis) {
                var dist = absx > absy ? dx : -dy;
                scaleX = round(scaleX + dist / pxPerScale);
                values = [scaleX];
            } else {
                if (curAxis === 'x') {
                    scaleX = round(scaleX + dx / pxPerScale);
                } else if (curAxis === 'y') {
                    scaleY = round(scaleY - dy / pxPerScale);
                }
                values = [scaleX, scaleY];
            }
            return values;
        },
        skew: function (e, dx, dy) {
            var skewX = parseFloat(dragStart.values[0]) || 0;
            var skewY = parseFloat(dragStart.values[1]) || 0;
            if (curAxis === 'x') {
                skewX += Math.round(-dx / pxPerSkew);
            } else if (curAxis === 'y') {
                skewY += Math.round(-dy / pxPerSkew);
            }
            return [skewX + units, skewY + units];
        },
        translate: function (e, dx, dy) {
            dx += parseFloat(dragStart.values[0]) || 0;
            dy += parseFloat(dragStart.values[1]) || 0;
            return [dx + 'px', dy + 'px'];
        }
    };



    // INTERACTIVE GUIDES

    function showGuides() {
        curGuide = showGuide(guidesParent, transDisplay, axisBounds);
        curElemGuide = showGuide(guidesElemParent, ref, axisElemBounds);
    }

    function showGuide(parent, elem, bounds) {
        if (!cheat.shouldShowGuides) {
            return;
        }
        var guide = guideDisplays[curMode];
        var result;
        if (guide) {
            parent.innerHTML = '';
            result = guide.call(this, parent, elem);
            setupAxisBounds(parent, bounds);
        }
        return result;
    }

    function hideGuides() {
        hideGuide(curGuide);
        hideGuide(curElemGuide);
        curGuide = null;
        curElemGuide = null;
    }

    function hideGuide(guide) {
        guide && guide.remove();
    }

    function updateGuides(part) {
        if (!curGuide && !curElemGuide) {
            return;
        }
        var guide = guideDisplays[curMode];
        if (guide && guide.update) {
            curGuide && guide.update(curGuide, part);
            curElemGuide && guide.update(curElemGuide, part);
        }
    }

    function setupAxisBounds(parent, globalBounds) {
        var box = getBounds(parent);
        var halfX = box.left + box.width / 2;
        var halfY = box.top + box.height / 2;
        var minWH = Math.min(box.width, box.height);
        var min2 = minWH / 2;
        extend(globalBounds, {
            left:   halfX - min2,
            right:  halfX + min2,
            top:    halfY - min2,
            bottom: halfY + min2,
            width:  minWH,
            height: minWH
        });
        transRoot.removeAttribute('data-axis');
        return globalBounds;
    }

    var axisProximity = 20;
    function pickAxis(e) {
        if (dragStart || !guideDisplays[curMode] || !guideDisplays[curMode].pickAxis) {
            return;
        }
        var x = e.pageX, y = e.pageY;
        var distX = Math.min(Math.abs(x - axisBounds.right), Math.abs(y - axisBounds.top));
        var distY = Math.min(Math.abs(x - axisBounds.left), Math.abs(y - axisBounds.bottom));
        var minDist = Math.min(distX, distY);
        var oldAxis = curAxis;
        curAxis = minDist > axisProximity ?
            '' :
            distX < distY ? 'x' : 'y';
        if (curAxis !== oldAxis) {
            body.setAttribute('data-axis', curAxis);
            transRoot.setAttribute('data-axis', curAxis);
        }
    }

    var guideDisplays = {
        rotate: function (parent, elem) {
            var padding = 10;
            var box = getBounds(elem);
            var w = box.width / 2;
            var h = box.height / 2;
            var radius = Math.sqrt(w * w + h * h) + padding;
            var main = put('div.trans-agrotate');
            main.style.width = main.style.height = (radius * 2) + 'px';
            put(main, 'div.trans-agrotate-control');
            put(parent, main);
            var mainBounds = getBounds(main);
            parent.style.left = (box.left + (box.width / 2) - (mainBounds.width / 2)) + 'px';
            parent.style.top = (box.top + (box.height / 2) - (mainBounds.height / 2)) + 'px';
            return main;
        },
        // scale: function (parent, elem) {

        // },
        skew: function (parent, elem) {
            var padding = 25;
            var box = getBounds(elem);
            var main = put('div.trans-agskew');
            parent.style.left = (box.left - padding) + 'px';
            parent.style.top = (box.top - padding) + 'px';
            main.style.width = (box.width + padding * 2) + 'px';
            main.style.height = (box.height + padding * 2) + 'px';
            put(main, 'div.trans-agskew-axis.axis-x');
            put(main, 'div.trans-agskew-axis.axis-y');
            put(parent, main);
            return main;
        },
        translate: function (parent, elem) {
            return;
            var padding = 10;
            var box = getBounds(elem);
            var main = put('div.trans-agtranslate');
            parent.style.left = (box.left - padding) + 'px';
            parent.style.top = (box.top - padding) + 'px';
            main.style.width = (box.width + padding * 2) + 'px';
            main.style.height = (box.height + padding * 2) + 'px';
            ['top', 'right', 'bottom', 'left'].forEach(function (dir) {
                put(main, 'div.trans-agtranslate-arrow.arrow-' + dir);
            });
            put(parent, main);
            return main;
        }
    };
    guideDisplays.scale = guideDisplays.skew;
    guideDisplays.skew.pickAxis = guideDisplays.scale.pickAxis = true;

    guideDisplays.rotate.update = function (guide, part) {
        guide.style.webkitTransform = TransformBuilder.partToString(part);
    };


    // PROPERTY VALUES

    function outputTransformPartNodes() {
        var parts = curTransObj.parts;
        var nodes = [];
        if (parts.length) {
            nodes = parts.map(function (part, i) {
                var node = put('span.trans-part[data-index=$][data-type=$]',
                               i, part.type,
                               TransformBuilder.partToString(part));
                if (i === curPartIdx) {
                    put(node, '.selected');
                }
                return node;
            });
        } else {
            nodes = [put('span.trans-part-read-only', curTransObj.toString())];
        }
        propTrans.innerHTML = '';
        put(propTrans, nodes);
    }

    function transPartSelected(e) {
        var index = e.target.getAttribute('data-index');
        if (index == null) {
            return;
        }
        var type = e.target.getAttribute('data-type');
        curPartIdx = +index;
        cheat.setMode(type);
        updateGuides(curTransObj.getPart(curPartIdx));
        e.target.classList.add('selected');
    }



    /****************\
    | PUBLIC METHODS |--------------------------------------------------------------------------------------------
    \****************/

    cheat.refresh = function () {
        var curTrans = curTransObj.toString();
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

    /*
    cheat.setTransform = function (transform) {
        curTrans = transform;
        cheat.refresh();
    };
    */

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
        body.setAttribute('data-mode', mode);
        transRoot.setAttribute('data-mode', mode);
        if (mode) {
            showGuides();
        } else {
            hideGuides();
        }
        cheat.refresh();
    };


    setup();
})(this);

cheat.refresh();
