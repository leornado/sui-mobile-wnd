+function ($) {
  'use strict';
  $.initPullToLoad = function (pageContainer, layerEl) {
    var eventsTarget = $(pageContainer);
    if (!eventsTarget.hasClass('pull-to-load-content')) {
      eventsTarget = eventsTarget.find('.pull-to-load-content');
    }
    if (!eventsTarget || eventsTarget.length === 0) return;
    if (!layerEl) {
      layerEl = eventsTarget.find('.pull-to-load-layer');
    }

    var isTouched, isMoved, touchesStart = {},
      isScrolling, touchesDiff, touchStartTime, container, pullLoad = false,
      useTranslate = false,
      startTranslate = 0,
      translate, scrollTop, wasScrolled, triggerDistance, dynamicTriggerDistance;

    container = eventsTarget;

    // Define trigger distance
    if (container.attr('data-ptl-distance')) {
      dynamicTriggerDistance = true;
    } else {
      triggerDistance = 44;
    }

    function handleTouchStart(e) {
      if (isTouched) {
        if ($.device.android) {
          if ('targetTouches' in e && e.targetTouches.length > 1) return;
        } else return;
      }
      isMoved = false;
      isTouched = true;
      isScrolling = undefined;
      wasScrolled = undefined;
      touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
      touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
      touchStartTime = (new Date()).getTime();
      /*jshint validthis:true */
      container = $(this);
    }

    function handleTouchMove(e) {
      if (!isTouched) return;
      layerEl.css('bottom', -container[0].scrollTop);
      var pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
      var pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
      if (typeof isScrolling === 'undefined') {
        isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
      }
      if (!isScrolling) {
        isTouched = false;
        return;
      }

      // is scroll on the bottom
      scrollTop = container[0].scrollTop;
      var isScrollBottom = scrollTop >= (container[0].scrollHeight - container[0].clientHeight);

      if (typeof wasScrolled === 'undefined' && scrollTop !== 0) wasScrolled = true;

      if (!isMoved) {
        /*jshint validthis:true */
        container.removeClass('load-transitioning');
        if (scrollTop > container[0].offsetHeight) {
          isTouched = false;
          return;
        }
        if (dynamicTriggerDistance) {
          triggerDistance = container.attr('data-ptl-distance');
          if (triggerDistance.indexOf('%') >= 0) triggerDistance = container[0].offsetHeight * parseInt(triggerDistance, 10) / 100;
        }
        startTranslate = container.hasClass('loading') ? triggerDistance : 0;
        useTranslate = true;
      }
      isMoved = true;
      touchesDiff = touchesStart.y - pageY;

      if (touchesDiff > 0 && isScrollBottom) {
        if (useTranslate) {
          e.preventDefault();
          translate = -(Math.pow(touchesDiff, 0.85) + startTranslate);
          container.transform('translate3d(0,' + translate + 'px,0)');
        }
        if ((useTranslate && Math.pow(touchesDiff, 0.85) > triggerDistance) || (!useTranslate && touchesDiff >= triggerDistance * 2)) {
          pullLoad = true;
          container.removeClass('pull-load-up').addClass('pull-load-down');
        } else {
          pullLoad = false;
          container.addClass('pull-load-up').removeClass('pull-load-down');
        }
      } else {

        container.removeClass('pull-load-up pull-load-down');
        pullLoad = false;
        return;
      }
    }

    function handleTouchEnd() {
      if (!isTouched || !isMoved) {
        isTouched = false;
        isMoved = false;
        return;
      }
      if (translate) {
        container.addClass('load-transitioning');
        translate = 0;
      }
      container.transform('');
      if (pullLoad) {
        //防止二次触发
        if (container.hasClass('loading')) return;
        container.addClass('loading');
        container.trigger('pullLoad');
      } else {
        container.removeClass('pull-load-down');
      }
      isTouched = false;
      isMoved = false;
    }

    function handleScroll() {
      layerEl.css('bottom', -container[0].scrollTop);
    }

    // Attach Events
    eventsTarget.on($.touchEvents.start, handleTouchStart);
    eventsTarget.on($.touchEvents.move, handleTouchMove);
    eventsTarget.on($.touchEvents.end, handleTouchEnd);
    eventsTarget.on('scroll', handleScroll);

    function destroyPullToLoad() {
      eventsTarget.off($.touchEvents.start, handleTouchStart);
      eventsTarget.off($.touchEvents.move, handleTouchMove);
      eventsTarget.off($.touchEvents.end, handleTouchEnd);
      eventsTarget.off('scroll', handleScroll);
    }

    eventsTarget[0].destroyPullToLoad = destroyPullToLoad;

  };
  $.pullToLoadAnimateScroll = function (el, scrollTo, time) {
    var scrollFrom = $(el)[0].scrollTop, scrollCount = 0, runEvery = 5; // run every 5ms
    var times = time / runEvery;
    var interval = setInterval(function () {
      scrollCount++;
      el[0].scrollTop = (scrollTo - scrollFrom) / times * scrollCount + scrollFrom;
      if (scrollCount >= times)
        clearInterval(interval);
    }, runEvery);
  };
  $.isElVisible = function (el) {
    return el.css('display') !== 'none' && el.css('visibility') !== 'hidden';
  };
  $.pullToLoadDone = function (container, scrollToEl, scrollAnimate, cutScroll) {
    $(window).scrollTop(0);//解决微信下拉刷新顶部消失的问题
    container = $(container);
    if (container.length === 0) container = $('.pull-to-load-content.loading');
    container.removeClass('loading').addClass('load-transitioning');
    container.transitionEnd(function () {
      container.removeClass('load-transitioning pull-load-up pull-load-down');

      if (scrollToEl && scrollToEl.size() > 0 && $.isElVisible(scrollToEl)) {
        var offsetTop = scrollToEl.offset().top - scrollToEl.parent().offset().top - (cutScroll || 0);
        if(scrollAnimate)
          $.pullToLoadAnimateScroll(container, container[0].scrollTop + offsetTop, 500);
        else
          container[0].scrollTop = container[0].scrollTop + offsetTop;
      }
    });
  };
  $.pullToLoadTrigger = function (container) {
    container = $(container);
    if (container.length === 0) container = $('.pull-to-load-content');
    if (container.hasClass('loading')) return;
    container.addClass('load-transitioning loading');
    container.trigger('pullLoad');
  };

  $.destroyPullToLoad = function (pageContainer) {
    pageContainer = $(pageContainer);
    var pullToLoadContent = pageContainer.hasClass('pull-to-load-content') ? pageContainer : pageContainer.find('.pull-to-load-content');
    if (pullToLoadContent.length === 0) return;
    if (pullToLoadContent[0].destroyPullToLoad) pullToLoadContent[0].destroyPullToLoad();
  };

}(Zepto);
