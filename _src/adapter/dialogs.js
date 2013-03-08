;(function($, ns){
    var ui = ns.ui;

    function _t(key){
        return {
            fontcolor: 'forecolor',
            bgcolor: 'backcolor',
            image: 'insertimage'
        }[key] || key;
    }

    ns.registerUI(
        'fontcolor bgcolor', function(editor,cmdName){
            var dialog,
                cmd = _t(cmdName),
                btn = ui.button({
                    name : cmdName,
                    click:function(){
                        dialog = dialog || ui.colorpicker({
                            confirm: function(){
                                editor.execCommand(cmd, this.hex() );
                            },
                            clearColor: function(){
                                editor.execCommand(cmd, 'default' );
                            }
                        });
                        dialog.open();
                    },
                    title:cmdName
                });

            editor.on('selectionchange',function(){
                var state = editor.queryCommandState(cmd);
                btn.highlight(state == 1).enable(state != -1);
            });

            return btn;
        }
    );

    ns.registerUI('image', function (editor, cmdName) {
        var cmd = _t(cmdName), imguploader,
            btn = ui.button({
                name: cmdName,
                click: function () {
                    imguploader = imguploader || ui.imguploader({
                        url: './imguploader/data.php',
                        confirm: function () {
                            console.log(this.value());
                            var urls = this.value(), html;

                            $.each(urls, function () {
                                html += '<img src="' + this + '" />';
                            });
                            editor.execCommand('insertHtml', html);
                            this.hide();
                        }

                    })
                    imguploader.clear().open();
                }
            });

        editor.on('selectionchange',function(){
            var state = editor.queryCommandState(cmd);
            btn.highlight(state == 1).enable(state != -1);
        });

        return btn;
    })
})(Zepto,ME);