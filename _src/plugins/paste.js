///import core
///import plugins/inserthtml.js
///import plugins/undo.js
///import plugins/serialize.js
///commands 粘贴
///commandsName  PastePlain
///commandsTitle  纯文本粘贴模式
/*
 ** @description 粘贴
 * @author zhanyi
 */
;
(function ($, ns) {
    ns.plugins['paste'] = function () {
        function getClipboardData(callback) {
            var doc = this.document;
            if (doc.getElementById('baidu_pastebin')) {
                return;
            }
            var range = this.selection.getRange(),
                bk = range.createBookmark(),
            //创建剪贴的容器div
                pastebin = doc.createElement('div');
            pastebin.id = 'baidu_pastebin';
            // Safari 要求div必须有内容，才能粘贴内容进来
            $.os.webkit && pastebin.appendChild(doc.createTextNode(domUtils.fillChar + domUtils.fillChar));
            doc.body.appendChild(pastebin);
            //trace:717 隐藏的span不能得到top
            //bk.start.innerHTML = '&nbsp;';
            bk.start.style.display = '';
            pastebin.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;left:-1000px;white-space:nowrap;top:" +
                //要在现在光标平行的位置加入，否则会出现跳动的问题
                domUtils.getXY(bk.start).y + 'px';

            range.selectNodeContents(pastebin).select(true);

            setTimeout(function () {
                if ($.os.webkit) {
                    for (var i = 0, pastebins = doc.querySelectorAll('#baidu_pastebin'), pi; pi = pastebins[i++];) {
                        if (domUtils.isEmptyNode(pi)) {
                            domUtils.remove(pi);
                        } else {
                            pastebin = pi;
                            break;
                        }
                    }
                }
                try {
                    pastebin.parentNode.removeChild(pastebin);
                } catch (e) {
                }
                range.moveToBookmark(bk).select(true);
                callback(pastebin);
            }, 0);
        }

        var me = this;

        var txtContent, htmlContent, address;

        function filter(div) {
            var html;
            if (div.firstChild) {
                //去掉cut中添加的边界值
                var nodes = domUtils.getElementsByTagName(div, 'span');
                for (var i = 0, ni; ni = nodes[i++];) {
                    if (ni.id == '_baidu_cut_start' || ni.id == '_baidu_cut_end') {
                        domUtils.remove(ni);
                    }
                }

                if ($.os.webkit) {

                    var brs = div.querySelectorAll('div br');
                    for (var i = 0, bi; bi = brs[i++];) {
                        var pN = bi.parentNode;
                        if (pN.tagName == 'DIV' && pN.childNodes.length == 1) {
                            pN.innerHTML = '<p><br/></p>';
                            domUtils.remove(pN);
                        }
                    }
                    var divs = div.querySelectorAll('#baidu_pastebin');
                    for (var i = 0, di; di = divs[i++];) {
                        var tmpP = me.document.createElement('p');
                        di.parentNode.insertBefore(tmpP, di);
                        while (di.firstChild) {
                            tmpP.appendChild(di.firstChild);
                        }
                        domUtils.remove(di);
                    }

                    var metas = div.querySelectorAll('meta');
                    for (var i = 0, ci; ci = metas[i++];) {
                        domUtils.remove(ci);
                    }

                    var brs = div.querySelectorAll('br');
                    for (i = 0; ci = brs[i++];) {
                        if (/^apple-/.test(ci)) {
                            domUtils.remove(ci);
                        }
                    }
                }

                var spans = div.querySelectorAll('span.Apple-style-span');
                for (var i = 0, ci; ci = spans[i++];) {
                    domUtils.remove(ci, true);
                }

                //ie下使用innerHTML会产生多余的\r\n字符，也会产生&nbsp;这里过滤掉
                html = div.innerHTML.replace(/>(?:(\s|&nbsp;)*?)</g, '><');

                var root = ns.htmlparser(html);
                //如果给了过滤规则就先进行过滤
                if (me.options.filterRules) {
                    ns.filterNode(root, me.options.filterRules);
                }
                //执行默认的处理
                me.filterInputRule(root);
                html = {'html':root.toHtml()};
                me.trigger('beforepaste', html);
                root = ns.htmlparser(html.html);
                //如果开启了纯文本模式
                if (me.queryCommandState('pasteplain')) {
                    me.execCommand('insertHtml', ME.filterNode(root, me.options.filterTxtRules).toHtml(), true);
                } else {
                    //文本模式
                    ME.filterNode(root, me.options.filterTxtRules);
                    txtContent = root.toHtml();
                    //完全模式
                    htmlContent = html.html;
                    address = me.selection.getRange().createAddress(true);
                    me.execCommand('insertHtml', htmlContent, true);
                }
                me.trigger("afterpaste");
            }
        }

        me.on('pasteTransfer', function (cmd, plainType) {
            if (address && txtContent && htmlContent && txtContent != htmlContent) {
                var range = me.selection.getRange();
                range.moveToAddress(address, true).deleteContents();
                range.select(true);
                me.__hasEnterExecCommand = true;
                var html = htmlContent;
                if (plainType === 2) {
                    html = html.replace(/<(\/?)([\w\-]+)([^>]*)>/gi, function (a, b, tagName, attrs) {
                        tagName = tagName.toLowerCase();
                        if ({img:1}[tagName]) {
                            return a;
                        }
                        attrs = attrs.replace(/([\w\-]*?)\s*=\s*(("([^"]*)")|('([^']*)')|([^\s>]+))/gi, function (str, atr, val) {
                            if ({
                                'src':1,
                                'href':1,
                                'name':1
                            }[atr.toLowerCase()]) {
                                return atr + '=' + val + ' '
                            }
                            return ''
                        });
                        if ({
                            'span':1,
                            'div':1
                        }[tagName]) {
                            return ''
                        } else {

                            return '<' + b + tagName + ' ' + $.trim(attrs) + '>'
                        }

                    });
                } else if (plainType) {
                    html = txtContent;
                }
                me.execCommand('inserthtml', html, true);
                me.__hasEnterExecCommand = false;
                var tmpAddress = me.selection.getRange().createAddress(true);
                address.endAddress = tmpAddress.startAddress;
            }
        });
        me.on('ready', function () {
            domUtils.on(me.body, 'cut', function () {
                var range = me.selection.getRange();
                if (!range.collapsed && me.undoManger) {
                    me.undoManger.save();
                }

            });
            //ie下beforepaste在点击右键时也会触发，所以用监控键盘才处理
            $(me.body).on('paste', function () {
                getClipboardData.call(me, function (div) {
                    filter(div);
                });
            })

        });
    };
})(Zepto, ME)


