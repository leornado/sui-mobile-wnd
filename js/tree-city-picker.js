/* jshint unused:false*/

+function ($) {
  "use strict";

  var defaults = {

    cssClass: "city-picker",
    rotateEffect: false,  //为了性能
    splitChar: ' ',
    treeCols: $.smConfig.rawTreeCitiesData,
    colsCfg: [{cssClass: 'col-province'}, {cssClass: 'col-city'}, {cssClass: 'col-district'}],

    formatValue: function (p, values, displayValues) {
      if (!displayValues || !$.isArray(displayValues)) {
        if (!values || !$.isArray(values)) return '';
        return values.join(p.params.splitChar);
      }
      return displayValues.join(p.params.splitChar);
    }

  };

  $.fn.treeCityPicker = function (params) {
    return this.each(function () {
      if (!this) return;
      var p = $.extend({}, defaults, params), $this = $(this);

      if (p.value && p.value.length > 0) $this.val(p.value.join(p.splitChar));
      else delete p.value;

      $this.picker(p);
    });
  };

}(Zepto);
