console.log('DTM Content injected');

function A(obj) {
	return Array.prototype.slice.call(obj || []);
}
function AtoJ(obj) {
	return A(obj).map(toJSON);
}

var JSONConvertors = {
	CSSStyleDeclaration: function getStyleProps(style) {
		var styles = {};
		A(style).concat('cssText').forEach(function (prop) {
			styles[prop] = style[prop];
		});
		return styles;
	},
	CSSStyleRule: function getRuleProps(rule) {
		return {
			cssText: rule.cssText,
			selectorText: rule.selectorText,
			style: toJSON(rule.style)
		};
	},
	CSSRuleList: AtoJ
};

function toJSON(obj) {
	var con = obj.constructor.name;
	if (JSONConvertors[con]) {
		return JSONConvertors[con](obj);
	}
	return obj;
}

function getStylesAndRules(elem) {
	var computed = getComputedStyle(elem);
	var rules = getMatchedCSSRules(elem);
	var inlineStyle = elem.style;

	console.log({
		computed: computed,
		rules: rules,
		inlineStyle: inlineStyle
	});
	return toJSON({
		computed: toJSON(computed),
		rules: toJSON(rules),
		inlineStyle: toJSON(inlineStyle)
	});
}