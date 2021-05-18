$(function () {
  'use strict';

  //下拉刷新页面
  $(document).on("pageInit", "#page-ptr", function (e, id, page) {
    var $content = $(page).find(".content").on('refresh', function (e) {
      // 模拟2s的加载过程
      setTimeout(function () {
        var cardHTML = '<div class="card">' +
          '<div class="card-header">标题</div>' +
          '<div class="card-content">' +
          '<div class="card-content-inner">内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容内容' +
          '</div>' +
          '</div>' +
          '</div>';

        $content.find('.card-container').prepend(cardHTML);
        // $(window).scrollTop(0);
        // 加载完毕需要重置
        $.pullToRefreshDone($content);
      }, 2000);
    });
  });

  //无限滚动
  $(document).on("pageInit", "#page-infinite-scroll-bottom", function (e, id, page) {
    var loading = false;
    // 每次加载添加多少条目
    var itemsPerLoad = 20;
    // 最多可加载的条目
    var maxItems = 100;
    var lastIndex = $('.list-container li').length;

    function addItems(number, lastIndex) {
      // 生成新条目的HTML
      var html = '';
      for (var i = lastIndex + 1; i <= lastIndex + number; i++) {
        html += '<li class="item-content"><div class="item-inner"><div class="item-title">新条目</div></div></li>';
      }
      // 添加新条目
      $('.infinite-scroll .list-container').append(html);
    }

    $(page).on('infinite', function () {
      // 如果正在加载，则退出
      if (loading) return;
      // 设置flag
      loading = true;
      // 模拟1s的加载过程
      setTimeout(function () {
        // 重置加载flag
        loading = false;
        if (lastIndex >= maxItems) {
          // 加载完毕，则注销无限加载事件，以防不必要的加载
          $.detachInfiniteScroll($('.infinite-scroll'));
          // 删除加载提示符
          $('.infinite-scroll-preloader').remove();
          return;
        }
        addItems(itemsPerLoad, lastIndex);
        // 更新最后加载的序号
        lastIndex = $('.list-container li').length;
        $.refreshScroller();
      }, 1000);
    });
  });

  //顶部无限滚动
  $(document).on("pageInit", "#page-infinite-scroll-top", function (e, id, page) {
    function addItems(number, lastIndex) {
      // 生成新条目的HTML
      var html = '';
      for (var i = lastIndex + number; i > lastIndex; i--) {
        html += '<li class="item-content"><div class="item-inner"><div class="item-title">条目' + i + '</div></div></li>';
      }
      // 添加新条目
      $('.infinite-scroll .list-container').prepend(html);

    }

    var timer = false;
    $(page).on('infinite', function () {
      var lastIndex = $('.list-block li').length;
      var lastLi = $(".list-container li")[0];
      var scroller = $('.infinite-scroll-top');
      var scrollHeight = scroller[0].scrollHeight; // 获取当前滚动元素的高度
      // 如果正在加载，则退出
      if (timer) {
        clearTimeout(timer);
      }

      // 模拟1s的加载过程
      timer = setTimeout(function () {

        addItems(20, lastIndex);

        $.refreshScroller();
        //  lastLi.scrollIntoView({
        //     behavior: "smooth",
        //     block:    "start"
        // });
        // 将滚动条的位置设置为最新滚动元素高度和之前的高度差
        scroller.scrollTop(scroller[0].scrollHeight - scrollHeight);
      }, 1000);
    });

  });
  //test demo js

  //多个标签页下的无限滚动
  $(document).on("pageInit", "#page-fixed-tab-infinite-scroll", function (e, id, page) {
    var loading = false;
    // 每次加载添加多少条目
    var itemsPerLoad = 20;
    // 最多可加载的条目
    var maxItems = 100;
    var lastIndex = $('.list-container li')[0].length;

    function addItems(number, lastIndex) {
      // 生成新条目的HTML
      var html = '';
      for (var i = lastIndex + 1; i <= lastIndex + number; i++) {
        html += '<li class="item-content""><div class="item-inner"><div class="item-title">新条目</div></div></li>';
      }
      // 添加新条目
      $('.infinite-scroll.active .list-container').append(html);
    }

    $(page).on('infinite', function () {
      // 如果正在加载，则退出
      if (loading) return;
      // 设置flag
      loading = true;
      var tabIndex = 0;
      if ($(this).find('.infinite-scroll.active').attr('id') == "tab2") {
        tabIndex = 0;
      }
      if ($(this).find('.infinite-scroll.active').attr('id') == "tab3") {
        tabIndex = 1;
      }
      lastIndex = $('.list-container').eq(tabIndex).find('li').length;
      // 模拟1s的加载过程
      setTimeout(function () {
        // 重置加载flag
        loading = false;
        if (lastIndex >= maxItems) {
          // 加载完毕，则注销无限加载事件，以防不必要的加载
          //$.detachInfiniteScroll($('.infinite-scroll').eq(tabIndex));
          // 删除加载提示符
          $('.infinite-scroll-preloader').eq(tabIndex).hide();
          return;
        }
        addItems(itemsPerLoad, lastIndex);
        // 更新最后加载的序号
        lastIndex = $('.list-container').eq(tabIndex).find('li').length;
        $.refreshScroller();
      }, 1000);
    });
  });

  //图片浏览器
  $(document).on("pageInit", "#page-photo-browser", function (e, id, page) {
    var myPhotoBrowserStandalone = $.photoBrowser({
      photos: [
        '//img.alicdn.com/tps/i3/TB1kt4wHVXXXXb_XVXX0HY8HXXX-1024-1024.jpeg',
        '//img.alicdn.com/tps/i1/TB1SKhUHVXXXXb7XXXX0HY8HXXX-1024-1024.jpeg',
        '//img.alicdn.com/tps/i4/TB1AdxNHVXXXXasXpXX0HY8HXXX-1024-1024.jpeg',
      ]
    });
    //点击时打开图片浏览器
    $(page).on('click', '.pb-standalone', function () {
      myPhotoBrowserStandalone.open();
    });
    /*=== Popup ===*/
    var myPhotoBrowserPopup = $.photoBrowser({
      photos: [
        '//img.alicdn.com/tps/i3/TB1kt4wHVXXXXb_XVXX0HY8HXXX-1024-1024.jpeg',
        '//img.alicdn.com/tps/i1/TB1SKhUHVXXXXb7XXXX0HY8HXXX-1024-1024.jpeg',
        '//img.alicdn.com/tps/i4/TB1AdxNHVXXXXasXpXX0HY8HXXX-1024-1024.jpeg',
      ],
      type: 'popup'
    });
    $(page).on('click', '.pb-popup', function () {
      myPhotoBrowserPopup.open();
    });
    /*=== 有标题 ===*/
    var myPhotoBrowserCaptions = $.photoBrowser({
      photos: [
        {
          url: '//img.alicdn.com/tps/i3/TB1kt4wHVXXXXb_XVXX0HY8HXXX-1024-1024.jpeg',
          caption: 'Caption 1 Text'
        },
        {
          url: '//img.alicdn.com/tps/i1/TB1SKhUHVXXXXb7XXXX0HY8HXXX-1024-1024.jpeg',
          caption: 'Second Caption Text'
        },
        // 这个没有标题
        {
          url: '//img.alicdn.com/tps/i4/TB1AdxNHVXXXXasXpXX0HY8HXXX-1024-1024.jpeg',
        },
      ],
      theme: 'dark',
      type: 'standalone'
    });
    $(page).on('click', '.pb-standalone-captions', function () {
      myPhotoBrowserCaptions.open();
    });
  });

  //图片浏览器2
  $(document).on("pageInit", "#page-photo-browser-v2", function (e, id, page) {
    var commonCfgs = {
      swipeToClose: false,
      tapMoveZoom: true,
      maxZoom: 100,
      toggleMaxZoom: 8,
      debug: true,
      sliderDebug: true,
    };
    var myPhotoBrowserStandalone = $.photoBrowserV2($.extend({
      photos: [
        '/img/TB1kt4wHVXXXXb_XVXX0HY8HXXX-1024-1024.jpeg',
        '/img/TB1SKhUHVXXXXb7XXXX0HY8HXXX-1024-1024.jpeg',
        '/img/TB1AdxNHVXXXXasXpXX0HY8HXXX-1024-1024.jpeg',
      ]
    }, commonCfgs));
    //点击时打开图片浏览器
    $(page).on('click', '.pb-standalone', function () {
      myPhotoBrowserStandalone.open();
    });
    /*=== Popup ===*/
    var myPhotoBrowserPopup = $.photoBrowserV2($.extend({
      photos: [
        {
          url: '/img/img-tall.png',
          caption: 'Caption tall Text'
        },
        '/img/img-long.png',
        '/img/TB1kt4wHVXXXXb_XVXX0HY8HXXX-1024-1024.jpeg',
        '/img/TB1SKhUHVXXXXb7XXXX0HY8HXXX-1024-1024.jpeg',
        '/img/TB1AdxNHVXXXXasXpXX0HY8HXXX-1024-1024.jpeg',
      ],
      type: 'popup'
    }, commonCfgs));
    $(page).on('click', '.pb-popup', function () {
      myPhotoBrowserPopup.open();
    });
    /*=== 有标题 ===*/
    var myPhotoBrowserCaptions = $.photoBrowserV2($.extend({
      photos: [
        {
          url: '/img/img-tall.png',
          caption: 'Caption tall Text'
        },
        {
          url: '/img/img-long.png',
          caption: 'Caption long Text Caption long Text Caption long Text Caption long Text Caption long Text'
        },
        {
          url: '/img/TB1kt4wHVXXXXb_XVXX0HY8HXXX-1024-1024.jpeg',
          caption: 'Caption 1 Text'
        },
        {
          url: '/img/TB1SKhUHVXXXXb7XXXX0HY8HXXX-1024-1024.jpeg',
          caption: 'Second Caption Text'
        },
        // 这个没有标题
        {
          url: '/img/TB1AdxNHVXXXXasXpXX0HY8HXXX-1024-1024.jpeg',
        },
      ],
      theme: 'dark',
      type: 'standalone'
    }, commonCfgs));
    $(page).on('click', '.pb-standalone-captions', function () {
      myPhotoBrowserCaptions.open();
    });
  });

  //对话框
  $(document).on("pageInit", "#page-modal", function (e, id, page) {
    var $content = $(page).find('.content');
    $content.on('click', '.alert-text', function () {
      $.alert('这是一段提示消息');
    });

    $content.on('click', '.alert-text-title', function () {
      $.alert('这是一段提示消息', '这是自定义的标题!');
    });

    $content.on('click', '.alert-text-title-callback', function () {
      $.alert('这是自定义的文案', '这是自定义的标题!', function () {
        $.alert('你点击了确定按钮!')
      });
    });
    $content.on('click', '.confirm-ok', function () {
      $.confirm('你确定吗?', function () {
        $.alert('你点击了确定按钮!');
      });
    });
    $content.on('click', '.prompt-ok', function () {
      $.prompt('你叫什么问题?', function (value) {
        $.alert('你输入的名字是"' + value + '"');
      });
    });
  });

  //操作表
  $(document).on("pageInit", "#page-action", function (e, id, page) {
    $(page).on('click', '.create-actions', function () {
      var buttons1 = [
        {
          text: '请选择',
          label: true
        },
        {
          text: '卖出',
          bold: true,
          color: 'danger',
          onClick: function () {
            $.alert("你选择了“卖出“");
          }
        },
        {
          text: '买入',
          onClick: function () {
            $.alert("你选择了“买入“");
          }
        }
      ];
      var buttons2 = [
        {
          text: '取消',
          bg: 'danger'
        }
      ];
      var groups = [buttons1, buttons2];
      $.actions(groups);
    });
  });

  //加载提示符
  $(document).on("pageInit", "#page-preloader", function (e, id, page) {
    $(page).on('click', '.open-preloader-title', function () {
      $.showPreloader('加载中...');
      setTimeout(function () {
        $.hidePreloader();
      }, 2000);
    });
    $(page).on('click', '.open-indicator', function () {
      $.showIndicator();
      setTimeout(function () {
        $.hideIndicator();
      }, 2000);
    });
  });


  //选择颜色主题
  $(document).on("click", ".select-color", function (e) {
    var b = $(e.target);
    document.body.className = "theme-" + (b.data("color") || "");
    b.parent().find(".active").removeClass("active");
    b.addClass("active");
  });

  $(document).on("pageInit", "#page-query-select", function (e, id, page) {
    var data = [];
    for (var i = 0; i < 50; i++) data.push({c: 'code-' + i, n: '选项-' + i});
    $("#query-select-s").querySelect({
      headTitle: '单选',
      value: [{code: 'code-12', name: 'code-12'}],
      loadData: function (searchVal, callback) {
        setTimeout(function () {
          if (searchVal) {
            var filted = [];
            $.each(data, function (i, n) {
              if (n.name.indexOf(searchVal) >= 0) filted.push(n);
            });
            callback(filted);
          } else callback(data);
        }, 500);
      }
    });
    $("#query-select-m").querySelect({
      headTitle: '多选',
      multiple: true,
      value: [{code: 'code-2', name: 'code-2'}, {c: 'code-12', n: '选项-12'}],
      loadData: function (searchVal, callback) {
        setTimeout(function () {
          if (searchVal) {
            var filted = [];
            $.each(data, function (i, n) {
              if (n.name.indexOf(searchVal) >= 0) filted.push(n);
            });
            callback(filted);
          } else callback(data);
        }, 1000);
      }
    });
  });

  // calendar
  $(document).on("pageInit", "#page-calendar", function (e) {
    $("#birthday").calendar({
      minDate: new Date('2018-07-01'),
      maxDate: new Date('2018-08-28'),
      isDateDisabled: function (date) {
        return date && new Date(date).getDay() == 3;
      }
    });
  });


  //picker
  $(document).on("pageInit", "#page-picker", function (e, id, page) {
    $("#picker").picker({
      toolbarTemplate: '<header class="bar bar-nav">\
        <button class="button button-link pull-left">\
      按钮\
      </button>\
      <button class="button button-link pull-right close-picker">\
      确定\
      </button>\
      <h1 class="title">标题</h1>\
      </header>',
      cols: [
        {
          textAlign: 'center',
          values: ['iPhone 4', 'iPhone 4S', 'iPhone 5', 'iPhone 5S', 'iPhone 6', 'iPhone 6 Plus', 'iPad 2', 'iPad Retina', 'iPad Air', 'iPad mini', 'iPad mini 2', 'iPad mini 3'],
          cssClass: 'picker-items-col-normal'
        }
      ]
    });
    $("#picker-name").picker({
      toolbarTemplate: '<header class="bar bar-nav">\
      <button class="button button-link pull-right close-picker">确定</button>\
      <h1 class="title">请选择称呼</h1>\
      </header>',
      cols: [
        {
          textAlign: 'center',
          values: ['赵', '钱', '孙', '李', '周', '吴', '郑', '王']
        },
        {
          textAlign: 'center',
          values: ['杰伦', '磊', '明', '小鹏', '燕姿', '菲菲', 'Baby']
        },
        {
          textAlign: 'center',
          values: ['先生', '小姐']
        }
      ]
    });
    $("#picker-tree").picker({
      toolbarTemplate: '<header class="bar bar-nav">\
      <button class="button button-link pull-left clear-picker">清除</button>\
      <button class="button button-link pull-right close-picker">确定</button>\
      <h1 class="title">请选择称呼</h1>\
      </header>',
      rotateEffect: true,
      splitChar: ',',
      treeCols: [{
        c: 'zhao', n: '赵',
        d: [
          {c: 'jia', n: '甲'},
          {c: 'yi', n: '已'},
          {c: 'bing', n: '丙'}]
      }, {
        c: 'qian', n: '钱',
        d: [
          {c: 'ding', n: '丁', d: [{c: 'a', n: 'A'}, {c: 'b', n: 'B'}, {c: 'c', n: 'C'}]},
          {c: 'wu', n: '戊', d: [{c: 'd', n: 'D'}, {c: 'e', n: 'E'}, {c: 'f', n: 'F'}]},
          {c: 'ji', n: '己', d: [{c: 'g', n: 'G'}, {c: 'h', n: 'H'}, {c: 'i', n: 'I'}]}]
      }, {
        c: 'sun', n: '孙',
        d: [
          {c: 'geng', n: '庚', d: [{c: 'j', n: 'J'}, {c: 'k', n: 'K'}, {c: 'l', n: 'L'}]},
          {c: 'xin', n: '辛', d: [{c: 'm', n: 'M'}, {c: 'n', n: 'N'}, {c: 'o', n: 'O'}]},
          {c: 'ren', n: '壬', d: [{c: 'p', n: 'P'}, {c: 'q', n: 'Q'}, {c: 'r', n: 'R'}]}]
      }, {
        c: 'li', n: '李',
        d: [
          {c: 'gui', n: '癸', d: [{c: 's', n: 'S'}, {c: 't', n: 'T'}]},
          {c: 'zi', n: '子', d: [{c: 'u', n: 'U'}]},
          {c: 'chou', n: '丑', d: [{c: 'v', n: 'V'}, {c: 'w', n: 'W'}, {c: 'x', n: 'X'}]}]
      }]
    });
  });
  $(document).on("pageInit", "#page-datetime-picker", function (e) {
    $("#datetime-picker1,#datetime-picker3").datetimePicker({
      toolbarTemplate: '<header class="bar bar-nav">\
        <button class="button button-link pull-left clear-picker">清除</button>\
        <button class="button button-link pull-right close-picker">确定</button>\
        <h1 class="title">选择日期和时间</h1>\
      </header>'
    });

    $("#datetime-picker2").datetimePicker({
      toolbarTemplate: '<header class="bar bar-nav">\
        <button class="button button-link pull-left clear-picker">清除</button>\
        <button class="button button-link pull-right close-picker">确定</button>\
        <h1 class="title">选择日期和时间</h1>\
      </header>',
      minDate: new Date('2016-01-03'),
      maxDate: new Date('2016-07-28'),
      isDateDisabled: function (date) {
        return date && (date.getFullYear() == 2017
          || date.getFullYear() == 2016 && (date.getMonth() + 1) != 1 && (date.getMonth() + 1) != 12);
      }
    });

    $("#date-picker1,#date-picker2").datePicker({
      toolbarTemplate: '<header class="bar bar-nav">\
        <button class="button button-link pull-left clear-picker">清除</button>\
        <button class="button button-link pull-right close-picker">确定</button>\
        <h1 class="title">选择日期</h1>\
      </header>',
      minDate: new Date('2016-01-03'),
      maxDate: new Date('2016-07-28'),
      isDateDisabled: function (date) {
        return date && (date.getFullYear() == 2017
          || date.getFullYear() == 2016 && (date.getMonth() + 1) != 1 && (date.getMonth() + 1) != 12);
      }
    });

    $("#date-picker3,#date-picker4").datePicker({
      toolbarTemplate: '<header class="bar bar-nav">\
        <button class="button button-link pull-left clear-picker">清除</button>\
        <button class="button button-link pull-right close-picker">确定</button>\
        <h1 class="title">选择日期</h1>\
      </header>'
    });
  });

  $(document).on("pageInit", "#page-city-picker", function (e) {
    $("#city-picker1").cityPicker({
      forceSelect: true, value: ['天津', '河东区']
      //value: ['四川', '内江', '东兴区']
    });

    $("#city-picker2").cityPicker();

    $("#tree-city-picker1").treeCityPicker({
      forceSelect: true, value: ['天津市', '河东区']
    });

    $("#tree-city-picker2").treeCityPicker({
      forceSelect: true, value: []
    });
  });

  $.init();
});
