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

var mousePosition = {x: null, y: null},
    yarxiResource = 'http://yarxi.ru/tsearch.php',
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
            block.style.overflowY = 'auto';
            block.className = 'yarxi_blitz';
            return this;
        },
        fill: function (data) {
            block.innerHTML = data.substring(1);
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
        injected: function () {
            return block !== undefined;
        },
        block: function() {
            return block;
        },
        visible: function() {
            return block.style.left !== px(-1000);
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


function yarxiBlitz(event) {
    if (event.keyCode === 116 || event.keyCode === 1077) {
        if (!blockHandler.injected()) {
            blockHandler.inject();
        }

        var text = window.getSelection().toString();
        if (text && text.length <= 15) {
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    blockHandler.fill(xhr.responseText).show(mousePosition.x, mousePosition.y);
                    console.log(document.caretRangeFromPoint(mousePosition.x, mousePosition.y));
                }
            }
            xhr.open("POST", yarxiResource.replace('%s', text), true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send('R=' + text + '&M=&Src=bytext');
        }

    } else {
        if (blockHandler.injected() && (!event.target.id || event.target.id !== yarxiBlitzId)) {
            blockHandler.hide();
        }
    }
}

document.querySelector("body").addEventListener('mousemove', function (event) {
    mousePosition = {x: event.pageX, y: event.pageY};
}, true);
document.querySelector("body").addEventListener('click', function (event) {
    if(blockHandler.injected() && blockHandler.visible())
        blockHandler.hide();
});
document.querySelector("body").addEventListener("keypress", yarxiBlitz);




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

