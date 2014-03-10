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
        this.propsList = put(this.container, 'div.kfa-properties ul.kfa-properties-list');
        this.timelineContainer = put(this.container, 'div.kfa-timeline');
        this.timelineHeader = put(this.timelineContainer, 'div.kfa-header');
        this.timelineList = put(this.timelineContainer, 'ul.kfa-timeline-list');
        this.updateElems = [];
        this._lastStop = null;

        // Event listeners
        this.timelineHeader.addEventListener('click', onHeaderClick.bind(this), false);
        this.timelineList.addEventListener('mousedown', onTimelineMousedown.bind(this), false);
    };

    kfp._renderStopTitles = function () {
        var header = this.timelineHeader;
        this.stops.forEach(markerGenerator(header, {withText: true}));
    };

    kfp._renderPropertyRow = function (prop) {
        put(this.propsList, 'li $', prop.name);
        var row = put(this.timelineList, 'li[data-property=$]', prop.name);
        prop.values.forEach(markerGenerator(row, {prop: 'stop'}));
    };

    kfp.setKeyframes = function (cssString) {
        this.cleanup(true);
        var ast = parse(cssString);
        if (!ast) {
            return;
        }
        console.log('AST', ast);
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
            removeSheet(this._sheet);
        }
        this._sheet = null;
        if (cleanAllElems) {
            this.updateElems.forEach(removeElementAnimation);
        }
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

    function injectSheet(cssText) {
        var sheet = document.createElement('style');
        sheet.textContent = cssText;
        document.head.appendChild(sheet);
        return sheet;
    }

    function removeSheet(sheet) {
        sheet.parentNode.removeChild(sheet);
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
        this._tlProps = {
            timelineX: tlx,
            timelineW: tlw,
            timelineElem: timeline,
            onMove: onTimelineMousemove.bind(this),
            onUp: onTimelineMouseup.bind(this)
        };

        timeline.addEventListener('mousemove', this._tlProps.onMove, false);
        document.addEventListener('mouseup', this._tlProps.onUp, false);
        document.addEventListener('selectstart', preventDefault, false);
        this._tlProps.onMove(e);
    }

    function onTimelineMousemove(e) {
        var x = e.pageX;
        var perc = (x - this._tlProps.timelineX) / this._tlProps.timelineW;
        perc = Math.max(0, Math.min(1, perc));
        this.setStop(perc);
    }

    function onTimelineMouseup(e) {
        this._tlProps.timelineElem.removeEventListener('mousemove', this._tlProps.onMove, false);
        document.removeEventListener('mouseup', this._tlProps.onUp, false);
        document.removeEventListener('selectstart', preventDefault, false);
        delete this._tlProps;
    }


})(typeof module !== 'undefined' && module.exports || this);