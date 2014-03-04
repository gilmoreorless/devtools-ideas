console.log('DTM Content injected');

function A(obj) {
	return Array.prototype.slice.call(obj || []);
}
function AtoJ(obj) {
	return A(obj).map(JSONable);
}

var JSONConvertors = {
	Object: function (obj) {
		var clone = {};
		for (var key in obj) {
			clone[key] = JSONable(obj[key]);
		}
		return clone;
	},

	CSSStyleDeclaration: function getStyleProps(style) {
		var copy = {};
		for (var prop in style) {
			if (prop === 'length' || (style[prop] && typeof style[prop] === 'string')) {
				copy[prop] = style[prop];
			}
		}
		return copy;
	},
	CSSStyleRule: function getRuleProps(rule) {
		return {
			cssText: rule.cssText,
			selectorText: rule.selectorText,
			style: JSONable(rule.style)
		};
	},
	CSSRuleList: AtoJ
};

function JSONable(obj) {
	if (obj == null) {
		return obj;
	}
	var con = obj.constructor.name;
	if (JSONConvertors[con]) {
		return JSONConvertors[con](obj);
	}
	if (Array.isArray(obj)) {
		return obj.map(JSONable);
	}
	return obj;
}

function getStylesAndRules(elem) {
	var computed = getComputedStyle(elem);
	var rules = getMatchedCSSRules(elem) || [];
	var inlineStyle = elem.style;

	console.log({
		computed: computed,
		rules: rules,
		inlineStyle: inlineStyle
	});
	return JSONable({
		computed: computed,
		rules: rules,
		inlineStyle: inlineStyle
	});
}