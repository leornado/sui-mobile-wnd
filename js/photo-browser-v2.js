/*======================================================
************   Photo Browser V2   ************
======================================================*/
+function($){
    'use strict';
    var PhotoBrowserV2 = function (params) {

        var pb = this, i;

        var defaults = this.defaults;

        params = params || {};
        for (var def in defaults) {
            if (typeof params[def] === 'undefined') {
                params[def] = defaults[def];
            }
        }

        pb.params = params;

        var navbarTemplate = pb.params.navbarTemplate ||
                            '<header class="bar bar-nav">' +
                              '<a class="icon icon-left pull-left photo-browser-v2-close-link' + (pb.params.type === 'popup' ?  " close-popup" : "") + '"></a>' +
                              '<h1 class="title"><div class="center sliding"><span class="photo-browser-v2-current"></span> <span class="photo-browser-v2-of">' + pb.params.ofText + '</span> <span class="photo-browser-v2-total"></span></div></h1>' +
                            '</header>';

        var toolbarTemplate = pb.params.toolbarTemplate ||
                            '<nav class="bar bar-tab">' +
                              '<a class="tab-item photo-browser-v2-prev" href="javascript:">' +
                                '<i class="icon icon-prev"></i>' +
                              '</a>' +
                              '<a class="tab-item photo-browser-v2-next" href="javascript:">' +
                                '<i class="icon icon-next"></i>' +
                              '</a>' +
                            '</nav>';

        var template = pb.params.template ||
                        '<div class="photo-browser-v2 photo-browser-v2-' + pb.params.theme + '">' +
                            '{{navbar}}' +
                            '{{toolbar}}' +
                            '<div data-page="photo-browser-v2-slides" class="content photo-browser-v2-slides">' +
                                '<div class="photo-browser-v2-swiper-container swiper-container">' +
                                    '<div class="photo-browser-v2-swiper-wrapper swiper-wrapper">' +
                                        '{{photos}}' +
                                    '</div>' +
                                '</div>' +
                                '{{captions}}' +
                            '</div>' +
                        '</div>';

        var photoTemplate = !pb.params.lazyLoading ?
            (pb.params.photoTemplate || '<div class="photo-browser-v2-slide swiper-slide"><span class="photo-browser-v2-zoom-container"><img src="{{url}}"></span></div>') :
            (pb.params.photoLazyTemplate || '<div class="photo-browser-v2-slide photo-browser-v2-slide-lazy swiper-slide"><div class="preloader' + (pb.params.theme === 'dark' ? ' preloader-white' : '') + '"></div><span class="photo-browser-v2-zoom-container"><img data-src="{{url}}" class="swiper-lazy"></span></div>');

        var captionsTheme = pb.params.captionsTheme || pb.params.theme;
        var captionsTemplate = pb.params.captionsTemplate || '<div class="photo-browser-v2-captions photo-browser-v2-captions-' + captionsTheme + '">{{captions}}</div>';
        var captionTemplate = pb.params.captionTemplate || '<div class="photo-browser-v2-caption" data-caption-index="{{captionIndex}}">{{caption}}</div>';

        var objectTemplate = pb.params.objectTemplate || '<div class="photo-browser-v2-slide photo-browser-v2-object-slide swiper-slide">{{html}}</div>';
        var photosHtml = '';
        var captionsHtml = '';
        for (i = 0; i < pb.params.photos.length; i ++) {
            var photo = pb.params.photos[i];
            var thisTemplate = '';

            //check if photo is a string or string-like object, for backwards compatibility
            if (typeof(photo) === 'string' || photo instanceof String) {

                //check if "photo" is html object
                if (photo.indexOf('<') >= 0 || photo.indexOf('>') >= 0) {
                    thisTemplate = objectTemplate.replace(/{{html}}/g, photo);
                } else {
                    thisTemplate = photoTemplate.replace(/{{url}}/g, photo);
                }

                //photo is a string, thus has no caption, so remove the caption template placeholder
                //otherwise check if photo is an object with a url property
            } else if (typeof(photo) === 'object') {

                //check if "photo" is html object
                if (photo.hasOwnProperty('html') && photo.html.length > 0) {
                    thisTemplate = objectTemplate.replace(/{{html}}/g, photo.html);
                } else if (photo.hasOwnProperty('url') && photo.url.length > 0) {
                    thisTemplate = photoTemplate.replace(/{{url}}/g, photo.url);
                }

                //check if photo has a caption
                if (photo.hasOwnProperty('caption') && photo.caption.length > 0) {
                    captionsHtml += captionTemplate.replace(/{{caption}}/g, photo.caption).replace(/{{captionIndex}}/g, i);
                } else {
                    thisTemplate = thisTemplate.replace(/{{caption}}/g, '');
                }
            }

            photosHtml += thisTemplate;

        }

        var htmlTemplate = template
                            .replace('{{navbar}}', (pb.params.navbar ? navbarTemplate : ''))
                            .replace('{{noNavbar}}', (pb.params.navbar ? '' : 'no-navbar'))
                            .replace('{{photos}}', photosHtml)
                            .replace('{{captions}}', captionsTemplate.replace(/{{captions}}/g, captionsHtml))
                            .replace('{{toolbar}}', (pb.params.toolbar ? toolbarTemplate : ''));

        pb.activeIndex = pb.params.initialSlide;
        pb.openIndex = pb.activeIndex;
        pb.opened = false;

        pb.open = function (index) {
            if (typeof index === 'undefined') index = pb.activeIndex;
            index = parseInt(index, 10);
            if (pb.opened && pb.swiper) {
                pb.swiper.slideTo(index);
                return;
            }
            pb.opened = true;
            pb.openIndex = index;
            // pb.initialLazyLoaded = false;
            if (pb.params.type === 'standalone') {
                $(pb.params.container).append(htmlTemplate);
            }
            if (pb.params.type === 'popup') {
                pb.popup = $.popup('<div class="popup photo-browser-v2-popup">' + htmlTemplate + '</div>');
                $(pb.popup).on('closed', pb.onPopupClose);
            }
            if (pb.params.type === 'page') {
                $(document).on('pageBeforeInit', pb.onPageBeforeInit);
                $(document).on('pageBeforeRemove', pb.onPageBeforeRemove);
                if (!pb.params.view) pb.params.view = $.mainView;
                pb.params.view.loadContent(htmlTemplate);
                return;
            }
            pb.layout(pb.openIndex);
            if (pb.params.onOpen) {
                pb.params.onOpen(pb);
            }

        };
        pb.close = function () {
            pb.opened = false;
            if (!pb.swiperContainer || pb.swiperContainer.length === 0) {
                return;
            }
            if (pb.params.onClose) {
                pb.params.onClose(pb);
            }
            // Detach events
            pb.attachEvents(true);
            // Delete from DOM
            if (pb.params.type === 'standalone') {
                pb.container.removeClass('photo-browser-v2-in').addClass('photo-browser-v2-out').animationEnd(function () {
                    pb.container.remove();
                });
            }
            // Destroy slider
            pb.swiper.destroy();
            // Delete references
            pb.swiper = pb.swiperContainer = pb.swiperWrapper = pb.slides = gestureSlide = gestureImg = gestureImgWrap = undefined;
        };

        pb.onPopupClose = function () {
            pb.close();
            $(pb.popup).off('pageBeforeInit', pb.onPopupClose);
        };
        pb.onPageBeforeInit = function (e) {
            if (e.detail.page.name === 'photo-browser-v2-slides') {
                pb.layout(pb.openIndex);
            }
            $(document).off('pageBeforeInit', pb.onPageBeforeInit);
        };
        pb.onPageBeforeRemove = function (e) {
            if (e.detail.page.name === 'photo-browser-v2-slides') {
                pb.close();
            }
            $(document).off('pageBeforeRemove', pb.onPageBeforeRemove);
        };

        pb.onSliderTransitionStart = function (swiper) {
            pb.activeIndex = swiper.activeIndex;

            var current = swiper.activeIndex + 1;
            var total = swiper.slides.length;
            if (pb.params.loop) {
                total = total - 2;
                current = current - swiper.loopedSlides;
                if (current < 1) current = total + current;
                if (current > total) current = current - total;
            }
            pb.container.find('.photo-browser-v2-current').text(current);
            pb.container.find('.photo-browser-v2-total').text(total);

            $('.photo-browser-v2-prev, .photo-browser-v2-next').removeClass('photo-browser-v2-link-inactive');

            if (swiper.isBeginning && !pb.params.loop) {
                $('.photo-browser-v2-prev').addClass('photo-browser-v2-link-inactive');
            }
            if (swiper.isEnd && !pb.params.loop) {
                $('.photo-browser-v2-next').addClass('photo-browser-v2-link-inactive');
            }

            // Update captions
            if (pb.captions.length > 0) {
                pb.captionsContainer.find('.photo-browser-v2-caption-active').removeClass('photo-browser-v2-caption-active');
                var captionIndex = pb.params.loop ? swiper.slides.eq(swiper.activeIndex).attr('data-swiper-slide-index') : pb.activeIndex;
                pb.captionsContainer.find('[data-caption-index="' + captionIndex + '"]').addClass('photo-browser-v2-caption-active');
            }


            // Stop Video
            var previousSlideVideo = swiper.slides.eq(swiper.previousIndex).find('video');
            if (previousSlideVideo.length > 0) {
                if ('pause' in previousSlideVideo[0]) previousSlideVideo[0].pause();
            }
            // Callback
            if (pb.params.onSlideChangeStart) pb.params.onSlideChangeStart(swiper);
        };
        pb.onSliderTransitionEnd = function (swiper) {
            // Reset zoom
            if (pb.params.zoom && gestureSlide && swiper.previousIndex !== swiper.activeIndex) {
                gestureImg.transform('translate3d(0,0,0) scale(1)');
                gestureImgWrap.transform('translate3d(0,0,0)');
                gestureSlide = gestureImg = gestureImgWrap = undefined;
                scale = currentScale = 1;
            }
            if (pb.params.onSlideChangeEnd) pb.params.onSlideChangeEnd(swiper);
        };

        pb.layout = function (index) {
            if (pb.params.type === 'page') {
                pb.container = $('.photo-browser-v2-swiper-container').parents('.view');
            }
            else {
                pb.container = $('.photo-browser-v2');
            }
            if (pb.params.type === 'standalone') {
                pb.container.addClass('photo-browser-v2-in');
                // $.sizeNavbars(pb.container);
            }
            pb.swiperContainer = pb.container.find('.photo-browser-v2-swiper-container');
            pb.swiperWrapper = pb.container.find('.photo-browser-v2-swiper-wrapper');
            pb.slides = pb.container.find('.photo-browser-v2-slide');
            pb.captionsContainer = pb.container.find('.photo-browser-v2-captions');
            pb.captions = pb.container.find('.photo-browser-v2-caption');

            var sliderSettings = {
                nextButton: pb.params.nextButton || '.photo-browser-v2-next',
                prevButton: pb.params.prevButton || '.photo-browser-v2-prev',
                indexButton: pb.params.indexButton,
                initialSlide: index,
                spaceBetween: pb.params.spaceBetween,
                speed: pb.params.speed,
                loop: pb.params.loop,
                lazyLoading: pb.params.lazyLoading,
                lazyLoadingInPrevNext: pb.params.lazyLoadingInPrevNext,
                lazyLoadingOnTransitionStart: pb.params.lazyLoadingOnTransitionStart,
                preloadImages: pb.params.lazyLoading ? false : true,
                debug: pb.params.sliderDebug,
                omitScrolling: $.device.ios || !pb.params.tapMoveZoom,
                onTap: function (swiper, e) {
                    if (pb.params.onTap) pb.params.onTap(swiper, e);
                },
                onClick: function (swiper, e) {
                    if (!$.device.ios && isScaling) return;
                    if (pb.params.exposition) pb.toggleExposition();
                    if (pb.params.onClick) pb.params.onClick(swiper, e);
                },
                onDoubleTap: function (swiper, e) {
                    if (pb.params.doubleTapZoom === true)
                        pb.toggleZoom($(e.target).parents('.photo-browser-v2-slide'));
                    if (pb.params.onDoubleTap) pb.params.onDoubleTap(swiper, e);
                },
                onTransitionStart: function (swiper) {
                    pb.onSliderTransitionStart(swiper);
                },
                onTransitionEnd: function (swiper) {
                    pb.onSliderTransitionEnd(swiper);
                },
                onLazyImageLoad: function (swiper, slide, img) {
                    if (pb.params.onLazyImageLoad) pb.params.onLazyImageLoad(pb, slide, img);
                },
                onLazyImageReady: function (swiper, slide, img) {
                    $(slide).removeClass('photo-browser-v2-slide-lazy');
                    if (pb.params.onLazyImageReady) pb.params.onLazyImageReady(pb, slide, img);
                }
            };

            if (pb.params.swipeToClose && pb.params.type !== 'page') {
                sliderSettings.onTouchStart = pb.swipeCloseTouchStart;
                sliderSettings.onTouchMoveOpposite = pb.swipeCloseTouchMove;
                sliderSettings.onTouchEnd = pb.swipeCloseTouchEnd;
            }

            pb.swiper = $.swiper(pb.swiperContainer, sliderSettings);
            if (index === 0) {
                pb.onSliderTransitionStart(pb.swiper);
            }
            pb.attachEvents();
        };
        pb.attachEvents = function (detach) {
            var action = detach ? 'off' : 'on';
            // Slide between photos

            if (pb.params.zoom) {
                var target = pb.params.loop ? pb.swiper.slides : pb.slides;
                // Scale image
                if ($.device.ios && pb.params.tapMoveZoom) {
                    target[action]('gesturestart', pb.onSlideGestureStart);
                    target[action]('gesturechange', pb.onSlideGestureChange);
                    target[action]('gestureend', pb.onSlideGestureEnd);
                }
                // Move image
                target[action]('touchstart', pb.onSlideTouchStart);
                target[action]('touchmove', pb.onSlideTouchMove);
                target[action]('touchend', pb.onSlideTouchEnd);
            }
            pb.container.find('.photo-browser-v2-close-link')[action]('click', pb.close);
        };

        // Expose
        pb.exposed = false;
        pb.toggleExposition = function () {
            if (pb.container) pb.container.toggleClass('photo-browser-v2-exposed');
            if (pb.params.expositionHideCaptions) pb.captionsContainer.toggleClass('photo-browser-v2-captions-exposed');
            pb.exposed = !pb.exposed;
        };
        pb.enableExposition = function () {
            if (pb.container) pb.container.addClass('photo-browser-v2-exposed');
            if (pb.params.expositionHideCaptions) pb.captionsContainer.addClass('photo-browser-v2-captions-exposed');
            pb.exposed = true;
        };
        pb.disableExposition = function () {
            if (pb.container) pb.container.removeClass('photo-browser-v2-exposed');
            if (pb.params.expositionHideCaptions) pb.captionsContainer.removeClass('photo-browser-v2-captions-exposed');
            pb.exposed = false;
        };

        // Gestures
        var gestureSlide, gestureImg, gestureImgWrap, scale = 1, currentScale = 1, isScaling = false;
        pb.onSlideGestureStart = function () {
            if (!gestureSlide) {
                gestureSlide = $(this);
                gestureImg = gestureSlide.find('img, svg, canvas');
                gestureImgWrap = gestureImg.parent('.photo-browser-v2-zoom-container');
                if (gestureImgWrap.length === 0) {
                    gestureImg = undefined;
                    return;
                }
            }
            gestureImg.transition(0);
            isScaling = true;
        };
        pb.onSlideGestureChange = function (e) {
            if (!gestureImg || gestureImg.length === 0) return;
            scale = e.scale * currentScale;
            if (scale > pb.params.maxZoom) {
                scale = pb.params.maxZoom - 1 + Math.pow((scale - pb.params.maxZoom + 1), 0.5);
            }
            if (scale < pb.params.minZoom) {
                scale =  pb.params.minZoom + 1 - Math.pow((pb.params.minZoom - scale + 1), 0.5);
            }
            gestureImg.transform('translate3d(0,0,0) scale(' + scale + ')');
        };
        pb.onSlideGestureEnd = function () {
            if (!gestureImg || gestureImg.length === 0) return;
            scale = Math.max(Math.min(scale, pb.params.maxZoom), pb.params.minZoom);
            gestureImg.transition(pb.params.speed).transform('translate3d(0,0,0) scale(' + scale + ')');
            currentScale = scale;
            isScaling = false;
            if (scale === 1) gestureSlide = undefined;
        };
        pb.toggleZoom = function () {
            if (!gestureSlide) {
                gestureSlide = pb.swiper.slides.eq(pb.swiper.activeIndex);
                gestureImg = gestureSlide.find('img, svg, canvas');
                gestureImgWrap = gestureImg.parent('.photo-browser-v2-zoom-container');
            }
            if (!gestureImg || gestureImg.length === 0) return;
            gestureImgWrap.transition(300).transform('translate3d(0,0,0)');
            if (scale && scale !== 1) {
                scale = currentScale = 1;
                gestureImg.transition(300).transform('translate3d(0,0,0) scale(1)');
                gestureSlide = undefined;
            } else {
                var toggleMaxZoom = Number(pb.params.toggleMaxZoom);
                if (isNaN(toggleMaxZoom) || toggleMaxZoom > pb.params.maxZoom) toggleMaxZoom = pb.params.maxZoom;
                scale = currentScale = toggleMaxZoom;
                gestureImg.transition(300).transform('translate3d(0,0,0) scale(' + scale + ')');
            }
        };

        var imageIsTouched, imageIsMoved, imageCurrentX, imageCurrentY, imageMinX, imageMinY, imageMaxX, imageMaxY,
            imageWidth, imageHeight, imageTouchesStart = {}, imageTouchesCurrent = {}, imageStartX, imageStartY,
            velocityPrevPositionX, velocityPrevTime, velocityX, velocityPrevPositionY, velocityY, lastMoveEndTime = 0;

        var touchedScaleInf = {};

        function getDistance(touches) {
            return Math.sqrt(
                Math.pow((touches[0].clientX - touches[1].clientX), 2) +
                Math.pow((touches[0].clientY - touches[1].clientY), 2)
            );
        }

        function computeTouchedScale(touches) {
            const distance = getDistance(touches);
            return (touchedScaleInf.startScale * distance) / touchedScaleInf.startDistance;
        }

        function resetImageOnTapZoomEnd() {
            if (!gestureImg || gestureImg.length === 0) return;
            if (currentScale <= 1) {
                gestureImgWrap.transition(300).transform('translate3d(0,0,0)');
            } else {
                var imgW = gestureImg[0].offsetWidth, imgH = gestureImg[0].offsetHeight;
                var scaledWidth = imgW * scale, scaledHeight = imgH * scale;

                var imgMinX = Math.min((pb.swiper.width / 2 - scaledWidth / 2), 0);
                var imgMaxX = -imgMinX;
                var imgMinY = Math.min((pb.swiper.height / 2 - scaledHeight / 2), 0);
                var imgMaxY = -imgMinY;

                var imgStartX = $.getTranslate(gestureImgWrap[0], 'x') || 0;
                var imgStartY = $.getTranslate(gestureImgWrap[0], 'y') || 0;
                var imgCurrX = Math.max(Math.min(imgStartX, imgMaxX), imgMinX);
                var imgCurrY = Math.max(Math.min(imgStartY, imgMaxY), imgMinY);

                if (pb.params.debug) {
                    console.log(imgMinX, imgMaxX, imgStartX, imgCurrX);
                    console.log(imgMinY, imgMaxY, imgStartY, imgCurrY);
                }
                gestureImgWrap.transition(300).transform('translate3d(' + imgCurrX + 'px, ' + imgCurrY + 'px,0)');
            }
        }

        pb.onSlideTouchStart = function (e) {
            if (pb.params.debug) console.log('start');
            if (!$.device.ios && pb.params.tapMoveZoom) {
                var touches = e.touches || [];
                if (pb.params.debug) console.log('-start-1');
                if (isScaling) return;
                if (pb.params.debug) console.log('-start-2');
                if (touches.length === 2) {
                    imageIsTouched = false;
                    pb.onSlideGestureStart.call(this);
                    touchedScaleInf.startTouches = [touches[0], touches[1]];
                    touchedScaleInf.startDistance = getDistance(touches);
                    touchedScaleInf.startScale = 1;
                    return;
                }
            }
            if (pb.params.debug) console.log('-start-4');
            if (!gestureImg || gestureImg.length === 0) return;
            if (pb.params.debug) console.log('-start-5');
            if (imageIsTouched) return;
            if (pb.params.debug) console.log('-start-6');
            if ($.device.os === 'android') e.preventDefault();
            imageIsTouched = true;
            imageTouchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
            imageTouchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
        };
        pb.onSlideTouchMove = function (e) {
            if (pb.params.debug) console.log('move');
            if (!$.device.ios && pb.params.tapMoveZoom && isScaling) {
                var touches = e.touches || [];
                if (touches.length === 2) {
                    var touchedScale = computeTouchedScale(touches);
                    pb.onSlideGestureChange({scale: touchedScale});
                }
                return;
            }

            if (!gestureImg || gestureImg.length === 0) return;

            if (pb.params.debug) console.log('move-0', imageIsTouched, gestureSlide);
            pb.swiper.allowClick = false;
            if (!imageIsTouched || !gestureSlide) return;
            // if (!$.device.ios && pb.params.tapMoveZoom && new Date().getTime() <= lastMoveEndTime) return;

            if (!imageIsMoved) {
                imageWidth = gestureImg[0].offsetWidth;
                imageHeight = gestureImg[0].offsetHeight;
                imageStartX = $.getTranslate(gestureImgWrap[0], 'x') || 0;
                if (pb.params.debug) console.log('move-1', imageStartX);
                imageStartY = $.getTranslate(gestureImgWrap[0], 'y') || 0;
                gestureImgWrap.transition(0);
            }
            // Define if we need image drag
            var scaledWidth = imageWidth * scale;
            var scaledHeight = imageHeight * scale;

            if (pb.params.debug) console.log('move-10');
            if (scaledWidth < pb.swiper.width && scaledHeight < pb.swiper.height) return;
            if (pb.params.debug) console.log('move-20');

            imageMinX = Math.min((pb.swiper.width / 2 - scaledWidth / 2), 0);
            imageMaxX = -imageMinX;
            imageMinY = Math.min((pb.swiper.height / 2 - scaledHeight / 2), 0);
            imageMaxY = -imageMinY;

            imageTouchesCurrent.x = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
            imageTouchesCurrent.y = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;

            if (!imageIsMoved && !isScaling || !$.device.ios && pb.params.tapMoveZoom) {
                if (!$.device.ios && pb.params.tapMoveZoom) {
                    if (pb.params.debug) console.log(imageMinX, imageStartX, imageTouchesCurrent.x,
                        imageTouchesStart.x - pb.params.tapImgMoveStop4WrapXDelta, imageIsTouched);
                    if (
                        (Math.floor(imageMinX) === Math.floor(imageStartX)
                            && imageTouchesCurrent.x < imageTouchesStart.x - pb.params.tapImgMoveStop4WrapXDelta) ||
                        (Math.floor(imageMaxX) === Math.floor(imageStartX)
                            && imageTouchesCurrent.x > imageTouchesStart.x + pb.params.tapImgMoveStop4WrapXDelta)
                    ) {
                        if (pb.params.debug) console.log('move-t0ouch-stop');
                        imageIsTouched = false;
                        return;
                    }
                } else {
                    if (
                        (Math.floor(imageMinX) === Math.floor(imageStartX) && imageTouchesCurrent.x < imageTouchesStart.x) ||
                        (Math.floor(imageMaxX) === Math.floor(imageStartX) && imageTouchesCurrent.x > imageTouchesStart.x)
                    ) {
                        imageIsTouched = false;
                        return;
                    }
                }
            }
            if (pb.params.debug) console.log('move-30');
            e.preventDefault();
            e.stopPropagation();
            imageIsMoved = true;
            imageCurrentX = imageTouchesCurrent.x - imageTouchesStart.x + imageStartX;
            imageCurrentY = imageTouchesCurrent.y - imageTouchesStart.y + imageStartY;

            if (!$.device.device && pb.params.tapMoveZoom) {
                if (Math.floor(imageMinX) === Math.floor(imageStartX) && imageTouchesCurrent.x < imageTouchesStart.x)
                    imageCurrentX = imageMinX;
                else if (Math.floor(imageMaxX) === Math.floor(imageStartX) && imageTouchesCurrent.x > imageTouchesStart.x)
                    imageCurrentX = imageMaxX;
            }

            if (imageCurrentX < imageMinX) {
                imageCurrentX =  imageMinX + 1 - Math.pow((imageMinX - imageCurrentX + 1), 0.8);
            }
            if (imageCurrentX > imageMaxX) {
                imageCurrentX = imageMaxX - 1 + Math.pow((imageCurrentX - imageMaxX + 1), 0.8);
            }

            if (imageCurrentY < imageMinY) {
                imageCurrentY =  imageMinY + 1 - Math.pow((imageMinY - imageCurrentY + 1), 0.8);
            }
            if (imageCurrentY > imageMaxY) {
                imageCurrentY = imageMaxY - 1 + Math.pow((imageCurrentY - imageMaxY + 1), 0.8);
            }

            //Velocity
            if (!velocityPrevPositionX) velocityPrevPositionX = imageTouchesCurrent.x;
            if (!velocityPrevPositionY) velocityPrevPositionY = imageTouchesCurrent.y;
            if (!velocityPrevTime) velocityPrevTime = Date.now();
            velocityX = (imageTouchesCurrent.x - velocityPrevPositionX) / (Date.now() - velocityPrevTime) / 2;
            velocityY = (imageTouchesCurrent.y - velocityPrevPositionY) / (Date.now() - velocityPrevTime) / 2;
            if (Math.abs(imageTouchesCurrent.x - velocityPrevPositionX) < 2) velocityX = 0;
            if (Math.abs(imageTouchesCurrent.y - velocityPrevPositionY) < 2) velocityY = 0;
            velocityPrevPositionX = imageTouchesCurrent.x;
            velocityPrevPositionY = imageTouchesCurrent.y;
            velocityPrevTime = Date.now();

            if (pb.params.debug) console.log('move-40');
            gestureImgWrap.transform('translate3d(' + imageCurrentX + 'px, ' + imageCurrentY + 'px,0)');
        };
        pb.onSlideTouchEnd = function (e) {
            if (!$.device.ios && pb.params.tapMoveZoom && isScaling) {
                if (pb.params.debug) console.log('end-1');
                if (e.touches.length <= 0) {
                    if (pb.params.debug) console.log('end-2');
                    pb.onSlideGestureEnd.call(this);
                    resetImageOnTapZoomEnd();
                }
                return;
            }
            if (pb.params.debug) console.log('end-4');

            if (!gestureImg || gestureImg.length === 0) return;
            if (pb.params.debug) console.log('end-5');
            if (!imageIsTouched || !imageIsMoved) {
                imageIsTouched = false;
                imageIsMoved = false;
                return;
            }
            if (pb.params.debug) console.log('end-6');
            imageIsTouched = false;
            imageIsMoved = false;
            var momentumDurationX = pb.params.moveMomentumDuration;
            var momentumDurationY = pb.params.moveMomentumDuration;
            var momentumDistanceX = velocityX * momentumDurationX;
            var newPositionX = imageCurrentX + momentumDistanceX;
            var momentumDistanceY = velocityY * momentumDurationY;
            var newPositionY = imageCurrentY + momentumDistanceY;

            //Fix duration
            if (velocityX !== 0) momentumDurationX = Math.abs((newPositionX - imageCurrentX) / velocityX);
            if (velocityY !== 0) momentumDurationY = Math.abs((newPositionY - imageCurrentY) / velocityY);
            var momentumDuration = Math.max(momentumDurationX, momentumDurationY);
            // lastMoveEndTime = new Date().getTime() + momentumDuration;

            imageCurrentX = newPositionX;
            imageCurrentY = newPositionY;

            // Define if we need image drag
            var scaledWidth = imageWidth * scale;
            var scaledHeight = imageHeight * scale;
            imageMinX = Math.min((pb.swiper.width / 2 - scaledWidth / 2), 0);
            imageMaxX = -imageMinX;
            imageMinY = Math.min((pb.swiper.height / 2 - scaledHeight / 2), 0);
            imageMaxY = -imageMinY;
            imageCurrentX = Math.max(Math.min(imageCurrentX, imageMaxX), imageMinX);
            imageCurrentY = Math.max(Math.min(imageCurrentY, imageMaxY), imageMinY);

            gestureImgWrap.transition(momentumDuration).transform('translate3d(' + imageCurrentX + 'px, ' + imageCurrentY + 'px,0)');
        };

        // Swipe Up To Close
        var swipeToCloseIsTouched = false;
        var allowSwipeToClose = true;
        var swipeToCloseDiff, swipeToCloseStart, swipeToCloseCurrent, swipeToCloseStarted = false, swipeToCloseActiveSlide, swipeToCloseTimeStart;
        pb.swipeCloseTouchStart = function () {
            if (!allowSwipeToClose) return;
            swipeToCloseIsTouched = true;
        };
        pb.swipeCloseTouchMove = function (swiper, e) {
            if (!swipeToCloseIsTouched) return;
            if (!swipeToCloseStarted) {
                swipeToCloseStarted = true;
                swipeToCloseStart = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
                swipeToCloseActiveSlide = pb.swiper.slides.eq(pb.swiper.activeIndex);
                swipeToCloseTimeStart = (new Date()).getTime();
            }
            e.preventDefault();
            swipeToCloseCurrent = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
            swipeToCloseDiff = swipeToCloseStart - swipeToCloseCurrent;
            var opacity = 1 - Math.abs(swipeToCloseDiff) / 300;
            swipeToCloseActiveSlide.transform('translate3d(0,' + (-swipeToCloseDiff) + 'px,0)');
            pb.swiper.container.css('opacity', opacity).transition(0);
        };
        pb.swipeCloseTouchEnd = function () {
            swipeToCloseIsTouched = false;
            if (!swipeToCloseStarted) {
                swipeToCloseStarted = false;
                return;
            }
            swipeToCloseStarted = false;
            allowSwipeToClose = false;
            var diff = Math.abs(swipeToCloseDiff);
            var timeDiff = (new Date()).getTime() - swipeToCloseTimeStart;
            if ((timeDiff < 300 && diff > 20) || (timeDiff >= 300 && diff > 100)) {
                setTimeout(function () {
                    if (pb.params.type === 'standalone') {
                        pb.close();
                    }
                    if (pb.params.type === 'popup') {
                        $.closeModal(pb.popup);
                    }
                    if (pb.params.onSwipeToClose) {
                        pb.params.onSwipeToClose(pb);
                    }
                    allowSwipeToClose = true;
                }, 0);
                return;
            }
            if (diff !== 0) {
                swipeToCloseActiveSlide.addClass('transitioning').transitionEnd(function () {
                    allowSwipeToClose = true;
                    swipeToCloseActiveSlide.removeClass('transitioning');
                });
            }
            else {
                allowSwipeToClose = true;
            }
            pb.swiper.container.css('opacity', '').transition('');
            swipeToCloseActiveSlide.transform('');
        };

        return pb;
    };

    PhotoBrowserV2.prototype = {
        defaults: {
            photos                      : [],
            container                   : 'body',
            initialSlide                : 0,
            spaceBetween                : 20,
            speed                       : 300,
            zoom                        : true,
            maxZoom                     : 3,
            toggleMaxZoom               : 3,
            minZoom                     : 1,
            doubleTapZoom               : true,
            tapMoveZoom                 : false,
            tapImgMoveStop4WrapXDelta   : 20,
            exposition                  : true,
            expositionHideCaptions      : false,
            debug                       : false,
            moveMomentumDuration        : 1000,
            type                        : 'standalone',
            navbar                      : true,
            toolbar                     : true,
            theme                       : 'light',
            swipeToClose                : true,
            backLinkText                : 'Close',
            ofText                      : 'of',
            loop                        : false,
            lazyLoading                 : false,
            lazyLoadingInPrevNext       : false,
            lazyLoadingOnTransitionStart: false,
            /*
            Callbacks:
            onLazyImageLoad(pb, slide, img)
            onLazyImageReady(pb, slide, img)
            onOpen(pb)
            onClose(pb)
            onSlideChangeStart(swiper)
            onSlideChangeEnd(swiper)
            onTap(swiper, e)
            onClick(swiper, e)
            onDoubleTap(swiper, e)
            onSwipeToClose(pb)
            */
        }
    };

    $.photoBrowserV2 = function (params) {
        $.extend(params, $.photoBrowserV2.prototype.defaults);
        return new PhotoBrowserV2(params);
    };

    $.photoBrowserV2.prototype = {
        defaults: {}
    };

}(Zepto);
