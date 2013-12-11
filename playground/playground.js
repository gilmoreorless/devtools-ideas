(function () {
    var example = document.getElementById('example');

    // Proof of concept
    var pocRoot = document.getElementById('proof-of-concept');
    var pocTangle = new Tangle(pocRoot, {
        initialize: function () {
            this.marginTop = 10;
            this.paddingRight = 10;
        },

        update: function () {
            var style = example.style;
            style.marginTop = this.marginTop + 'px';
            style.paddingRight = this.paddingRight + 'px';
        }
    });
})();