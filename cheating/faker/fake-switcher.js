(function () {
    var list = put('ul.fake-switcher');

    var themes = [
        {id: 'chr', name: 'Chrome', classes: 'fake-chrome'},
        {id: 'ffl', name: 'Firefox (light)', classes: 'fake-ff'},
        {id: 'ffd', name: 'Firefox (dark)', classes: 'fake-ff fake-ff-dark'}
    ];
    themes.forEach(function (theme) {
        put(list, 'li[data-theme=$] a[href=#] $', theme.id, theme.name);
    });

    function selectTheme(id) {
        var theme = themes.filter(function (t) { return t.id === id; })[0];
        if (!theme) return;
        var curTheme = list.querySelector('.selected');
        if (curTheme) {
            if (curTheme.getAttribute('data-theme') === id) {
                return; // Same theme, no action needed
            }
            curTheme.classList.remove('selected');
        }
        var newTheme = list.querySelector('[data-theme=' + theme.id + ']');
        if (newTheme) {
            newTheme.classList.add('selected');
            document.documentElement.className = theme.classes;
        }
    }

    list.addEventListener('click', function (e) {
        e.preventDefault();
        var node = e.target;
        if (node.nodeName === 'A') {
            node = node.parentNode;
        }
        var theme = node.getAttribute('data-theme');
        if (theme) {
            selectTheme(theme);
        }
    }, false);

    selectTheme(themes[0].id);
    put(document.body, list);
})();