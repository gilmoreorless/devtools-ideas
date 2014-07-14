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
    var devtoolsContent = document.querySelector('.fake-devtools-content');
    var devtoolsSidebarStyles = document.getElementById('keyframe-panel-styles');

    // STATE

    // var curAnim = '@-webkit-keyframes bounce {from{top:-100%}50%{top:0}75%{top:-30%}to{top:0}}';
    var curAnim = '@-webkit-keyframes bounce {from{width:30%;background-color:#B5F0F0;color:black}30%{background-color:blue;color:yellow}50%{width:10%}75%{background-color:green;color:yellow;width:20%}to{width:10%}}';
    // https://github.com/daneden/animate.css/blob/master/animate.css
    // var curAnim = '@-webkit-keyframes bounce {\n  0%, 20%, 53%, 80%, 100% {\n    transition-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);\n    transform: translate3d(0,0,0);\n  }\n  40%, 43% {\n    transition-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);\n    transform: translate3d(0, -30px, 0);\n  }\n  70% {\n    transition-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);\n    transform: translate3d(0, -15px, 0);\n  }\n  90% {\n    transform: translate3d(0,-4px,0);\n  }\n}';
    // var curAnim = '@-webkit-keyframes flash {\n  0%, 50%, 100% {\n    opacity: 1;\n  }\n\n  25%, 75% {\n    opacity: 0;\n  }\n}';
    // var curAnim = '@-webkit-keyframes bounce {from{background-color:red}50%{background-color:green}75%{background-color:darkred}to{background-color:white}}';
    // var curAnim = '@-webkit-keyframes test {from{z-index:0}50%{z-index:10}to{z-index:5}}';
    // var curAnim = '@-webkit-keyframes test-multinumber {from{transform:rotate(45deg);transform-origin:0 0}50%{transform-origin:100% 50%}to{transform:rotate(-45deg);transform-origin:50% 75%}}';
    // var curAnim = '@-webkit-keyframes test-multicolor {from{border-color:red red}50%{border-color:gold pink purple}to{border-color:blue green}}';


    /*****************\
    | PRIVATE METHODS |--------------------------------------------------------------------------------------------
    \*****************/

    // UTILS

    function setup() {
        cheat.kf = new KeyframeExplainer(kfRoot);
        cheat.kf.addUpdateElement(ref);
        cheat.setAnimation(curAnim);

        // Event listeners
        devtoolsSidebarStyles.addEventListener('click', function (e) {
            if (e.target.classList.contains('kf-anim-view-icon')) {
                cheat.options.set('showFakeElems', false);
            }
        }, false);

        // Options
        cheat.options.on('showFakeElems', setShowElems);
        cheat.options.on('showTimelineValues', setShowTimelineValues);

        setShowElems(cheat.options.get('showFakeElems'));
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


    /****************\
    | PUBLIC METHODS |---------------------------------------------------------------------------------------------
    \****************/

    cheat.setAnimation = function (str) {
        cheat.kf.setKeyframes(str);
        if (cheat.options.get('showTimelineValues')) {
            cheat.kf.showTimelineValues();
        }
        setTitle(cheat.kf.animation);
    };

    setup();
})(this);