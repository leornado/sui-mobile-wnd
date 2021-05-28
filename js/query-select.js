/*======================================================
 ************   QuerySelect   ************
 ======================================================*/
/* jshint unused:false */
/* jshint multistr:true */
+function ($) {
  "use strict";
  var querySelect = function (params, qsEl) {
    var qs = this;
    var defaults = {
      splitChar      : ' ',
      keepInExist    : true,
      headTitle      : '请选择',
      okBtnTxt       : '确定',
      clearBtnTxt    : '清除',
      // Common settings
      toolbarTemplate: '<header class="bar bar-nav">\
                          <button class="button button-link pull-right close-query-select">确定</button>\
                          <button class="button button-link pull-left clear-query-select">清除</button>\
                          <h1 class="title"></h1>\
                        </header>',
      searchTemplate : '<div class="bar bar-header-secondary">\
                          <div class="searchbar">\
                            <a class="searchbar-cancel">x</a>\
                            <div class="search-input">\
                              <label class="icon icon-search" for="search"></label>\
                              <input type="search" placeholder="请输入关键字..."/>\
                            </div>\
                          </div>\
                        </div>',
      itemTemplate: '<li class="query-select-item">\
                       <label class="label-checkbox item-content">\
                         <input class="query-select-checkbox" name="item">\
                         <div class="item-media"><i class="icon icon-form-checkbox"></i></div>\
                         <div class="item-inner">\
                           <div class="item-subtitle"></div>\
                         </div>\
                       </label>\
                     </li>'
    };
    params = params || {};
    for (var def in defaults) if (typeof params[def] === 'undefined') params[def] = defaults[def];
    qs.params = params;
    qs.initialized = false;
    qs.loadDataExeMap = new $.sui.orderedMap();

    function setInputVal() {
      var names = qs.getDispValue();
      qs.input.val(names.join(qs.params.splitChar || ' '));
      if (qs.params.onChange) qs.params.onChange.apply(qs);
    }

    qs.isSelectable = function () {
      return qs.isOverMaxSelectable(true) || true;
    };

    qs.getMax = function () {
      var max = qs.params.max;
      return typeof (max) === 'function' ? max.apply(qs, [qs]) : Number(max);
    };

    qs.isOverMaxSelectable = function (plusCurrent) {
      if (!qs.isMaxDefined()) return false;
      var max = qs.getMax(), current = qs.selectedMap.size(), expect = current;
      if (plusCurrent) expect++;
      return expect > max ? {errType: 'overMax', max: max, current: current} : false;
    };

    qs.isMaxDefined = function () {
      var max = Number(qs.params.max);
      return typeof (max) === 'number' && !isNaN(max) || typeof (qs.params.max) === 'function';
    };

    qs.updateTitle = function () {
      if (qs.params.multiple) {
        var title = '已选 ' + qs.selectedMap.size() + ' 项';
        if (qs.isMaxDefined()) {
          var max = qs.getMax();
          title = '最多选 ' + max + ' 项，还能选 ' + Math.max(0, max - qs.selectedMap.size()) + ' 项';
        }
        qs.selectedTitle.text(title);
      } else {
        var keys = qs.selectedMap.keys(), title = '请选择';
        if (keys.length === 1) title = qs.selectedMap.getAt(0).name || qs.selectedMap.getAt(0).n;
        qs.selectedTitle.text(title)
      }
    };

    qs.clear = function () {
      if (qs.selectedMap.size() > 0) {
        qs.selectedMap.clear();
        setInputVal();
        if (qs.opened) {
          qs.container.find('input.query-select-checkbox').prop('checked', false);
          qs.updateTitle();
        }
      }
    };

    // Value
    qs.setValue = function (arrValue) {
      if (!arrValue) return;
      $.each(arrValue, function (i, value) {
        qs.selectedMap.put(value.code || value.c, value);
        if (qs.loaded) {
          var item = qs.itemMap[value.code || value.c];
          if (item) item.prop('checked', true);
        }
      });
      setInputVal();
    };

    qs.getDispValue = function () {
      var names = [];
      if (qs.selectedMap)
        $.each(qs.selectedMap.keys(), function (i, code) {
          names.push(qs.selectedMap.get(code).name || qs.selectedMap.get(code).n);
        });
      return names;
    };

    qs.getValue = function (useVals) {
      return useVals ? qs.selectedMap && qs.selectedMap.vals() || []
        : qs.selectedMap && qs.selectedMap.keys() || [];
    };

    // HTML Layout
    qs.layout = function () {
      qs.popupHtml =
        '<div class="popup popup-about">' + qs.params.toolbarTemplate + qs.params.searchTemplate +
        '  <div class="content">\
             <div class="content-block-title selected-count"></div>\
             <div class="card qs-card">\
               <div class="card-content">\
                 <div class="list-block media-list qs-list">\
                   <ul></ul>\
                 </div>\
               </div>\
             </div>\
             <div class="infinite-scroll-preloader">\
                <div class="preloader"></div>\
             </div>\
           </div>\
         </div>';
    };

    // Input Events
    function openOnInput(e) {
      e.preventDefault();
      // 安卓微信webviewreadonly的input依然弹出软键盘问题修复
      if ($.device.isWeixin && $.device.android) {
        /*jshint validthis:true */
        this.focus();
        this.blur();
      }
      if (qs.opened) return;
      qs.open();
    }

    if (qs.params.input) {
      qs.input = $(qs.params.input);
      if (qs.input.length > 0) {
        qs.input.prop('readOnly', true);
        qs.input.on('click', openOnInput);
      }
    }

    // Open
    function onQuerySelectClose() {
      qs.opened = false;
      if (qs.params.onClose) qs.params.onClose(qs);

      // Destroy events // TODO
    }

    qs.refreshInfinitScroll = function (data, dataInfo) {
      var preloaderEl = qs.infiniteScrollPreloader, contentEl = qs.infiniteScrollContent;
      var contentCls = 'infinite-scroll infinite-scroll-bottom';
      if (!dataInfo || !dataInfo.hasMore) {
        contentEl.removeClass(contentCls);
        preloaderEl.hide();
      } else {
        if (!contentEl.hasClass(contentCls)) {
          contentEl.addClass(contentCls);
          $.attachInfiniteScroll(contentEl);
        }
        preloaderEl.show();
      }

      qs.lastDataInfo = dataInfo;
    };

    qs.exeLoadDataInQueue = function () {
      var keys = qs.loadDataExeMap.keys();
      if (keys.length <= 0) return;

      var next = keys.shift();
      var searchValue = qs.loadDataExeMap.get(next);
      qs.loadDataExeMap.remove(next);
      qs.loadData(searchValue);
    };

    qs.loadDataSeq = 0;
    qs.loadData = function (searchVal) {
      var hasItemRenderer = !!qs.params.itemRenderer;
      searchVal = searchVal || qs.searchInput.val();

      if (qs.loading) {
        qs.loadDataSeq++;
        qs.loadDataExeMap.put(qs.loadDataSeq, searchVal);
        return;
      }

      try {
        qs.loading = true;
        qs.params.loadData.call(qs, searchVal, function (data, loadInf) {
          try {
            qs.data = data || [];
            qs.refreshInfinitScroll(data, loadInf);
            var isIncrementData = qs.lastDataInfo && qs.lastDataInfo.isIncrementData,
              keepInexist = qs.params.keepInExist;

            var ul = qs.container.find('.qs-list ul');
            if (!isIncrementData) {
              ul.empty();
              qs.itemMap = {};
              qs.checkedVals = {};
            }

            qs.loaded = true;
            $.each(qs.data, function (i, itemData) {
              var item, itemCode = itemData.code || itemData.c || '';
              if (isIncrementData && keepInexist && qs.checkedVals[itemCode]) {
                item = qs.itemMap[itemCode];
                ul.append(item);
                return;
              }

              item = hasItemRenderer ? qs.params.itemRenderer.apply(qs, [i, itemData]) : $(qs.params.itemTemplate);
              qs.itemMap[itemCode] = item;
              var input = item.find('input').attr('type', qs.params.multiple ? 'checkbox' : 'radio').val(itemCode);
              input.data('query-select-data', itemData);
              if (qs.selectedMap.containsKey(itemCode)) {
                if (itemData.name || itemData.n) {
                  var oldItemData = qs.selectedMap.get(itemCode);
                  if ('name' in oldItemData) oldItemData.name = itemData.name || itemData.n;
                  else oldItemData.n = itemData.name || itemData.n;
                }
                input.prop('checked', true);
                qs.checkedVals[itemCode] = true;
              }
              if (!hasItemRenderer) item.find('.item-subtitle').text(itemData.name || itemData.n || '');
              ul.append(item);
            });

            var notInListSelectedItems = [];
            $.each(qs.selectedMap.keys(), function (i, k) {
              if (qs.checkedVals[k]) return;

              if (keepInexist) {
                var itemData = qs.selectedMap.get(k), itemCode = itemData.code || itemData.c || '';
                var item = hasItemRenderer ? qs.params.itemRenderer.apply(qs, [i, itemData]) : $(qs.params.itemTemplate);
                qs.itemMap[itemCode] = item;
                var input = item.find('input').attr('type', qs.params.multiple ? 'checkbox' : 'radio').val(itemCode);
                if (!hasItemRenderer) item.find('.item-subtitle').text(itemData.name || itemData.n || '');
                input.data('query-select-data', itemData).prop('checked', true);
                notInListSelectedItems.push(item);
                qs.checkedVals[itemCode] = true;
              } else {
                qs.selectedMap.remove(k);
              }
            });

            for (var i = notInListSelectedItems.length - 1; i >= 0; i--) {
              ul.prepend(notInListSelectedItems[i]);
            }

            qs.updateTitle();
            setInputVal();

          } finally {
            qs.loading = false;
            qs.exeLoadDataInQueue();
          }
        });
      } catch (e) {
        throw e;
        qs.loading = false;
        qs.exeLoadDataInQueue();
      }
    };

    qs.warn4UnSelectable = function (selectable) {
      var unselectableMsg = qs.params.unselectableMsg;
      if (unselectableMsg === undefined || unselectableMsg === null) {
        $.toast(selectable.errType === 'overMax' ?
          "最多选 " + selectable.max + " 项，已选 " + selectable.current + " 项" :
          "禁止选择", 1000);
      } else if (unselectableMsg === 'function') {
        unselectableMsg.apply(qs, [qs, selectable]);
      } else $.toast(unselectableMsg, 1000);
      qsEl.trigger('unselectable', [qs, selectable]);
    };

    qs.opened = false, qs.selectedMap = new $.sui.orderedMap(), qs.itemMap = {}, qs.loaded = false;
    qs.open = function () {
      if (!qs.opened) {

        // Layout
        qs.layout();

        // Append
        qs.container = $($.popup(qs.popupHtml, true)).addClass('query-select-popup')
          .one('opened', function () {
            qs.opened = true;
          }).on('close', onQuerySelectClose);

        var searchDataLoader = $._.debounce(qs.loadData, qs.params.queryDelay || 500, false);
        qs.searchInput = qs.container.find('input[type=search]').bind('keydown', function () {
          searchDataLoader();
        });
        qs.selectedTitle = qs.container.find('.selected-count');
        qs.container.find('header .title').text(qs.params.headTitle);

        var infiniteScrollDataLoader = $._.debounce(qs.loadData, qs.params.queryDelay || 500, true);
        qs.infiniteScrollContent = qs.container.find('.content').bind('infinite', function () {
          if (!qs.lastDataInfo || !qs.lastDataInfo.hasMore) return;
          infiniteScrollDataLoader();
        });
        qs.infiniteScrollPreloader = qs.container.find('.infinite-scroll-preloader');

        // Store picker instance
        qs.container[0].querySelect = qs;

        // Init Events
        qs.container.find('.clear-query-select').text(qs.params.clearBtnTxt).on('click', function () {
          qs.clear(true);
          qsEl.trigger('clear-btn-click', [qs]);
        });
        qs.container.find('.close-query-select').text(qs.params.okBtnTxt).on('click', function () {
          setInputVal();
          qs.close();
        });
        qs.container.find('.searchbar-cancel').on('click', function () {
          var searchVal = qs.searchInput.val();
          if (searchVal) {
            qs.searchInput.val('');
            qs.loadData();
          }
        });
        qs.container.find('.qs-list ul').on('click', function (e) {
          var target = $(e.target), selectable = qs.isSelectable();
          if (!target.hasClass('query-select-checkbox')) return;

          var itemCode = target.val(), itemData = target.data('query-select-data');
          var alreadySelected = qs.selectedMap.containsKey(itemCode);
          if (!qs.params.multiple) qs.selectedMap.clear();
          if (target.prop('checked')) {
            if (selectable !== true) {
              target.prop('checked', false);
              return qs.warn4UnSelectable(selectable);
            }
            if (!qs.params.multiple) {
              if (qs.params.deselectable && alreadySelected) target.prop('checked', false);
              else qs.selectedMap.put(itemCode, itemData);
            } else if (!alreadySelected) qs.selectedMap.put(itemCode, itemData);
          } else if (alreadySelected) qs.selectedMap.remove(itemCode);
          qs.updateTitle();
          setInputVal();
        });
      }

      qs.loadData();

      // Set flag
      qs.initialized = true;

      if (qs.params.onOpen) qs.params.onOpen.apply(qs, [qs]);
    };

    if (qs.params.value) qs.setValue(qs.params.value);

    // Close
    qs.close = function () {
      $.closeModal(qs.container);
      qsEl.trigger('close', [qs]);
    };

    // Destroy
    qs.destroy = function () {
      qs.close();
      qs.input.removeData("query-select");
    };

    return qs;
  };

  $.fn.querySelect = function (params) {
    var args = arguments;
    return this.each(function () {
      if (!this) return;
      var $this = $(this);

      var qSel = $this.data("query-select");
      if (!qSel) {
        var _params = $.extend({
          input: this,
          value: $this.val() ? $this.val().split(params.splitChar || ' ') : ''
        }, params);
        qSel = new querySelect(_params, $this);
        $this.data("query-select", qSel);
      }
      if (typeof params === typeof "a")
        qSel[params].apply(qSel, Array.prototype.slice.call(args, 1));
    });
  };
}(Zepto);
