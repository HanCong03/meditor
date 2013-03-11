///import core
///commands 当输入内容超过编辑器高度时，编辑器自动增高
///commandsName  AutoHeight,autoHeightEnabled
///commandsTitle  自动增高
/**
 * @description 自动伸展
 * @author zhanyi
 */
(function($, ns){
    ns.plugins['autoheight'] = function () {
        var me = this;
        //提供开关，就算加载也可以关闭
        me.autoHeightEnabled = me.options.autoHeightEnabled !== false;
        if (!me.autoHeightEnabled) {
            return;
        }

        var bakOverflow,
            span, tmpNode,
            lastHeight = 0,
            options = me.options,
            currentHeight,
            timer;

        function adjustHeight() {
            clearTimeout(timer);
            timer = setTimeout(function () {
                if (me.queryCommandState('source') != 1) {
                    if (!span) {
                        span = me.document.createElement('span');
                        //trace:1764
                        span.style.cssText = 'display:block;width:0;margin:0;padding:0;border:0;clear:both;';
                        span.innerHTML = '.';
                    }
                    tmpNode = span.cloneNode(true);
                    me.body.appendChild(tmpNode);

                    currentHeight = Math.max(domUtils.getXY(tmpNode).y + tmpNode.offsetHeight,Math.max(options.minFrameHeight, options.initialFrameHeight));

                    if (currentHeight != lastHeight) {

                        me.setHeight(currentHeight);

                        lastHeight = currentHeight;
                    }

                    domUtils.remove(tmpNode);

                }
            }, 50);
        }

        me.on('destroy', function () {
            me.off('contentchange', adjustHeight);
            me.off('keyup', adjustHeight);
            me.off('mouseup', adjustHeight);
        });
        me.enableAutoHeight = function () {
            if (!me.autoHeightEnabled) {
                return;
            }
            var doc = me.document;
            me.autoHeightEnabled = true;
            bakOverflow = doc.body.style.overflowY;
            doc.body.style.overflowY = 'hidden';
            me.on('contentchange', adjustHeight);
            me.on('keyup', adjustHeight);
            me.on('mouseup', adjustHeight);
            //ff不给事件算得不对
            setTimeout(function () {
                adjustHeight();
            }, 100);
            me.trigger('autoheightchanged', me.autoHeightEnabled);
        };
        me.disableAutoHeight = function () {

            me.body.style.overflowY = bakOverflow || '';

            me.off('contentchange', adjustHeight);
            me.off('keyup', adjustHeight);
            me.off('mouseup', adjustHeight);
            me.autoHeightEnabled = false;
            me.trigger('autoheightchanged', me.autoHeightEnabled);
        };
        me.on('ready', function () {
            me.enableAutoHeight();
            //trace:1764
            var timer;
            domUtils.on(me.document, 'dragover', function () {
                clearTimeout(timer);
                timer = setTimeout(function () {
                    adjustHeight();
                }, 100);

            });
        });
    };
})(Zepto, ME);