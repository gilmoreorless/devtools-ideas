(function (root) {

    var cheat = root.cheat = {};

    /*******\
    | SETUP |------------------------------------------------------------------------------------------------------
    \*******/

    // PUBLIC OPTIONS

    cheat.options = new Options({
        showFakeElems: ['Show fake elements panel'],
        showTimelineValues: ['Show timeline graphs']
    });


    // DOM NODES

    var ref = document.querySelector('#ref');
    var kfRoot = document.querySelector('#keyframes-root');
    var kfTitle = kfRoot.querySelector('.keyframes-title');
    var kfOptionGraphs = kfRoot.querySelector('#keyframes-option-showTimelineGraphs');
    var kfTimeline = kfRoot.querySelector('.keyframes-timeline');
    var kfDefs = kfRoot.querySelector('.keyframes-definition');
    var devtoolsContent = document.querySelector('.fake-devtools-content');
    var devtoolsSidebarStyles = document.getElementById('keyframe-panel-styles');

    // STATE

    // var curAnim = '@-webkit-keyframes bounce {from{top:-100%}50%{top:0}75%{top:-30%}to{top:0}}';
    // var curAnim = '@-webkit-keyframes bounce {from{width:30%;background-color:#B5F0F0;color:black}30%{background-color:blue;color:yellow}50%{width:10%}75%{background-color:green;color:yellow;width:20%}to{width:10%}}';
    var curAnim = '@-webkit-keyframes sneetches {from{width:30%;background-color:#B5F0F0;color:black}30%,75%{background-color:blue;color:yellow}50%{width:20%}}';
    // https://github.com/daneden/animate.css/blob/master/animate.css
    // var curAnim = '@-webkit-keyframes bounce {\n  0%, 20%, 53%, 80%, 100% {\n    transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);\n    transform: translate3d(0,0,0);\n  }\n  40%, 43% {\n    transition-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);\n    transform: translate3d(0, -30px, 0);\n  }\n  70% {\n    transition-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);\n    transform: translate3d(0, -15px, 0);\n  }\n  90% {\n    transform: translate3d(0,-4px,0);\n  }\n}';
    // var curAnim = '@-webkit-keyframes flash {\n  0%, 50%, 100% {\n    opacity: 1;\n  }\n\n  25%, 75% {\n    opacity: 0;\n  }\n}';
    // var curAnim = '@-webkit-keyframes bounce {from{background-color:red}50%{background-color:green}75%{background-color:darkred}to{background-color:white}}';
    // var curAnim = '@-webkit-keyframes test {from{z-index:0}50%{z-index:10}to{z-index:5}}';
    // var curAnim = '@-webkit-keyframes test-multinumber {from{transform:rotate(45deg);transform-origin:0 0}50%{transform-origin:100% 50%}to{transform:rotate(-45deg);transform-origin:50% 75%}}';
    // var curAnim = '@-webkit-keyframes test-multicolor {from{border-color:red red}50%{border-color:gold pink purple}to{border-color:blue green}}';
    // var curAnim = '@-webkit-keyframes test-multiframe {0.1%{border-width:0;border-color:teal}30%,90%{border-width:20px}30%,60%{border-color:purple}}';


    /*****************\
    | PRIVATE METHODS |--------------------------------------------------------------------------------------------
    \*****************/

    // UTILS

    function setup() {
        cheat.kf = new KeyframeExplainer(kfTimeline);
        cheat.kf.addUpdateElement(ref);
        cheat.setAnimation(curAnim);

        // Event listeners
        devtoolsSidebarStyles.addEventListener('click', function (e) {
            if (e.target.classList.contains('kf-anim-view-icon')) {
                cheat.options.set('showFakeElems', false);
            }
        }, false);
        var cssStopHandler = classFilter('kfcss-stop', stopValueMouseHandler(cheat.kf.timelineHeader, '.kfa-marker'));
        kfDefs.addEventListener('mouseover', cssStopHandler, false);
        kfDefs.addEventListener('mouseout',  cssStopHandler, false);
        kfDefs.addEventListener('click', classFilter('kfcss-stop', stopValueClickHandler), false);

        var timelineStopHandler = classFilter('kfa-marker', stopValueMouseHandler(kfDefs, '.kfcss-stop'));
        cheat.kf.timelineHeader.addEventListener('mouseover', timelineStopHandler, false);
        cheat.kf.timelineHeader.addEventListener('mouseout',  timelineStopHandler, false);

        var cssPropHandler = classFilter('hoverable', propMouseHandler(cheat.kf.propsList));
        kfDefs.addEventListener('mouseover', cssPropHandler, false);
        kfDefs.addEventListener('mouseout', cssPropHandler, false);
        kfDefs.addEventListener('click', classFilter('kfcss-prop-value', propClickHandler), false);

        var timelinePropHandler = classFilter('kfa-property-name', propMouseHandler(kfDefs));
        cheat.kf.propsList.addEventListener('mouseover', timelinePropHandler, false);
        cheat.kf.propsList.addEventListener('mouseout', timelinePropHandler, false);

        // Options
        cheat.options.on('showFakeElems', setShowElems);
        cheat.options.on('showTimelineValues', setShowTimelineValues);
        kfOptionGraphs.addEventListener('click', function () {
            cheat.options.set('showTimelineValues', this.checked);
        }, false);

        setShowElems(cheat.options.get('showFakeElems'));
    }

    function classFilter(className, fn) {
        return function (e) {
            var node = e.target;
            while (node && node !== this) {
                if (node.classList.contains(className)) {
                    return fn.apply(node, arguments);
                }
                node = node.parentNode;
            }
        };
    }

    function setShowElems(shouldShow) {
        devtoolsContent.setAttribute('data-show-elems', shouldShow ? 'true' : 'false');
    }

    function setShowTimelineValues(shouldShow) {
        cheat.kf[(shouldShow ? 'show' : 'hide') + 'TimelineValues']();
    }

    function setTitle(animation) {
        var title = '@keyframes ' + animation.name;
        kfTitle.textContent = title;
    }

    function setCSS(animation) {
        kfDefs.innerHTML = '';
        put(kfDefs, buildCSSNodes([animation]));
    }


    // CSS OUTPUT

    /**
     * Build a node tree to represent the keyframe CSS text
     * @param  {object} parsed AST of the keyframes from CSSParse
     * @return {array}         List of DOM nodes
     */
    function buildCSSNodes(parsed) {
        var node;
        if (Array.isArray(parsed)) {
            node = put('ol');
            put(node, parsed.map(function (obj) {
                return buildCSSNodes(obj);
            }));
            return node;
        }
        node = put('li');
        switch (parsed.type) {
            case 'keyframes':
                put(node, 'span.kfcss-declaration $', '@keyframes');
                put(node, '$ span.kfcss-name $ < $', ' ', parsed.name, ' {');
                put(node, buildCSSNodes(parsed.keyframes));
                put(node, '$', '}');
                break;
            case 'keyframe':
                parsed.values.forEach(function (value, i) {
                    if (i) {
                        put(node, '$', ', ');
                    }
                    put(node, 'span.kfcss-stop[data-stop=$] $', cheat.kf.normaliseStop(value), value);
                });
                put(node, '$', ' {', buildCSSNodes(parsed.declarations));
                put(node, '$', '}');
                break;
            case 'declaration':
                put(node, '[data-property=$].hoverable', parsed.property);
                put(node, 'span.selection span.kfcss-prop-name $ < $ span.kfcss-prop-value $ < $',
                    parsed.property, ': ',
                    parsed.value, ';');
                break;
        }
        return node;
    }

    function stopValueMouseHandler(root, selector) {
        return function (e) {
            var stopValue = this.getAttribute('data-stop');
            if (!stopValue) {
                return;
            }
            stopValue = cheat.kf.normaliseStop(stopValue);
            var method = e.type === 'mouseover' ? 'add' : 'remove';
            var otherStops = root.querySelectorAll(selector + '[data-stop="' + stopValue + '"]');
            Array.prototype.forEach.call(otherStops, function (other) {
                other.classList[method]('active');
            });
        };
    }

    function stopValueClickHandler() {
        var stopValue = this.getAttribute('data-stop');
        if (stopValue) {
            cheat.kf.setStop(stopValue);
        }
    }

    function propMouseHandler(root) {
        return function (e) {
            var prop = this.getAttribute('data-property');
            if (!prop) {
                return;
            }
            var method = e.type === 'mouseover' ? 'add' : 'remove';
            var otherProps = root.querySelectorAll('[data-property="' + prop + '"]');
            Array.prototype.forEach.call(otherProps, function (other) {
                other.classList[method]('active');
            });
        };
    }

    // EDIT MODE FOR PROPS

    function propClickHandler() {
        if (!this.classList.contains('editing')) {
            propEditStart.call(this);
        }
    }

    function propKeyHandler(e) {
        var stopEditing = false;
        var saveEdit = false;
        if (e.keyCode === 13 || e.keyCode === 27) {  // Enter or Esc
            stopEditing = true;
            if (e.keyCode === 13) {  // Enter
                saveEdit = true;
            }
        }
        if (stopEditing) {
            e.preventDefault();
            propEditStop.call(this, saveEdit);
        }
        if (saveEdit) {
            cheat.setAnimation(kfDefs.textContent);
        }
    }

    function propEditStart() {
        this._origContent = this.textContent;
        this.addEventListener('keydown', propKeyHandler, false);
        this.addEventListener('blur', propEditStop, false);
        this.classList.add('editing');
        window.getSelection().setBaseAndExtent(this, 0, this, 1);
    }

    function propEditStop(keepContent) {
        this.classList.remove('editing');
        this.removeEventListener('keydown', propKeyHandler, false);
        this.addEventListener('blur', propEditStop, false);
        if (!keepContent) {
            this.textContent = this._origContent || '';
            delete this._origContent;
        }
    }


    /****************\
    | PUBLIC METHODS |---------------------------------------------------------------------------------------------
    \****************/

    cheat.setAnimation = function (str) {
        cheat.kf.setKeyframes(str);
        if (cheat.options.get('showTimelineValues')) {
            cheat.kf.showTimelineValues();
        }
        setTitle(cheat.kf.animation);
        setCSS(cheat.kf.animation);
    };

    setup();
})(this);