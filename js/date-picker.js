/* jshint unused:false*/

+function ($) {
  "use strict";

  var today = new Date();

  var getDays = function (max) {
    var days = [];
    for (var i = 1; i <= (max || 31); i++) {
      days.push(i < 10 ? "0" + i : i);
    }
    return days;
  };

  var getDaysByMonthAndYear = function (month, year) {
    var int_d = new Date(year, parseInt(month) + 1 - 1, 1);
    var d = new Date(int_d - 1);
    return getDays(d.getDate());
  };

  var formatNumber = function (n) {
    return n < 10 ? "0" + n : n;
  };

  var filtYears = function (params) {
    var arr = [], years = params.cols[0].values, minYear, maxYear;

    if (params.minDate && params.defMinDate.getTime() != params.minDate.getTime()) minYear = params.minDate.getFullYear();
    if (params.maxDate && params.defMaxDate.getTime() != params.maxDate.getTime()) maxYear = params.maxDate.getFullYear();

    y:for (var i = 0; i < years.length; i++) {
      var year = years[i];
      if (minYear != undefined && year < minYear) continue;
      if (maxYear != undefined && year > maxYear) continue;

      if (params.isDateDisabled) {
        m:for (var month = 0; month < 12; month++) {
          for (var date = 1; date <= 31; date++) {
            var d = new Date(year, month, date);
            if (d.getFullYear() != year) continue y;
            if (d.getMonth() != month) continue m;
            if (!params.isDateDisabled(d)) {
              arr.push(year);
              continue y;
            }
          }
        }
      } else arr.push(year);
    }
    return arr;
  };

  var initMinMaxDate = function (picker, field) {
    var pm = picker.params;
    if (!picker[field] || picker[field].getTime() != pm[field].getTime())
      pm[field] = picker[field] = new Date(pm[field].getFullYear(), pm[field].getMonth(), pm[field].getDate());
  };

  var initMinDate = function (picker) {
    initMinMaxDate(picker, 'minDate');
  };

  var initMaxDate = function (picker) {
    initMinMaxDate(picker, 'maxDate');
  };

  var isOverMin = function (date, minDateTime, hasMinDate) {
    return hasMinDate && date.getTime() < minDateTime;
  };

  var isOverMax = function (date, maxDateTime, hasMaxDate) {
    return hasMaxDate && date.getTime() > maxDateTime;
  };

  var formatDate = function (date) {
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  };

  var defMonthes = ('01 02 03 04 05 06 07 08 09 10 11 12').split(' ');
  var defYears = function () {
    var arr = [];
    for (var i = 1950; i <= 2030; i++) arr.push(i);
    return arr;
  }();
  var ONE_DAY = 24 * 3600 * 1000;

  var getCheckedDate = function (picker, values, oldValues) {
    var days = getDaysByMonthAndYear(values[1], values[0]), resetOld = false, newValues;
    var currDay = values[2];
    if (currDay > days.length) currDay = days.length;

    // check min max disabled
    var pm = picker.params, currDate = new Date(values[0], Number(values[1]) - 1, values[2]);

    if (!resetOld && pm.minDate) {
      initMinDate(picker);
      resetOld = currDate.getTime() < picker.minDate.getTime();
      if (resetOld && !newValues) newValues = [picker.minDate.getFullYear(), formatNumber(picker.minDate.getMonth() + 1), picker.minDate.getDate()];
    }

    if (!resetOld && pm.maxDate) {
      initMaxDate(picker);
      resetOld = currDate.getTime() > picker.maxDate.getTime();
      if (resetOld && !newValues) newValues = [picker.maxDate.getFullYear(), formatNumber(picker.maxDate.getMonth() + 1), picker.maxDate.getDate()];
    }

    if (resetOld && pm.isDateDisabled) {
      currDate = new Date(newValues[0], Number(newValues[1]) - 1, newValues[2]);
      if (pm.isDateDisabled(currDate)) resetOld = false;
    }

    if (!resetOld && pm.isDateDisabled && pm.isDateDisabled(currDate)) {
      if (!oldValues) {
        var val = $(picker.input).val(), vals = picker.params.value, valDate = new Date(today.getTime());
        if (val) vals = val.split(picker.params.splitChar);
        if (vals.length == 3 && vals[0] && vals[1] && vals[2]) valDate = new Date(vals[0], vals[1], vals[2]);
        oldValues = [valDate.getFullYear(), formatNumber(valDate.getMonth()), valDate.getDate()];
      }
      currDay = oldValues[2];
      resetOld = true;

      var newDate = newValues ? new Date(newValues[0], Number(newValues[1]) - 1, newValues[2]) : new Date(currDate.getTime());
      newValues = null;
      var oldDate = new Date(oldValues[0], Number(oldValues[1]) - 1, oldValues[2]);
      var newDateBefore = new Date(newDate.getTime()), newDateAfter = new Date(newDate.getTime()), goOnLeft = true, goOnRight = true;
      var isAfterOld = newDateBefore.getTime() > oldDate.getTime();

      var minDateTime, maxDateTime, hasMin = picker.minDate || isAfterOld, hasMax = picker.maxDate || !isAfterOld;
      if (hasMin) {
        if (!isAfterOld || picker.minDate && oldDate.getTime() < picker.minDate.getTime()) minDateTime = picker.minDate.getTime();
        else minDateTime = oldDate.getTime();
      }
      if (hasMax) {
        if (isAfterOld || picker.maxDate && oldDate.getTime() > picker.maxDate.getTime()) maxDateTime = picker.maxDate.getTime();
        else maxDateTime = oldDate.getTime();
      }

      while (goOnLeft || goOnRight) {
        if (goOnLeft) {
          newDateBefore.setTime(newDateBefore.getTime() - ONE_DAY);
          goOnLeft = !isOverMin(newDateBefore, minDateTime, hasMin);
          if (!pm.isDateDisabled(newDateBefore)) {
            newValues = [newDateBefore.getFullYear(), formatNumber(newDateBefore.getMonth() + 1), newDateBefore.getDate()];
            break;
          }
          if (!goOnLeft) {
            var _tmpMin = new Date(minDateTime);
            if (!pm.isDateDisabled(_tmpMin)) {
              newValues = [_tmpMin.getFullYear(), formatNumber(_tmpMin.getMonth() + 1), _tmpMin.getDate()];
              break;
            } else goOnLeft = false;
          }
        }
        if (goOnRight) {
          newDateAfter.setTime(newDateAfter.getTime() + ONE_DAY);
          goOnRight = !isOverMax(newDateAfter, maxDateTime, hasMax);
          if (!pm.isDateDisabled(newDateAfter)) {
            newValues = [newDateAfter.getFullYear(), formatNumber(newDateAfter.getMonth() + 1), newDateAfter.getDate()];
            break;
          }
          if (!goOnRight) {
            var _tmpMax = new Date(maxDateTime);
            if (!pm.isDateDisabled(_tmpMax)) {
              newValues = [_tmpMax.getFullYear(), formatNumber(_tmpMax.getMonth() + 1), _tmpMax.getDate()];
              break;
            } else goOnRight = false;
          }
        }
      }
      if (!newValues && oldValues) newValues = oldValues;
    }
    return resetOld && newValues ? newValues : currDay;
  };

  var defaults = {
    rotateEffect: false,  //为了性能
    splitChar: '-',
    value: [today.getFullYear(), formatNumber(today.getMonth() + 1), formatNumber(today.getDate())],

    onClose: function (picker) {
      picker.opened = false;
    },

    onOpen: function (picker) {
      picker.opened = true;
      var oldValues = picker.value, inputVal = $(picker.input).val(), inputVals = inputVal.split(picker.params.splitChar);
      if ((!oldValues || oldValues.length != 3) && !inputVals || inputVals.length != 3)
        inputVals = [today.getFullYear(), formatNumber(today.getMonth() + 1), formatNumber(today.getDate())];

      if (inputVals.length == 3) {
        for (var i = 0; i < picker.cols.length; i++)
          if (!picker.cols[i].divider) picker.cols[i].setValue('', 0, null, true);
        picker.updateValue(true);

        var result = getCheckedDate(picker, inputVals, oldValues);
        if (!$.isArray(result)) result = [inputVals[0], inputVals[1], result];
        picker.setValue(result)
      }
    },

    onChange: function (picker, values, displayValues, oldValues, oldDisplayValues) {
      var inputVal = $(picker.input).val(), forceSetValue = false;
      if (!picker.opened && inputVal && values && values.length == 3) {
        var inputValStr = values[0] + picker.params.splitChar + values[1] + picker.params.splitChar + values[2];
        if (inputVal != inputValStr) {
          values = inputVal.split(picker.params.splitChar);
          forceSetValue = true;
        }
      }

      var result = getCheckedDate(picker, values, oldValues);
      if ($.isArray(result)) {
        picker.setValue(result)
      } else {
        if (forceSetValue) picker.setValue([values[0], values[1], result]);
        else picker.cols[2].setValue(result);
      }
    },

    formatValue: function (p, values, displayValues) {
      if (!displayValues || displayValues.length != 3) return '';
      return displayValues[0] + p.params.splitChar + values[1] + p.params.splitChar + values[2];
    },

    cols: [
      {values: defYears},// Years
      {values: defMonthes},// Months
      {values: getDays()}// Days
    ]
  };

  $.fn.datePicker = function (params) {
    return this.each(function () {
      if (!this) return;

      var $this = $(this);
      var defMinDate = new Date(defYears[0], 0, 1);
      var defMaxDate = new Date(defYears[defYears.length - 1], 11, 31);
      var p = $.extend({
        minDate: defMinDate, maxDate: defMaxDate, defMinDate: defMinDate, defMaxDate: defMaxDate
      }, defaults, params);

      if (p.minDate || p.maxDate || p.isDateDisabled)
        p.cols = [{values: filtYears(p)}, {values: defMonthes}, {values: getDays()}];
      if ($this && $this.val()) delete p.value;

      $this.picker(p);
      if (params.value) $this.val(p.formatValue(p, p.value, p.value));
    });
  };

}(Zepto);
