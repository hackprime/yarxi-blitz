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

(function () {
    function px(value) {
        return value + 'px';
    }

    function transformKanjiLinks(text) {
        return text.replace(/<a (?:class="kanji" )?href="javascript:onr\(\d+\);">(.)<\/a>/g,
                            '<span class="kanji" moveto="$1">$1</span>')
    }

    function stripTags(text) {
        return text.replace(/<[^>]+>/g, '');
    }


    function yarxiBlitz() {
        var date = new Date();
        this.yarxiBlitzId = 'yarxi_blitz_' + date.getTime();
        this.location = {
            left: null,
            top: null
        };
        this.block = undefined;
    }

    yarxiBlitz.prototype = {
        yarxiResource: 'http://yarxi.ru/tsearch.php',

        files: {
            'yarxi.css': chrome.extension.getURL('yarxi.css'),
            'yarxi.original.css': chrome.extension.getURL('yarxi.original.css'),
            'img/dia.png': chrome.extension.getURL('img/dia.png'),
            'img/one.png': chrome.extension.getURL('img/one.png'),
            'img/shim.gif': chrome.extension.getURL('img/shim.gif'),
            'img/tarr.png': chrome.extension.getURL('img/tarr.png'),
            'img/tri.png': chrome.extension.getURL('img/tri.png')
        },

        views: {
            kanjilist: function (responseText, self) {
                return transformKanjiLinks(responseText);
            },
            kanji: function (responseText, self) {
                return transformKanjiLinks(responseText)
                    .replace(/(img\/\w+\.png)/g, function (match) { return self.files[match] });
            },
            word: function (responseText, self) {
                return transformKanjiLinks(responseText);
            },
            error: function (responseText, self) {
                return responseText;
            }
        },

        codeToView: {
            S: 'kanjilist',
            E: 'kanji',
            T: 'word',
            A: 'error'
        },

        create: function () {
            this.block = document.createElement('div');
            this.block.style.position = 'absolute';
            this.block.style.left = px(-1000);
            this.block.style.top = px(-1000);
            this.block.style.width = px(300);
            this.block.style.maxHeight = px(400);
            this.block.style.overflowY = 'auto';
            this.block.className = 'yarxi_blitz';
            return this;
        },

        render: function (code, html) {
            var viewName = this.codeToView[code];
            this.block.className = 'yarxi_blitz yarxi_blitz-' + viewName;
            this.block.innerHTML = this.views[viewName](html, this);
            return this;
        },

        show: function (newLocation) {
            var location = newLocation || location;
            this.block.style.left = px(location.left);
            this.block.style.top = px(location.top);
        },

        hide: function () {
            this.block.style.left = px(-1000);
            this.block.style.top = px(-1000);
        },

        injected: function () {
            return this.block !== undefined;
        },

        block: function() {
            return this.block;
        },

        visible: function() {
            return this.block.style.left !== px(-1000);
        },

        inject: function () {
            var shadowRoot,
                shadowHost,
                shadowStyle;

            shadowHost = document.createElement('div');
            shadowHost.id = this.yarxiBlitzId;
            document.querySelector("body").appendChild(shadowHost);
            shadowRoot = shadowHost.createShadowRoot();

            shadowStyle = document.createElement('style');
            shadowStyle.innerHTML = "@import url('" + this.files['yarxi.css'] + "');"
                                  + "@import url('" + this.files['yarxi.original.css'] + "');";
            shadowRoot.appendChild(shadowStyle);
            this.create();
            shadowRoot.appendChild(this.block);
        },

        request: function(text) {
            var xhr = new XMLHttpRequest(),
                self = this;
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    self.render(xhr.responseText.substring(0, 1), xhr.responseText.substring(1))
                        .show(location);
                }
            }
            xhr.open("POST", self.yarxiResource.replace('%s', text), true);
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send('R=' + text + '&M=&Src=bytext');
        },

        delegateKanjiLinks: function () {
            var self = this;
            self.block.addEventListener('click', function (event) {
                var target = event.target,
                    link;

                while (target !== self.block) {
                    if (target.className && target.className === 'kanji') {
                        self.request(target.getAttribute('moveto'));
                        return;
                    }
                    target = target.parentNode;
                }
            });
        }
    };

    var YB = new yarxiBlitz();

    document.querySelector("body").addEventListener('click', function (event) {
        var externalBlock = document.getElementById(YB.yarxiBlitzId);
        if (externalBlock && !externalBlock.contains(event.target)
                && YB.injected() && YB.visible()) {
            YB.hide();
        }
    });

    document.querySelector("body").addEventListener('keypress', function (event) {
        if (event.keyCode === 116 || event.keyCode === 1077) {
            if (!YB.injected()) {
                YB.inject();
                YB.delegateKanjiLinks();
            }

            var selection = window.getSelection(),
                rect = selection.getRangeAt(0).getBoundingClientRect();
                text = selection.toString();

            location.left = rect.left + rect.width;
            location.top = rect.top

            if (text && text.length <= 15) {
                YB.request(text);
            }

        } else {
            if (YB.injected() && (!event.target.id || event.target.id !== YB.yarxiBlitzId)) {
                YB.hide();
            }
        }
    });
})();
