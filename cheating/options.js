(function (root) {

    function initDom(obj) {
        var list = put(document.body, 'ul.cheat-options li.title $ <', 'Options');
        list.addEventListener('click', function (e) {
            var key = e.target.getAttribute('data-option-key');
            if (key) {
                obj.set(key, e.target.checked, false);
            }
        }, false);
        obj.rootNode = list;
    }

    function createOptionNode(key, opt) {
        var li = put('li');
        var label = put(li, 'label');
        var input = put(label, 'input[type=checkbox][data-option-key=$]', key);
        input.checked = opt.checked;
        put(label, '$', opt.description);

        opt.listNode = li;
        opt.inputNode = input;
    }

    function triggerChange(obj, key) {
        if (!obj.listeners[key] || !obj.listeners[key].length) {
            return;
        }
        var value = obj.get(key);
        obj.listeners[key].forEach(function (listener) {
            listener.call(obj, value);
        });
    }

    var Opt = root.Options = function (options) {
        this.options = {};
        this.listeners = {};
        initDom(this);
        if (options) {
            var key, desc, value;
            for (key in options) {
                if (Array.isArray(options[key])) {
                    desc = options[key][0];
                    value = options[key][1];
                } else {
                    desc = key;
                    value = options[key];
                }
                this.add(key, desc, value);
            }
        }
    };

    Opt.prototype.get = function (key) {
        if (key in this.options) {
            return this.options[key].checked;
        }
    };

    Opt.prototype.set = function (key, value) {
        if (!(key in this.options)) {
            return this.add(key, key, value);
        }
        value = !!value;
        this.options[key].checked = value;
        if (arguments[2] !== false) {
            this.options[key].inputNode.checked = value;
        }
        triggerChange(this, key);
    };

    Opt.prototype.add = function (key, description, value) {
        if (key in this.options) {
            return;
        }
        var opt = {
            description: description || '',
            checked: !!value
        };
        createOptionNode(key, opt);
        put(this.rootNode, opt.listNode);
        this.options[key] = opt;
    };

    Opt.prototype.on = function (key, listener) {
        var l = this.listeners[key];
        if (!l) {
            l = this.listeners[key] = [];
        }
        l.push(listener);
    };

})(this);