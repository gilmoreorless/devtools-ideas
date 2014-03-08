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
    };

    kfp._renderStopTitles = function () {
        var header = this.timelineHeader;
        this.stops.forEach(function (stop) {
            var marker = put(header, 'span.kfa-marker $', stop);
            marker.style.left = stop;
        });
    };

    kfp._renderPropertyRow = function (prop) {
        put(this.propsList, 'li $', prop.name);
        var row = put(this.timelineList, 'li[data-property=$]', prop.name);
        prop.values.forEach(function (def) {
            var marker = put(row, 'span.kfa-marker');
            marker.style.left = def.stop;
        });
    };

    kfp.setKeyframes = function (cssString) {
        var ast = parse(cssString);
        if (!ast) {
            return;
        }
        console.log('AST', ast);
        // TODO: Show animation name as a title
        this.animation = ast.stylesheet.rules.filter(function (rule) {
            return rule.type === 'keyframes';
        })[0];
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
            frame.stop = stopKeywords[frame.values[0]] || frame.values[0];
            return frame;
        }).sort(sortFrames);
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

})(typeof module !== 'undefined' && module.exports || this);