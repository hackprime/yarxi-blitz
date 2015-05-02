/*
search.php
K: ключи | '505,157,1046'
R: поиск по чтению | string
M: поиск по значению | string
-S: количество черт | integer

search.php
R: фонетический словарь поиск по чтению | string
M: фонетический словарь поиск по значению | string
Src:bytext
*/

var yarxiResource = 'http://yarxi.ru/tsearch.php',
    date = new Date(),
    yarxiBlitzId = 'yarxi_blitz_' + date.getTime(),
    blockHandler;

function px(value) { return value + 'px'; }

function translationBlock(id) {
    var block = undefined;
    return {
        create: function () {
            block = document.createElement('div');
            block.style.position = 'absolute';
            block.style.left = px(-1000);
            block.style.top = px(-1000);
            block.style.width = px(300);
            block.style.maxHeight = px(400);
            block.style.overflowY = 'scroll';
            block.className = 'yarxi_blitz';
            return this;
        },
        fill: function (data) {
            block.innerHTML = data;
            return this;
        },
        show: function (x, y) {
            block.style.left = px(x);
            block.style.top = px(y);
            return this;
        },
        hide: function () {
            block.style.left = px(-1000);
            block.style.top = px(-1000);
            return this;
        },
        isInjected: function () {
            return block !== undefined;
        },
        block: function() {
            return block;
        },
        inject: function () {
            var shadowRoot,
                shadowHost,
                shadowStyle;

            shadowHost = document.createElement('div');
            shadowHost.id = id;
            document.querySelector("body").appendChild(shadowHost);
            shadowRoot = shadowHost.createShadowRoot();

            shadowStyle = document.createElement('style');
            shadowStyle.innerHTML = "@import url('" + chrome.extension.getURL('yarxi.css') + "');@import url('" + chrome.extension.getURL('yarxi.original.css') + "');"
            shadowRoot.appendChild(shadowStyle);

            shadowRoot.appendChild(this.create().block());
            return this;
        },
    };
}

blockHandler = translationBlock(yarxiBlitzId);


document.querySelector("body").addEventListener('click', function (event) {

    if (event.altKey) {
        if (!blockHandler.isInjected()) {
            blockHandler.inject();
        }

        var text = window.getSelection().toString();
        if (text && text.length <= 15) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    blockHandler.fill(xhr.responseText).show(event.pageX, event.pageY);
                    console.log(document.caretRangeFromPoint(event.pageX, event.pageY));
                }
            }
            xhr.open("POST", yarxiResource.replace('%s', text), true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send('R=' + text + '&M=&Src=bytext');
        }

    } else {
        if (blockHandler.isInjected() && (!event.target.id || event.target.id !== yarxiBlitzId)) {
            blockHandler.hide();
        }
    }
}, false);


// function getSelectionText() {
//     var text = "";
//     if (window.getSelection) {
//         text = window.getSelection().toString();
//     } else if (document.selection && document.selection.type != "Control") {
//         text = document.selection.createRange().text;
//     }
//     return text;
// }

// function getSelText() {
//   var seltxt = '';      // store selected text

//   // get selected text
//   if (window.getSelection) {
//     seltxt = window.getSelection();
//   } else if (document.getSelection) {
//     seltxt = document.getSelection();
//   } else if (document.selection) {
//     seltxt = document.selection.createRange().text;
//   }
//   return seltxt;
// }

// $(".clickable").click(function(e) {
//     s = window.getSelection();
//     var range = s.getRangeAt(0);
//     var node = s.anchorNode;
//     while (range.toString().indexOf(' ') != 0) {
//         range.setStart(node, (range.startOffset - 1));
//     }
//     range.setStart(node, range.startOffset + 1);
//     do {
//         range.setEnd(node, range.endOffset + 1);

//     } while (range.toString().indexOf(' ') == -1 && range.toString().trim() != '' && range.endOffset < node.length);
//     var str = range.toString().trim();
//     alert(str);
// });​
