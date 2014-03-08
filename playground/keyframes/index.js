(function () {

    var dom = {};
    var domIds = ['input-css', 'parse-submit', 'parse-result', 'animate-me', 'main-container'];
    domIds.forEach(function (id) {
        newId = id.replace(/-(\w)/g, function (_, c) { return c.toUpperCase(); });
        dom[newId] = document.getElementById(id);
    });

    var kf = window.kf = new KeyframeExplainer(dom.mainContainer);

    function parse(str) {
        var parsed;
        var output = dom.parseResult;
        output.textContent = '';
        try {
            parsed = CSSParse(str);
            // output.textContent = JSON.stringify(parsed, null, 2);
            animate(str, parsed);
        } catch (e) {
            output.textContent = e;
        }
        showTable(str);
    }

    function animate(str, ast) {
        var animation = ast.stylesheet.rules.filter(function (rule) {
            return rule.type === 'keyframes';
        })[0];
        if (!animation) return;

        var name = animation.name;
        var sheet = document.createElement('style');
        sheet.textContent = str;
        document.head.appendChild(sheet);

        function listener() {
            dom.animateMe.removeEventListener('animationend', listener, false);
            dom.animateMe.removeEventListener('webkitAnimationEnd', listener, false);
            dom.animateMe.style.removeProperty('animation');
            dom.animateMe.style.removeProperty('-webkit-animation');
            document.head.removeChild(sheet);
        }
        dom.animateMe.addEventListener('animationend', listener, false);
        dom.animateMe.addEventListener('webkitAnimationEnd', listener, false);
        dom.animateMe.style.animationName = name;
        dom.animateMe.style.webkitAnimationName = name;
    }

    function showTable(str) {
        kf.setKeyframes(str);
    }

    dom.parseSubmit.addEventListener('click', function () {
        parse(dom.inputCss.value);
    }, false);

    parse(dom.inputCss.value);

})();
