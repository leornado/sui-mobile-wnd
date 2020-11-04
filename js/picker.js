/*======================================================
 ************   Picker   ************
 ======================================================*/
/* jshint unused:false */
/* jshint multistr:true */
+function ($) {
  "use strict";
  var Picker = function (params) {
    var p = this;
    var defaults = {
      splitChar: ' ',
      updateValuesOnMomentum: false,
      updateValuesOnTouchmove: true,
      rotateEffect: false,
      momentumRatio: 7,
      freeMode: false,
      // Common settings
      scrollToInput: true,
      inputReadOnly: true,
      toolbar: true,
      toolbarCloseText: '确定',
      colsCfg: [],
      toolbarTemplate: '<header class="bar bar-nav">\
                <button class="button button-link pull-right close-picker">确定</button>\
                <h1 class="title">请选择</h1>\
                </header>',
    };
    params = params || {};
    for (var def in defaults) {
      if (typeof params[def] === 'undefined') {
        params[def] = defaults[def];
      }
    }
    p.params = params;
    p.cols = [];
    p.initialized = false;

    if (p.params.treeCols) {
      var levelCount = p.params.dataLevel, dataLvl = 0, isSpecifyLevelCount = $.sui.isNumber(levelCount);
      var topCol = {values: [], displayValues: []};
      p.params.cols = [], p.colMaps = {cols: {}, col: topCol, originData: p.params.treeCols}, p.isLinkage = true;

      var convertData2Col = function (level, data, parent) {
        dataLvl = Math.max(level, dataLvl);
        if (isSpecifyLevelCount && level > levelCount) return;

        parent.col.onChange = function (picker, value, displayValue) {
          var lastValue = value, lastColMap = parent;
          for (var l = level; l < p.maxLevel; l++) {
            if (p.cols[l].replaceValues) {
              var changeCol = lastColMap = lastColMap.cols[lastValue];
              p.cols[l].onChange = changeCol.col.onChange;
              p.cols[l].replaceValues(changeCol.col.values.concat(), changeCol.col.displayValues.concat());
              p.resetColVisible(p.cols[l]);
              lastValue = changeCol.col.values[0];
            }
          }
          picker.updateValue();
          if (parent.originData.onChange) parent.originData.onChange(p, p.value, p.displayValue);
        };

        $.each(data, function (i, item) {
          var itemCode = item.code || item.c, itemName = item.name || item.n, itemData = item.data || item.d;
          parent.col.values.push(itemCode);
          parent.col.displayValues.push(itemName || itemCode);
          if (itemData && itemData.length > 0) {
            var itemColMap = parent.cols[itemCode] =
            {cols: {}, col: {values: [], displayValues: [], textAlign: 'center'}, originData: item};
            convertData2Col(level + 1, itemData, itemColMap);
          } else if (isSpecifyLevelCount && level < levelCount) {
            parent.cols[itemCode] = {
              cols: {}, originData: item,
              col: {values: [''], displayValues: [p.params.emptyDisp || ''], textAlign: 'center'}
            };
          }
        });
      };

      var fillEmptyCols = function (level, parent) {
        if (level >= p.maxLevel) return;

        $.each(parent.col.values, function (i, code) {
          if (!parent.cols[code]) {
            parent.cols[code] = {
              cols: {}, col: {values: [''], displayValues: [p.params.emptyDisp || ''], textAlign: 'center'}
            };
          }
          fillEmptyCols(level + 1, parent.cols[code]);
        });
      };

      convertData2Col(1, p.params.treeCols, p.colMaps);

      var lastColMap = p.colMaps, maxLvl = p.maxLevel = isSpecifyLevelCount ? levelCount : dataLvl;
      fillEmptyCols(1, p.colMaps);

      for (var i = 0; i < maxLvl; i++) {
        if (lastColMap) {
          var lastCol = lastColMap.col;
          if (lastCol && lastCol.values && lastCol.values.length > 0) {
            p.params.cols.push({
              values: lastCol.values.concat(),
              displayValues: lastCol.displayValues.concat(),
              onChange: lastCol.onChange
            });
            lastColMap = lastColMap.cols[lastCol.values[0]];
          }
        } else {
          p.params.cols.push({values: [], displayValues: []});
        }
      }
    }

    // Inline flag
    p.inline = p.params.container ? true : false;

    // 3D Transforms origin bug, only on safari
    var originBug = $.device.ios || (navigator.userAgent.toLowerCase().indexOf('safari') >= 0 && navigator.userAgent.toLowerCase().indexOf('chrome') < 0) && !$.device.android;

    // Value
    p.setValue = function (arrValues, transition) {
      var valueIndex = 0;
      for (var i = 0; i < p.cols.length; i++) {
        if (p.cols[i] && !p.cols[i].divider) {
          p.cols[i].setValue(arrValues[valueIndex], transition);
          valueIndex++;
        }
      }
    };
    p.updateValue = function (clear) {
      var newValue = [];
      var newDisplayValue = [];
      for (var i = 0; i < p.cols.length; i++) {
        if (!p.cols[i].divider) {
          newValue.push(p.cols[i].value);
          newDisplayValue.push(p.cols[i].displayValue);
        }
      }
      if (newValue.indexOf(undefined) >= 0) {
        return;
      }
      var oldValue = p.value, oldDisplayValue = p.displayValue;
      ;
      p.value = clear ? [] : newValue;
      p.displayValue = clear ? [] : newDisplayValue;
      if (p.params.onChange) {
        p.params.onChange(p, p.value, p.displayValue, oldValue, oldDisplayValue);
      }
      if (p.input && p.input.length > 0) {
        $(p.input).val(p.params.formatValue ? p.params.formatValue(p, p.value, p.displayValue) : p.value.join(p.params.splitChar));
        $(p.input).trigger('change');
      }
    };

    p.resetColVisible = function (col) {
      if (col.values.length == 1 && (col.displayValues && col.displayValues.length == 1 && !col.displayValues[0]
        || col.values.length.length == 1 && !col.values[0]))
        return col.container.hide();
      col.container.css('display', '')
    };

    // Columns Handlers
    p.initPickerCol = function (colElement, updateItems) {
      var colContainer = $(colElement);
      var colIndex = colContainer.index();
      var col = p.cols[colIndex];
      if (col.divider) return;
      col.container = colContainer;
      col.wrapper = col.container.find('.picker-items-col-wrapper');
      col.items = col.wrapper.find('.picker-item');

      var i, j;
      var wrapperHeight, itemHeight, itemsHeight, minTranslate, maxTranslate;
      col.replaceValues = function (values, displayValues) {
        col.destroyEvents();
        col.values = values;
        col.displayValues = displayValues;
        var newItemsHTML = p.columnHTML(col, true);
        col.wrapper.html(newItemsHTML);
        col.items = col.wrapper.find('.picker-item');
        col.calcSize();
        col.setValue(col.values[0], 0, true);
        col.initEvents();
      };
      col.calcSize = function () {
        p.resetColVisible(col);
        if (p.params.rotateEffect) {
          col.container.removeClass('picker-items-col-absolute');
          if (!col.width) col.container.css({width: ''});
        }
        var colWidth, colHeight;
        colWidth = 0;
        colHeight = col.container[0].offsetHeight;
        wrapperHeight = col.wrapper[0].offsetHeight;
        itemHeight = col.items[0].offsetHeight;
        itemsHeight = itemHeight * col.items.length;
        minTranslate = colHeight / 2 - itemsHeight + itemHeight / 2;
        maxTranslate = col.maxTranslate = colHeight / 2 - itemHeight / 2;
        if (col.width) {
          colWidth = col.width;
          if (parseInt(colWidth, 10) === colWidth) colWidth = colWidth + 'px';
          col.container.css({width: colWidth});
        }
        if (p.params.rotateEffect) {
          if (!col.width) {
            col.items.each(function () {
              var item = $(this);
              item.css({width: 'auto'});
              colWidth = Math.max(colWidth, item[0].offsetWidth);
              item.css({width: ''});
            });
            col.container.css({width: (colWidth + 2) + 'px'});
          }
          col.container.addClass('picker-items-col-absolute');
        }
      };
      col.calcSize();

      col.wrapper.transform('translate3d(0,' + maxTranslate + 'px,0)').transition(0);


      var activeIndex = 0;
      var animationFrameId;

      // Set Value Function
      col.setValue = function (newValue, transition, valueCallbacks, clear) {
        if (typeof transition === 'undefined') transition = '';
        var newActiveIndex = clear ? 0 : col.wrapper.find('.picker-item[data-picker-value="' + $.sui.enJs(newValue) + '"]').index();
        if (typeof newActiveIndex === 'undefined' || newActiveIndex === -1) {
          return;
        }
        var newTranslate = -newActiveIndex * itemHeight + maxTranslate;
        // Update wrapper
        col.wrapper.transition(transition);
        col.wrapper.transform('translate3d(0,' + (newTranslate) + 'px,0)');

        // Watch items
        if (p.params.updateValuesOnMomentum && col.activeIndex && col.activeIndex !== newActiveIndex) {
          $.cancelAnimationFrame(animationFrameId);
          col.wrapper.transitionEnd(function () {
            $.cancelAnimationFrame(animationFrameId);
          });
          updateDuringScroll();
        }

        // Update items
        col.updateItems(newActiveIndex, newTranslate, transition, valueCallbacks, clear);
      };

      col.updateItems = function (activeIndex, translate, transition, valueCallbacks, clear) {
        if (typeof translate === 'undefined') {
          translate = $.getTranslate(col.wrapper[0], 'y');
        }
        if (typeof activeIndex === 'undefined') activeIndex = -Math.round((translate - maxTranslate) / itemHeight);
        if (activeIndex < 0) activeIndex = 0;
        if (activeIndex >= col.items.length) activeIndex = col.items.length - 1;
        var previousActiveIndex = col.activeIndex;
        col.activeIndex = activeIndex;
        /*
         col.wrapper.find('.picker-selected, .picker-after-selected, .picker-before-selected').removeClass('picker-selected picker-after-selected picker-before-selected');

         col.items.transition(transition);
         var selectedItem = col.items.eq(activeIndex).addClass('picker-selected').transform('');
         var prevItems = selectedItem.prevAll().addClass('picker-before-selected');
         var nextItems = selectedItem.nextAll().addClass('picker-after-selected');
         */
        //去掉 .picker-after-selected, .picker-before-selected 以提高性能
        col.wrapper.find('.picker-selected').removeClass('picker-selected');
        if (p.params.rotateEffect) {
          col.items.transition(transition);
        }
        var selectedItem = col.items.eq(activeIndex).addClass('picker-selected').transform('');
        if (clear) selectedItem.removeClass('picker-selected');

        if (valueCallbacks || typeof valueCallbacks === 'undefined') {
          // Update values
          col.value = selectedItem.attr('data-picker-value');
          col.displayValue = col.displayValues ? col.displayValues[activeIndex] : col.value;
          // On change callback
          if (previousActiveIndex !== activeIndex) {
            if (col.onChange) {
              col.onChange(p, col.value, col.displayValue);
            }
            p.updateValue(clear);
          }
        }

        // Set 3D rotate effect
        if (!p.params.rotateEffect) {
          return;
        }
        var percentage = (translate - (Math.floor((translate - maxTranslate) / itemHeight) * itemHeight + maxTranslate)) / itemHeight;

        col.items.each(function () {
          var item = $(this);
          var itemOffsetTop = item.index() * itemHeight;
          var translateOffset = maxTranslate - translate;
          var itemOffset = itemOffsetTop - translateOffset;
          var percentage = itemOffset / itemHeight;

          var itemsFit = Math.ceil(col.height / itemHeight / 2) + 1;

          var angle = (-18 * percentage);
          if (angle > 180) angle = 180;
          if (angle < -180) angle = -180;
          // Far class
          if (Math.abs(percentage) > itemsFit) item.addClass('picker-item-far');
          else item.removeClass('picker-item-far');
          // Set transform
          item.transform('translate3d(0, ' + (-translate + maxTranslate) + 'px, ' + (originBug ? -110 : 0) + 'px) rotateX(' + angle + 'deg)');
        });
      };

      function updateDuringScroll() {
        animationFrameId = $.requestAnimationFrame(function () {
          col.updateItems(undefined, undefined, 0);
          updateDuringScroll();
        });
      }

      // Update items on init
      if (updateItems) col.updateItems(0, maxTranslate, 0);

      var allowItemClick = true;
      var isTouched, isMoved, touchStartY, touchCurrentY, touchStartTime, touchEndTime, startTranslate, returnTo, currentTranslate, prevTranslate, velocityTranslate, velocityTime;

      function handleTouchStart(e) {
        if (isMoved || isTouched) return;
        e.preventDefault();
        isTouched = true;
        touchStartY = touchCurrentY = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
        touchStartTime = (new Date()).getTime();

        allowItemClick = true;
        startTranslate = currentTranslate = $.getTranslate(col.wrapper[0], 'y');
      }

      function handleTouchMove(e) {
        if (!isTouched) return;
        e.preventDefault();
        allowItemClick = false;
        touchCurrentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
        if (!isMoved) {
          // First move
          $.cancelAnimationFrame(animationFrameId);
          isMoved = true;
          startTranslate = currentTranslate = $.getTranslate(col.wrapper[0], 'y');
          col.wrapper.transition(0);
        }
        e.preventDefault();

        var diff = touchCurrentY - touchStartY;
        currentTranslate = startTranslate + diff;
        returnTo = undefined;

        // Normalize translate
        if (currentTranslate < minTranslate) {
          currentTranslate = minTranslate - Math.pow(minTranslate - currentTranslate, 0.8);
          returnTo = 'min';
        }
        if (currentTranslate > maxTranslate) {
          currentTranslate = maxTranslate + Math.pow(currentTranslate - maxTranslate, 0.8);
          returnTo = 'max';
        }
        // Transform wrapper
        col.wrapper.transform('translate3d(0,' + currentTranslate + 'px,0)');

        // Update items
        col.updateItems(undefined, currentTranslate, 0, p.params.updateValuesOnTouchmove);

        // Calc velocity
        velocityTranslate = currentTranslate - prevTranslate || currentTranslate;
        velocityTime = (new Date()).getTime();
        prevTranslate = currentTranslate;
      }

      function handleTouchEnd(e) {
        if (!isTouched || !isMoved) {
          isTouched = isMoved = false;
          return;
        }
        isTouched = isMoved = false;
        col.wrapper.transition('');
        if (returnTo) {
          if (returnTo === 'min') {
            col.wrapper.transform('translate3d(0,' + minTranslate + 'px,0)');
          }
          else col.wrapper.transform('translate3d(0,' + maxTranslate + 'px,0)');
        }
        touchEndTime = new Date().getTime();
        var velocity, newTranslate;
        if (touchEndTime - touchStartTime > 300) {
          newTranslate = currentTranslate;
        }
        else {
          velocity = Math.abs(velocityTranslate / (touchEndTime - velocityTime));
          newTranslate = currentTranslate + velocityTranslate * p.params.momentumRatio;
        }

        newTranslate = Math.max(Math.min(newTranslate, maxTranslate), minTranslate);

        // Active Index
        var activeIndex = -Math.floor((newTranslate - maxTranslate) / itemHeight);

        // Normalize translate
        if (!p.params.freeMode) newTranslate = -activeIndex * itemHeight + maxTranslate;

        // Transform wrapper
        col.wrapper.transform('translate3d(0,' + (parseInt(newTranslate, 10)) + 'px,0)');

        // Update items
        col.updateItems(activeIndex, newTranslate, '', true);

        // Watch items
        if (p.params.updateValuesOnMomentum) {
          updateDuringScroll();
          col.wrapper.transitionEnd(function () {
            $.cancelAnimationFrame(animationFrameId);
          });
        }

        // Allow click
        setTimeout(function () {
          allowItemClick = true;
        }, 100);
      }

      function handleClick(e) {
        if (!allowItemClick) return;
        $.cancelAnimationFrame(animationFrameId);
        /*jshint validthis:true */
        var value = $(this).attr('data-picker-value');
        col.setValue(value);
      }

      col.initEvents = function (detach) {
        var method = detach ? 'off' : 'on';
        col.container[method]($.touchEvents.start, handleTouchStart);
        col.container[method]($.touchEvents.move, handleTouchMove);
        col.container[method]($.touchEvents.end, handleTouchEnd);
        col.items[method]('click', handleClick);
      };
      col.destroyEvents = function () {
        col.initEvents(true);
      };

      col.container[0].f7DestroyPickerCol = function () {
        col.destroyEvents();
      };

      col.initEvents();

    };
    p.destroyPickerCol = function (colContainer) {
      colContainer = $(colContainer);
      if ('f7DestroyPickerCol' in colContainer[0]) colContainer[0].f7DestroyPickerCol();
    };
    // Resize cols
    function resizeCols() {
      if (!p.opened) return;
      for (var i = 0; i < p.cols.length; i++) {
        if (!p.cols[i].divider) {
          p.cols[i].calcSize();
          p.cols[i].setValue(p.cols[i].value, 0, false);
        }
      }
    }

    $(window).on('resize', resizeCols);

    // HTML Layout
    p.columnHTML = function (col, onlyItems, colCfg) {
      var columnItemsHTML = '', colCfg = colCfg || {};
      var columnHTML = '';
      if (!col.textAlign) col.textAlign = 'center';
      if (col.divider) {
        columnHTML += '<div class="picker-items-col picker-items-col-divider ' + (col.textAlign ? 'picker-items-col-' + col.textAlign : '') + ' ' + (col.cssClass || colCfg.cssClass || p.params.colCssClass || '') + '">' + col.content + '</div>';
      }
      else {
        for (var j = 0; j < col.values.length; j++) {
          var dispVal = $.sui.enHtml(col.displayValues ? col.displayValues[j] : col.values[j]);
          columnItemsHTML += '<div class="picker-item" data-picker-value="' + $.sui.enHtml(col.values[j]) + '">' + dispVal + '</div>';
        }

        columnHTML += '<div class="picker-items-col ' + (col.textAlign ? 'picker-items-col-' + col.textAlign : '') + ' ' + (col.cssClass || colCfg.cssClass || p.params.colCssClass || '') + '"><div class="picker-items-col-wrapper">' + columnItemsHTML + '</div></div>';
      }
      return onlyItems ? columnItemsHTML : columnHTML;
    };
    p.layout = function () {
      var pickerHTML = '';
      var pickerClass = '';
      var i;
      p.cols = [];
      var colsHTML = '';
      for (i = 0; i < p.params.cols.length; i++) {
        var col = p.params.cols[i];
        if (i > 0) {
          if (!col) col = p.params.cols[i] = {values: '', textAlign: 'center', displayValues: '　'};
          else {
            if (!col.values) col.values = [];
            if (col.values.length <= 0) {
              col.values.push('');
              if (!col.displayValues) col.displayValues = [];
              col.displayValues.push(p.params.emptyDisp || '');
            }
          }
        }
        colsHTML += p.columnHTML(p.params.cols[i], null, p.params.colsCfg[i]);
        p.cols.push(col);
      }
      pickerClass = 'picker-modal picker-columns ' + (p.params.cssClass || '') + (p.params.rotateEffect ? ' picker-3d' : '');
      pickerHTML =
        '<div class="' + (pickerClass) + '">' +
        (p.params.toolbar ? p.params.toolbarTemplate.replace(/{{closeText}}/g, p.params.toolbarCloseText) : '') +
        '<div class="picker-modal-inner picker-items">' +
        colsHTML +
        '<div class="picker-center-highlight"></div>' +
        '</div>' +
        '</div>';

      p.pickerHTML = pickerHTML;
    };

    // Input Events
    function openOnInput(e) {
      e.preventDefault();
      // 安卓微信webviewreadonly的input依然弹出软键盘问题修复
      if ($.device.isWeixin && $.device.android && p.params.inputReadOnly) {
        /*jshint validthis:true */
        this.focus();
        this.blur();
      }
      if (p.opened) return;
      p.open();
      if (p.params.scrollToInput) {
        var pageContent = p.input.parents('.content');
        if (pageContent.length === 0) return;

        var paddingTop = parseInt(pageContent.css('padding-top'), 10),
          paddingBottom = parseInt(pageContent.css('padding-bottom'), 10),
          pageHeight = pageContent[0].offsetHeight - paddingTop - p.container.height(),
          pageScrollHeight = pageContent[0].scrollHeight - paddingTop - p.container.height(),
          newPaddingBottom;
        var inputTop = p.input.offset().top - paddingTop + p.input[0].offsetHeight;
        if (inputTop > pageHeight) {
          var scrollTop = pageContent.scrollTop() + inputTop - pageHeight;
          if (scrollTop + pageHeight > pageScrollHeight) {
            newPaddingBottom = scrollTop + pageHeight - pageScrollHeight + paddingBottom;
            if (pageHeight === pageScrollHeight) {
              newPaddingBottom = p.container.height();
            }
            pageContent.css({'padding-bottom': (newPaddingBottom) + 'px'});
          }
          pageContent.scrollTop(scrollTop, 300);
        }
      }
    }

    function closeOnHTMLClick(e) {
      if (!p.opened) return;
      if (p.input && p.input.length > 0) {
        if (e.target !== p.input[0] && $(e.target).parents('.picker-modal').length === 0) p.close();
      }
      else {
        if ($(e.target).parents('.picker-modal').length === 0) p.close();
      }
    }

    if (p.params.input) {
      p.input = $(p.params.input);
      if (p.input.length > 0) {
        if (p.params.inputReadOnly) p.input.prop('readOnly', true);
        if (!p.inline) {
          p.input.on('click', openOnInput);
        }
      }
    }

    if (!p.inline) $('html').on('click', closeOnHTMLClick);

    // Open
    function onPickerClose() {
      p.opened = false;
      if (p.input && p.input.length > 0) p.input.parents('.content').css({'padding-bottom': ''});
      if (p.params.onClose) p.params.onClose(p);

      // Destroy events
      p.container.find('.picker-items-col').each(function () {
        p.destroyPickerCol(this);
      });
    }

    p.opened = false;
    p.open = function () {
      if (!p.opened) {

        // Layout
        p.layout();

        // Append
        if (p.inline) {
          p.container = $(p.pickerHTML);
          p.container.addClass('picker-modal-inline');
          $(p.params.container).append(p.container);
          p.opened = true;
        }
        else {
          p.container = $($.pickerModal(p.pickerHTML));
          $(p.container)
            .one('opened', function () {
              p.opened = true;
            })
            .on('close', function () {
              onPickerClose();
            });
        }

        // Store picker instance
        p.container[0].f7Picker = p;

        // Init Events
        p.container.find('.picker-items-col').each(function () {
          var updateItems = true;
          if ((!p.initialized && p.params.value) || (p.initialized && p.value)) updateItems = false;
          p.initPickerCol(this, updateItems);
        });

        p.container.find('.clear-picker').bind('click', function () {
          for (var i = 0; i < p.cols.length; i++) {
            if (!p.cols[i].divider) p.cols[i].setValue('', 0, true, true);
          }
          p.updateValue(true);
        });

        // Set value
        if (!p.initialized) {
          if (p.params.value) {
            p.setValue(p.params.value, 0);
          }
        }
        else {
          if (p.value) p.setValue(p.value, 0);
        }
      }

      if (p.params.onOpen) p.params.onOpen(p);
      // Set flag
      p.initialized = true;
    };

    // Close
    p.close = function () {
      if (!p.opened || p.inline) return;
      $.closeModal(p.container);
      return;
    };

    // Destroy
    p.destroy = function () {
      p.close();
      if (p.params.input && p.input.length > 0) {
        p.input.off('click', openOnInput);
      }
      $('html').off('click', closeOnHTMLClick);
      $(window).off('resize', resizeCols);
    };

    if (p.inline) {
      p.open();
    }

    return p;
  };

  $(document).on("click", ".close-picker", function () {
    var pickerToClose = $('.picker-modal.modal-in');
    $.closeModal(pickerToClose);
  });

  $.fn.picker = function (params) {
    var args = arguments;
    return this.each(function () {
      if (!this) return;
      var $this = $(this);

      var picker = $this.data("picker");
      if (!picker) {
        var p = $.extend({
          input: this,
          value: $this.val() ? $this.val().split(params.splitChar || ' ') : ''
        }, params);
        picker = new Picker(p);
        $this.data("picker", picker);
      }
      if (typeof params === typeof "a") {
        picker[params].apply(picker, Array.prototype.slice.call(args, 1));
      }
    });
  };
}(Zepto);
