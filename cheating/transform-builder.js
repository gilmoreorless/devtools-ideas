(function (root) {

    var TB = root.TransformBuilder = function (transformString) {
        this.parts = transformString ? TB.stringToParts(transformString) : [];
    };

    TB.partToString = function (part) {
        return part.type + '(' + part.values.join(', ') + ')';
    };

    TB.stringToParts = function (string) {
        var rPart = /\b([a-z]+)\s*\((.+?)\)/ig;
        var parts = [];
        var match;
        while ((match = rPart.exec(string))) {
            parts.push({
                type: match[1],
                values: match[2].split(',').map(function (s) { return s.trim(); })
            });
        }
        return parts;
    };

    TB.prototype.addPart = function (type, values) {
        var part = {
            type: type,
            values: values || []
        };
        this.parts.push(part);
        return part;
    };

    TB.prototype.setPart = function (index, type, values) {
        if (values === undefined && Array.isArray(type)) {
            values = type;
            type = null;
        }
        if (!this.parts[index]) {
            return;
        }
        if (type) {
            this.parts[index].type = type;
        }
        this.parts[index].values = values;
    };

    TB.prototype.setLastPartValues = function (values) {
        this.setPart(this.parts.length - 1, values);
    };

    TB.prototype.getPart = function (index) {
        var part = index === -1 ?
            this.parts.slice(index) :
            this.parts.slice(index, index + 1);
        return part[0];
    };

    TB.prototype.getLastPart = function () {
        return this.getPart(-1);
    };

    TB.prototype.removePart = function (index) {
        return this.parts.splice(index, 1)[0];
    };

    TB.prototype.popPart = function () {
        return this.removePart(-1);
    };

    TB.prototype.getPartStrings = function () {
        return this.parts.map(TB.partToString);
    };

    TB.prototype.toString = function () {
        if (!this.parts.length) {
            return 'none';
        }
        return this.getPartStrings().join(' ');
    };

})(this);