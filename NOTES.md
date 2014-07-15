# IDEAS

## 2D transforms

* Edit mode
	* Add/edit rotation/skew/scale
	* Edit individual parts of the value
    * Interact with the element directly

## Keyframes

* Add in a callback system for `setStop` rather than directly manipulating the element
* When selecting a position in the timeline, show the computed value of all referenced properties at that time
* Output the defined keyframe CSS above or below the timeline. Click on percentages in text to highlight the same stop on the timeline. Do other things similar to Chekhov.
* Show an indicative canvas or SVG element in the background of the timeline row of each property, to illustrate the change of value over time including easing
    * Length values (dimensions, text-indent, etc.): A simple area chart - although `calc()` may throw a spanner in the works
    * Colours/Opacity: Gradients
    * Gradients: Um... hmmmm, not sure
    * `transform`: Some sort of visualisation of the transform, similar to the 2D transforms devtools panel used elsewhere in this project
        * Perhaps allow the transform timeline row to expand out to individual properties (scale, rotate, etc.), each with a separate visualisation - this wouldn't work for matrix() values though
    * `transform-origin`: NFI
    * `perspective` (+origin): NFI
    * `visibility`: Binary state (visible/hidden), display as an area chart
    * Fonts
        * Weight: Area chart, discrete steps of 100 only (interpolated value is rounded to nearest 100)
        * Size, Stretch, Line height: Same as length values
    * `clip`: NFI, requires showing 4 values changing simultaneously
    * (This requires manually calculating easing, or running through the computed styles at multiple % numbers to build a list of values)
* Make it themeable

## Linear gradients

* Do I really want to re-implement yet another gradient editor?
    * The advantage of doing it in devtools is seeing the results in real time on the actual element

## Flexbox

* NFI right now, need to look into what's actually available

## Font size, line height and vertical align

* NFI, but something would be good as the combination of these often does people's heads in



# KNOWN BUGS/LIMITATIONS

_(A.K.A. The stuff I willfully ignored in order to get the idea across quickly)_

## All

* Only done for Chrome devtools as an extension so far, as a proof of concept. Will need proper integration with Blink/WebKit/Gecko devtools (I'd say IE as well but that's not open source).

## 2D transforms

* Specificity of matching rules isn't correctly accounted for, just roughly guessed
* Indicator diagram doesn't scale to always show the full transformed element (e.g. translateX(1000px) will be off the screen)

## Keyframes timeline

* Performance is terrible; relies on generating a new animation every time
* After enabling the timeline, the element is in a permanently paused animation state


# BUGS FOUND IN PUT.JS

* Doesn't work with nested arrays - creates documentFragment for nodes but then returns array anyway
* Doesn't work with just `put('$', text)` - should create and return a textNode
