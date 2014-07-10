/**
 * Dependencies: put, css-parse
 */
(function (root) {

    var KF = root.KeyframeExplainer = function (rootNode) {
        if (typeof rootNode === 'string') {
            rootNode = document.querySelector(rootNode);
        }
        this.root = rootNode;
        this._setup();
    };

    /*** KeyframeExplainer prototype methods ***/

    var kfp = KF.prototype;

    kfp._setup = function () {
        this.container = put('div.kfa-container');
        this.propsList = put(this.container, 'div.kfa-properties div.kfa-properties-list');
        this.timelineContainer = put(this.container, 'div.kfa-timeline');
        this.timelineHeader = put(this.timelineContainer, 'div.kfa-header');
        this.timelineList = put(this.timelineContainer, 'div.kfa-timeline-list');
        this.timelineFooter = put(this.timelineContainer, 'div.kfa-footer');
        this.updateElems = [];
        this._lastStop = null;
        this._listeners = {};

        // Event listeners
        this.timelineHeader.addEventListener('click', onHeaderClick.bind(this), false);
        this.timelineList.addEventListener('mousedown', onTimelineMousedown.bind(this), false);
    };

    kfp._renderStopTitles = function () {
        var header = this.timelineHeader;
        this.stops.forEach(markerGenerator(header, {withText: true}));
    };

    kfp._renderPropertyRow = function (prop) {
        put(this.propsList, 'div.kfa-property-name $', prop.name);
        var row = put(this.timelineList, 'div.kfa-timeline-row[data-property=$]', prop.name);
        prop.values.forEach(markerGenerator(row, {prop: 'stop'}));
    };

    kfp.setKeyframes = function (cssString) {
        this.cleanup(true);
        var ast = parse(cssString);
        if (!ast) {
            return;
        }
        // TODO: Show animation name as a title
        this.animation = ast.stylesheet.rules.filter(function (rule) {
            return rule.type === 'keyframes';
        })[0];
        this.animation.raw = cssString;
        var frames = normaliseFrames(this.animation.keyframes);
        this.stops = getStops(frames);
        this.props = normaliseProps(frames);

        this.propsList.innerHTML = '';
        this.timelineHeader.innerHTML = '';
        this.timelineList.innerHTML = '';

        this._renderStopTitles();
        this.props.forEach(this._renderPropertyRow.bind(this));

        put(this.root, this.container);
        this._clearTimelineValues();
        this.showTimelineValues();
    };

    kfp.addUpdateElement = function (elem) {
        var existing = this.updateElems.filter(function (e) { return e === elem; });
        if (!existing.length) {
            this.updateElems.push(elem);
        }
    };

    kfp.removeUpdateElement = function (elem) {
        var i = this.updateElems.indexOf(elem);
        if (i > -1) {
            this.updateElems.splice(i, 1);
        }
    };

    kfp.setStop = function (stop) {
        if (stop === this._lastStop) {
            return;
        }
        this._lastStop = stop;
        if (!this.updateElems.length) {
            return;
        }
        var animName = newAnimationName(this.animation.name);
        this.cleanup();
        this._sheet = injectSheet(replaceAnimationName(this.animation.raw, animName));
        this.updateElems.forEach(function (elem) {
            setElementAnimation(elem, animName, timingValues(stop));
        });
    };

    kfp.cleanup = function (cleanAllElems) {
        if (this._sheet) {
            removeElem(this._sheet);
        }
        this._sheet = null;
        if (cleanAllElems) {
            this.updateElems.forEach(removeElementAnimation);
        }
        // removeCurrentTimeMarker(this);
    };


    /*** Basic event handling ***/

    kfp.on = function (eventName, listener) {
        var l = this._listeners[eventName];
        if (!l) {
            l = this._listeners[eventName] = [];
        }
        l.push(listener);
    };

    kfp.off = function (eventName, listener) {
        var l = this._listeners[eventName];
        if (l) {
            var idx = l.indexOf(listener);
            if (idx > -1) {
                l.splice(idx, 1);
            }
        }
    };

    kfp.trigger = function (eventName, data) {
        var l = this._listeners[eventName];
        if (!l) {
            return;
        }
        l.forEach(function (listener) {
            try {
                listener(eventName, this, data);
            } catch (e) {
                console.error('Callback error when triggering %s event', eventName, e, listener);
            }
        }, this);
    };


    /*** Private helpers ***/

    function parse(cssString) {
        var parsed;
        try {
            parsed = CSSParse(cssString);
        } catch (e) {
            console.error('CSS parsing error:', e);
        }
        return parsed;
    }

    function sortFrames(a, b) {
        var valA = parseFloat(a.stop) || 0;
        var valB = parseFloat(b.stop) || 0;
        return valA - valB;
    }

    function normaliseFrames(frames) {
        var stopKeywords = {from: '0%', to: '100%'};
        return frames.map(function (frame) {
            return frame.values.map(function (value) {
                return {
                    stop: stopKeywords[value] || value,
                    declarations: frame.declarations
                };
            });
        }).reduce(function (memo, list) {
            return memo.concat(list);
        }, []).sort(sortFrames);
    }

    function getStops(frames) {
        var stops = frames.map(function (frame) {
            return frame.stop;
        });
        return stops;
    }

    function normaliseProps(frames) {
        var props = {};
        var propNames = [];
        frames.forEach(function (frame) {
            frame.declarations.forEach(function (dec) {
                var prop = dec.property;
                if (!props[prop]) {
                    props[prop] = [];
                    propNames.push(prop);
                }
                props[prop].push({
                    stop: frame.stop,
                    value: dec.value
                });
            });
        });
        var normProps = propNames.sort().map(function (prop) {
            return {
                name: prop,
                values: props[prop]
            };
        });
        return normProps;
    }

    function timingValues(stop) {
        var stopValue = stop;
        if (typeof stopValue === 'string') {
            stopValue = (parseFloat(stop) || 0) / 100;
        }
        var granularity = 100; // ms
        if (Math.floor(stopValue) !== stopValue) {
            granularity = 1000;
        }
        return {
            total: granularity + 'ms',
            value: granularity * stopValue + 'ms'
        };
    }

    function newAnimationName(name) {
        return name + '-kfa-' + ~~(Math.random() * 100000);
    }

    function replaceAnimationName(cssString, newName) {
        return cssString.replace(/(keyframes\s+)([-\w]+)/g, function (match, keep) {
            return keep + newName;
        });
    }


    /*** Private DOM utils ***/

    function markerGenerator(parent, options) {
        var withText = !!options.withText;
        return function (stop) {
            var marker = put(parent, 'span.kfa-marker');
            var value = options.prop ? stop[options.prop] : stop;
            if (withText) {
                marker.textContent = value;
            }
            marker.style.left = value;
            marker.dataset.stop = value;
        };
    }

    function renderCurrentTimeMarker(kf) {
        if (kf._dragMarkers) {
            return kf._dragMarkers;
        }
        var textMarker = put(kf.timelineFooter, 'span.kfa-marker');
        var lineMarker = put(kf.timelineList, 'span.kfa-marker.kfa-current-time');
        return {
            text: textMarker,
            line: lineMarker
        };
    }

    function removeCurrentTimeMarker(kf) {
        if (kf._dragMarkers) {
            removeElem(kf._dragMarkers.text);
            removeElem(kf._dragMarkers.line);
            delete kf._dragMarkers;
        }
    }

    function injectSheet(cssText) {
        var sheet = document.createElement('style');
        sheet.textContent = cssText;
        document.head.appendChild(sheet);
        return sheet;
    }

    function removeElem(elem) {
        if (elem.parentNode) {
            elem.parentNode.removeChild(elem);
        }
    }

    function setElementAnimation(elem, name, timing) {
        var s = elem.style;
        // TODO: Cross-browser support
        // TODO: Preserve previous inline style values?
        s.webkitAnimationPlayState = 'paused';
        s.webkitAnimationDuration = timing.total;
        s.webkitAnimationDelay = '-' + timing.value;
        s.webkitAnimationName = name;
    }

    function removeElementAnimation(elem) {
        var s = elem.style;
        // TODO: Cross-browser support
        // TODO: Preserve previous inline style values?
        var props = [
            '-webkit-animation-name',
            '-webkit-animation-duration',
            '-webkit-animation-delay',
            '-webkit-animation-play-state'
        ];
        props.forEach(s.removeProperty.bind(s));
    }


    /*** Private event handlers ***/

    function onHeaderClick(e) {
        if (e.target.classList.contains('kfa-marker')) {
            var stop = e.target.dataset.stop;
            removeCurrentTimeMarker(this);
            this.setStop(stop);
        }
    }

    function preventDefault(e) {
        e.preventDefault();
    }

    function onTimelineMousedown(e) {
        var timeline = e.currentTarget;
        // Record coords for future reference
        var tlx = timeline.getBoundingClientRect().left;
        var tlw = timeline.offsetWidth;
        this._dragProps = {
            timelineX: tlx,
            timelineW: tlw,
            timelineElem: timeline,
            onMove: onTimelineMousemove.bind(this),
            onUp: onTimelineMouseup.bind(this)
        };
        this._dragMarkers = renderCurrentTimeMarker(this);

        timeline.addEventListener('mousemove', this._dragProps.onMove, false);
        document.addEventListener('mouseup', this._dragProps.onUp, false);
        document.addEventListener('selectstart', preventDefault, false);
        this._dragProps.onMove(e);
    }

    function onTimelineMousemove(e) {
        var x = e.pageX;
        var perc = (x - this._dragProps.timelineX) / this._dragProps.timelineW;
        perc = Math.max(0, Math.min(1, perc));
        var p100 = perc * 100;

        var textMarker = this._dragMarkers.text;
        textMarker.textContent = Math.round(p100) + '%';
        textMarker.style.left = p100 + '%';
        this._dragMarkers.line.style.left = p100 + '%';

        this.setStop(perc);
    }

    function onTimelineMouseup() {
        this._dragProps.timelineElem.removeEventListener('mousemove', this._dragProps.onMove, false);
        document.removeEventListener('mouseup', this._dragProps.onUp, false);
        document.removeEventListener('selectstart', preventDefault, false);
        delete this._dragProps;
    }


    /*** TESTING, THIS IS NOT STABLE ***/

    kfp.showTimelineValues = function () {
        if (!this._timelineValueNodes) {
            var propValues = this.getTimelineValues();
            this._timelineValueNodes = this.props.map(function (prop) {
                var graphType = tlGraphTypes[prop.name];
                if (!graphType) {
                    return;
                }
                var parent = this.timelineList.querySelector('[data-property=' + prop.name + ']');
                var graph = put('canvas');
                var style = getComputedStyle(parent);
                graph.width = parseFloat(style.width);
                graph.height = parseFloat(style.height);
                put(parent, graph);
                var values = propValues[prop.name];
                tlGraphRenderers[graphType](graph, values);
                return graph;
            }, this);
        }
        this.timelineContainer.classList.add('kfa-show-timeline-values');
    };

    kfp.hideTimelineValues = function () {
        this.timelineContainer.classList.remove('kfa-show-timeline-values');
    };

    kfp.getTimelineValues = function () {
        var props = {};
        var i = 0;
        var prevStop = this._lastStop;
        for (i; i < 100; i++) {
            this.setStop(i + '%');
            // TODO: Hard-coded updateElems[0] is fragile
            var style = getComputedStyle(this.updateElems[0]);
            this.props.forEach(function (prop) {
                if (!props[prop.name]) {
                    props[prop.name] = [];
                }
                props[prop.name].push(style[prop.name]);
            });
        }
        if (prevStop != null) {
            this.setStop(prevStop);
        }
        return props;
    };

    kfp._clearTimelineValues = function () {
        if (!this._timelineValueNodes) return;
        // TODO: Make this less hacky
        this._timelineValueNodes.forEach(function (node) {
            removeElem(node);
        });
        this._timelineValueNodes = null;
    };

    // https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animated_properties
    var tlGraphTypes = {
        'transform': 'transform',
        'transform-origin': 'multinumber',
        'perspective': 'number',
        'perspective-origin': 'multinumber',
        'color': 'color',
        'opacity': 'number',
        'columns': 'multinumber',
        'column-count': 'integer',
        'column-width': 'number',
        'column-gap': 'number',
        'column-rule': 'MULTIRULE',
        'column-rule-color': 'color',
        'column-rule-width': 'number',
        'letter-spacing': 'number',
        'text-indent': 'number',
        'word-spacing': 'number',
        'text-decoration': 'MULTIRULE',
        'text-decoration-color': 'color',
        'text-shadow': 'shadow',
        'flex': 'MULTIRULE',
        'flex-basis': 'number',
        'flex-grow': 'number',
        'flex-shrink': 'number',
        'order': 'integer',
        'background': 'MULTIRULE',
        'background-color': 'color',
        'background-position': 'multinumber',
        'background-size': 'multinumber',
        'border': 'MULTIRULE',
        'border-bottom': 'MULTIRULE',
        'border-left': 'MULTIRULE',
        'border-right': 'MULTIRULE',
        'border-top': 'MULTIRULE',
        'border-color': 'multicolor',
        'border-width': 'multinumber',
        'border-bottom-color': 'color',
        'border-left-color': 'color',
        'border-right-color': 'color',
        'border-top-color': 'color',
        'border-bottom-width': 'number',
        'border-left-width': 'number',
        'border-right-width': 'number',
        'border-top-width': 'number',
        'border-radius': 'multinumber',
        'border-top-left-radius': 'number',
        'border-top-right-radius': 'number',
        'border-bottom-right-radius': 'number',
        'border-bottom-left-radius': 'number',
        'box-shadow': 'shadow',
        'margin': 'MULTIRULE',
        'margin-bottom': 'number',
        'margin-left': 'number',
        'margin-right': 'number',
        'margin-top': 'number',
        'padding': 'MULTIRULE',
        'padding-bottom': 'number',
        'padding-left': 'number',
        'padding-right': 'number',
        'padding-top': 'number',
        'height': 'number',
        'max-height': 'number',
        'min-height': 'number',
        'width': 'number',
        'max-width': 'number',
        'min-width': 'number',
        'visibility': 'visibility',
        'vertical-align': 'number',
        'bottom': 'number',
        'left': 'number',
        'right': 'number',
        'top': 'number',
        'z-index': 'integer',
        'font': 'MULTIRULE',
        'font-weight': 'fontWeight',
        'font-stretch': 'fontStretch',
        'font-size': 'number',
        'line-height': 'number',
        'font-size-adjust': 'number',
        'outline': 'MULTIRULE',
        'outline-color': 'color',
        'outline-width': 'number',
        'outline-offset': 'number',
        'clip': 'rectangle',
    };

    var tlGraphRenderers = {
        color: function (canvas, values) {
            var ctx = canvas.getContext('2d');
            var w = canvas.width;
            var h = canvas.height;
            var wpart = w / (values.length - 1);
            values.forEach(function (value, i) {
                var wpi = wpart * i;
                var gradient = ctx.createLinearGradient(wpi, 0, wpart * (i + 1), 0);
                gradient.addColorStop(0, value);
                gradient.addColorStop(1, values[i + 1] || values[i]);
                ctx.fillStyle = gradient;
                ctx.fillRect(wpi, 0, wpart + 1, h);
            });
        },
        multicolor: function (canvas, values) {
            console.warn('Unimplemented timeline renderer: multicolor');
        },
        number: function (canvas, values, options) {
            options = options || {};
            var ctx = canvas.getContext('2d');
            var w = canvas.width;
            var h = options.height || canvas.height;
            var topY = +options.topY || 0;
            var wpart = w / (values.length - 1);
            var floats = values.map(function (n) {
                return parseFloat(n) || 0;
            });
            var min = Math.min.apply(Math, floats);
            var max = Math.max.apply(Math, floats);
            // TODO: Handle negative values
            var scale = max / h;
            ctx.beginPath();
            ctx.moveTo(0, h + topY);
            floats.forEach(function (value, i) {
                var x = wpart * i;
                var y = value / scale;
                if (options.discreteValues && i) {
                    var x2 = x - wpart / 2;
                    var prevY = floats[i - 1] / scale;
                    ctx.lineTo(x2, h - prevY + topY);
                    ctx.lineTo(x2, h - y + topY);
                }
                ctx.lineTo(x, h - y + topY);
            });
            ctx.lineTo(w, h + topY);
            ctx.closePath();

            var gradient = ctx.createLinearGradient(0, topY, 0, topY + h);
            gradient.addColorStop(0, '#ccc');
            gradient.addColorStop(1, '#999');
            ctx.fillStyle = gradient;
            ctx.fill();
        },
        multinumber: function (canvas, values) {
            var splitValues = values.map(function (value) {
                // TODO: More robust splitting, handle "/" as divider
                return value.split(' ');
            });
            var height = canvas.height;
            var partCount = splitValues[0].length;
            var partHeight = height / partCount;
            var partValues;
            for (var i = 0, ii = partCount; i < ii; i++) {
                partValues = splitValues.map(function (parts) {
                    return parts[i];
                });
                tlGraphRenderers.number.call(this, canvas, partValues, {
                    height: partHeight,
                    topY: partHeight * i
                });
            }
        },
        integer: function (canvas, values) {
            tlGraphRenderers.number.call(this, canvas, values, {
                discreteValues: true
            });
        },
        rectangle: function (canvas, values) {
            console.warn('Unimplemented timeline renderer: rectangle');
        },
        shadow: function (canvas, values) {
            console.warn('Unimplemented timeline renderer: shadow');
        },
        transform: function (canvas, values) {
            console.warn('Unimplemented timeline renderer: transform');
        },
        visibility: function (canvas, values) {
            console.warn('Unimplemented timeline renderer: visibility');
        },
        fontWeight: function (canvas, values) {
            console.warn('Unimplemented timeline renderer: fontWeight');
        },
        fontStretch: function (canvas, values) {
            console.warn('Unimplemented timeline renderer: fontStretch');
        },
        MULTIRULE: function (canvas, values) {
            console.warn('Unimplemented timeline renderer: MULTIRULE');
        }
    }


})(typeof module !== 'undefined' && module.exports || this);