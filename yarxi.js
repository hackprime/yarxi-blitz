/*
API

search.php
K: ключи | '505,157,1046'
R: поиск по чтению | string
M: поиск по значению | string
-S: количество черт | integer

search.php
R: фонетический словарь поиск по чтению | string
M: фонетический словарь поиск по значению | string
Src:bytext

Response keys
S - несколько иероглифов на выбор
T - слово
E - kanji
A - error

TODO:
- починить расположение блочка в граничных случаях вызова
- обработка ключей ответа
- обработка ошибок (сетевая ошибка, неизвестная ошибка, не удалось ничего найти)
- сверствать ответ с ключём S (несколько иероглифов)
- забиндить на alt, ctrl, shift или command
- Uncaught TypeError: Cannot read property 'getURL' of undefined
*/

// Helpers
function px(value) {
    return value + 'px';
}

function transformKanjiLinks(text) {
    return text.replace(/<a (?:class="kanji" )?href="javascript:onr\(\d+\);">(.)<\/a>/g,
                        '<span class="kanji" moveto="$1">$1</span>')
}

function addClass(block, className) {
    block.className = block.className === '' ? className : block.className + ' ' + className;
}

function removeClass(block, className) {
    block.className = block.className.replace(new RegExp('\\b' + className + '\\b\\s?'), '');
}

function stripTags(text) {
    return text.replace(/<[^>]+>/g, '');
}

var yarxiResource = 'http://yarxi.ru/tsearch.php',
    date = new Date(),
    yarxiBlitzId = 'yarxi_blitz_' + date.getTime(),
    blockHandler,
    blockLocation = {left: null, top: null},
    imgUrls = {
        "img/dia.png": chrome.extension.getURL("img/dia.png"),
        "img/one.png": chrome.extension.getURL("img/one.png"),
        "img/shim.gif": chrome.extension.getURL("img/shim.gif"),
        "img/tarr.png": chrome.extension.getURL("img/tarr.png"),
        "img/tri.png": chrome.extension.getURL("img/tri.png")
    }
    views = {
        kanjilist: function (responseText) {
            return transformKanjiLinks(responseText);
        },
        kanji: function (responseText) {
            return transformKanjiLinks(responseText).replace(/(img\/\w+\.png)/g, function (match) {
                return imgUrls[match];
            });

        },
        word: function (responseText) {
            return transformKanjiLinks(responseText);
        },
        error: function (responseText) {
            return responseText;
        },
    },
    codeToView = {S: 'kanjilist', E: 'kanji',  T: 'word', A: 'error'};

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
        render: function (code, html) {
            var viewName = codeToView[code];
            block.className = 'yarxi_blitz yarxi_blitz-' + viewName;
            block.innerHTML = views[viewName](html);
            return this;
        },
        show: function (location) {
            location = location || blockLocation;
            block.style.left = px(location.left);
            block.style.top = px(location.top);
        },
        hide: function () {
            block.style.left = px(-1000);
            block.style.top = px(-1000);
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
            shadowStyle.innerHTML = "@import url('" + chrome.extension.getURL('yarxi.css') + "');@import url('" + chrome.extension.getURL('yarxi.original.css') + "');";
            shadowRoot.appendChild(shadowStyle);

            shadowRoot.appendChild(this.create().block());
        },

        request: function(text) {
            var xhr = new XMLHttpRequest(),
                self = this;
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    self.render(xhr.responseText.substring(0, 1), xhr.responseText.substring(1))
                        .show(blockLocation);
                }
            }
            xhr.open("POST", yarxiResource.replace('%s', text), true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send('R=' + text + '&M=&Src=bytext');
        },

        delegateKanjiLinks: function () {
            var self = this;
            block.addEventListener('click', function (event) {
                console.log('click');
                var target = event.target,
                    link;

                while (target !== block) {
                    console.log([target, block]);
                    if (target.className && target.className === 'kanji') {
                        console.log(['found', target.getAttribute('moveto')]);
                        self.request(target.getAttribute('moveto'));
                        return;
                    }
                    target = target.parentNode;
                }

            });
        }
    };
}

blockHandler = translationBlock(yarxiBlitzId);


function yarxiBlitz(event) {
    if (event.keyCode === 116 || event.keyCode === 1077) {
        if (!blockHandler.injected()) {
            blockHandler.inject();
            blockHandler.delegateKanjiLinks();
        }

        var selection = window.getSelection(),
            rect = selection.getRangeAt(0).getBoundingClientRect();
            text = selection.toString();

        blockLocation.left = rect.left + rect.width;
        blockLocation.top = rect.top

        if (text && text.length <= 15) {
            blockHandler.request(text);
        }

    } else {
        if (blockHandler.injected() && (!event.target.id || event.target.id !== yarxiBlitzId)) {
            blockHandler.hide();
        }
    }
}

document.querySelector("body").addEventListener('click', function (event) {
    var externalBlock = document.getElementById(yarxiBlitzId);
    if (externalBlock && !externalBlock.contains(event.target)
            && blockHandler.injected() && blockHandler.visible()) {
        blockHandler.hide();
    }
});
document.querySelector("body").addEventListener('keypress', yarxiBlitz);
