/*======================================================
 ************   QuerySelect   ************
 ======================================================*/
/* jshint unused:false */
/* jshint multistr:true */
+function ($) {
  "use strict";
  var querySelect = function (params) {
    var qs = this;
    var defaults = {
      splitChar: ' ',
      keepInExist: true,
      headTitle: '请选择',
      okBtnTxt: '确定',
      clearBtnTxt: '清除',
      // Common settings
      toolbarTemplate: '<header class="bar bar-nav">\
                          <button class="button button-link pull-right close-query-select">确定</button>\
                          <button class="button button-link pull-left clear-query-select">清除</button>\
                          <h1 class="title"></h1>\
                        </header>',
      searchTemplate: '<div class="bar bar-header-secondary">\
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

    function setInputVal() {
      var names = qs.getDispValue();
      qs.input.val(names.join(qs.params.splitChar || ' '));
      if (qs.params.onChange) qs.params.onChange.apply(qs);
    }

    function updateTitle() {
      if (qs.params.multiple) {
        qs.selectedTitle.text('已选 ' + qs.selectedMap.size() + ' 项');
      } else {
        var keys = qs.selectedMap.keys(), title = '请选择';
        if (keys.length == 1) title = qs.selectedMap.getAt(0).name || qs.selectedMap.getAt(0).n;
        qs.selectedTitle.text(title)
      }
    }

    qs.clear = function () {
      if (qs.selectedMap.size() <= 0) return;

      qs.selectedMap.clear();
      setInputVal();
      if (qs.opened) {
        qs.container.find('input.query-select-checkbox').prop('checked', false);
        updateTitle();
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

    qs.getValue = function () {
      return qs.selectedMap && qs.selectedMap.keys() || [];
    };

    // HTML Layout
    qs.layout = function () {
      qs.popupHtml =
        '<div class="popup popup-about">' + qs.params.toolbarTemplate + qs.params.searchTemplate +
        '  <div class="content">\
             <div class="content-block-title selected-count"></div>\
             <div class="card">\
               <div class="card-content">\
                 <div class="list-block media-list">\
                   <ul></ul>\
                 </div>\
               </div>\
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

    qs.loadData = function () {
      var searchVal = qs.searchInput.val();
      qs.params.loadData.call(qs, searchVal, function (data) {
        qs.data = data || [];

        var ul = qs.container.find('.list-block.media-list ul').empty(), checkedVals = {};
        qs.itemMap = {}, qs.loaded = true;
        $.each(qs.data, function (i, itemData) {
          var item = $(qs.params.itemTemplate), itemCode = itemData.code || itemData.c || '';
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
            checkedVals[itemCode] = true;
          }
          item.find('.item-subtitle').text(itemData.name || itemData.n || '');
          ul.append(item);
        });

        var notInListSelectedItems = [];
        $.each(qs.selectedMap.keys(), function (i, k) {
          if (checkedVals[k]) return;

          if (qs.params.keepInExist) {
            var item = $(qs.params.itemTemplate), itemData = qs.selectedMap.get(k), val = itemData.code || itemData.c || '';
            qs.itemMap[val] = item;
            var input = item.find('input').attr('type', qs.params.multiple ? 'checkbox' : 'radio').val(val);
            item.find('.item-subtitle').text(itemData.name || itemData.n || '');
            input.data('query-select-data', itemData).prop('checked', true);
            notInListSelectedItems.push(item);
          } else {
            qs.selectedMap.remove(k);
          }
        });
        for (var i = notInListSelectedItems.length - 1; i >= 0; i--)
          ul.prepend(notInListSelectedItems[i]);

        updateTitle();
        setInputVal();
      });
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

        var t;
        qs.searchInput = qs.container.find('input[type=search]').on('keydown', function (e) {
          if (t) clearTimeout(t);
          t = setTimeout(function () {
            qs.loadData();
          }, qs.params.queryDelay || 300);
        });
        qs.selectedTitle = qs.container.find('.selected-count');
        qs.container.find('header .title').text(qs.params.headTitle);

        // Store picker instance
        qs.container[0].querySelect = qs;

        // Init Events
        qs.container.find('.clear-query-select').text(qs.params.clearBtnTxt).on('click', qs.clear);
        qs.container.find('.close-query-select').text(qs.params.okBtnTxt).on('click', function () {
          setInputVal();
          $.closeModal(qs.container);
        });
        qs.container.find('.searchbar-cancel').on('click', function () {
          var searchVal = qs.searchInput.val();
          if (searchVal) {
            qs.searchInput.val('');
            qs.loadData();
          }
        });
        qs.container.find('.list-block.media-list ul').on('click', function (e) {
          var target = $(e.target);
          if (!target.hasClass('query-select-checkbox')) return;
          var itemCode = target.val(), itemData = target.data('query-select-data');
          if (!qs.params.multiple) qs.selectedMap.clear();
          if (target.prop('checked')) {
            if (!qs.selectedMap.containsKey(itemCode)) qs.selectedMap.put(itemCode, itemData);
          } else if (qs.selectedMap.containsKey(itemCode)) qs.selectedMap.remove(itemCode);
          updateTitle();
          setInputVal();
        });
      }

      qs.loadData();

      // Set flag
      qs.initialized = true;

      if (qs.params.onOpen) qs.params.onOpen(qs);
    };

    if (qs.params.value) qs.setValue(qs.params.value);

    // Close
    qs.close = function () {
      $.closeModal(qs.container);
    };

    // Destroy
    qs.destroy = function () {
      $.closeModal(qs.container);
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
        qSel = new querySelect(_params);
        $this.data("query-select", qSel);
      }
      if (typeof params === typeof "a")
        qSel[params].apply(qSel, Array.prototype.slice.call(args, 1));
    });
  };
}(Zepto);
