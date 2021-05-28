+function ($) {
  "use strict";

  //比较一个字符串版本号
  //a > b === 1
  //a = b === 0
  //a < b === -1
  $.compareVersion = function (a, b) {
    var as = a.split('.');
    var bs = b.split('.');
    if (a === b) return 0;

    for (var i = 0; i < as.length; i++) {
      var x = parseInt(as[i]);
      if (!bs[i]) return 1;
      var y = parseInt(bs[i]);
      if (x < y) return -1;
      if (x > y) return 1;
    }
    return -1;
  };

  $.getCurrentPage = function () {
    return $(".page-current")[0] || $(".page")[0] || document.body;
  };

  $.sui = {};

  $.sui.enHtml = function (value) {
    return !value ? '' : String(value)
      .replace(/&/g, "&amp;")
      .replace(/>/g, "&gt;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  };

  $.sui.enJs = function (string) {
    return !string ? '' : ('' + string)
      .replace(/["'\\\n\r\u2028\u2029]/g, function (character) {
        switch (character) {
          case '"':
          case "'":
          case '\\':
            return '\\' + character;
          case '\n':
            return '\\n';
          case '\r':
            return '\\r';
          case '\u2028':
            return '\\u2028';
          case '\u2029':
            return '\\u2029'
        }
      })
  };

  $.sui.isNumber = function (value) {
    return typeof value === 'number';
  };

  $.sui.isUndefined = function (value) {
    return typeof value === 'undefined';
  };

  $.sui.isDefined = function (value) {
    return typeof value !== 'undefined';
  };

  $.sui.orderedMap = function () {
    var keys = [], vals = [], map = {};
    var _this = this;

    this.map = function () {
      return $.extend({}, map);
    };

    this.size = function () {
      return keys.length;
    };

    this.containsKey = function (k) {
      return k in map;
    };

    this.clear = function () {
      keys.splice(0, keys.length), vals.splice(0, vals.length);
      for (var k in map) delete map[k];
    };

    this.keys = function () {
      return keys.slice();
    };

    this.vals = function () {
      return vals.slice();
    };

    this.put = function (k, v) {
      if (k === undefined || k === null) return;
      if (k in map) {
        map[k] = v;
        return;
      }

      map[k] = v;
      keys.push(k);
      vals.push(v);
    };

    this.get = function (k) {
      if (k === undefined || k == null) return;
      return map[k] ? map[k] : undefined;
    };

    this.getAt = function (index) {
      if (index >= keys.length) return;
      return vals[index];
    };

    this.remove = function (k) {
      if (k === undefined || k == null) return;
      if (!_this.containsKey(k)) return;

      var idx = keys.indexOf(k);
      if (idx >= 0) {
        keys.splice(idx, 1);
        vals.splice(idx, 1);
        var v = map[k];
        delete map[k];
        return v;
      }
    };

    this.removeAt = function (index) {
      if (index >= keys.length) return;

      var k = keys[index];
      return _this.remove(k);
    }
  };

  $._ = {};
  $._.now = function () { return new Date().getTime() };
  $._.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = $._.now() - timestamp;
      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = $._.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }
      return result;
    };
  };

}(Zepto);
