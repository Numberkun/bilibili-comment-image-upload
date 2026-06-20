// ==UserScript==
// @name         B站评论区增强图片上传
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  点击评论图片按钮弹出上传窗口，支持拖拽、粘贴(Ctrl+V)、选择图片，复用B站原有上传接口
// @author       Akasashic
// @contributor  DeepSeek V4 Pro
// @license      MIT
// @match        https://www.bilibili.com/video/*
// @match        https://www.bilibili.com/bangumi/play/*
// @match        https://www.bilibili.com/list/*
// @icon         https://www.bilibili.com/favicon.ico
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // ==================== 样式注入 ====================
    GM_addStyle(`
.bili-img-upload-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:100000;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","PingFang SC","Microsoft YaHei",sans-serif}
.bili-img-upload-modal{background:#fff;border-radius:12px;width:480px;max-width:90vw;box-shadow:0 8px 32px rgba(0,0,0,0.2);overflow:hidden}
.bili-img-upload-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #e8e8e8}
.bili-img-upload-header h2{margin:0;font-size:16px;font-weight:600;color:#18191c}
.bili-img-upload-close{cursor:pointer;border:none;background:none;padding:6px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#9499a0;transition:all .2s;line-height:0}
.bili-img-upload-close:hover{background:#f1f2f3;color:#18191c}
.bili-img-upload-body{padding:24px 20px}
.bili-img-upload-dropzone{border:2px dashed #c9ccd0;border-radius:12px;padding:40px 20px;text-align:center;transition:all .2s;cursor:pointer;background:#f9f9fa;min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;outline:none}
.bili-img-upload-dropzone.drag-over{border-color:#00aeec;background:#e8f7fd}
.bili-img-upload-dropzone.has-image{border-style:solid;border-color:#00aeec;padding:8px}
.bili-img-upload-dropzone-img{margin-bottom:12px;pointer-events:none}
.bili-img-upload-dropzone-text{color:#61666d;font-size:14px;line-height:1.8}
.bili-img-upload-select{color:#00aeec;cursor:pointer;font-weight:500}
.bili-img-upload-select:hover{text-decoration:underline}
.bili-img-upload-dropzone-sub{color:#9499a0;font-size:12px;margin-top:6px}
.bili-img-upload-preview{max-width:100%;max-height:220px;border-radius:8px;object-fit:contain}
.bili-img-upload-preview-wrap{position:relative;display:inline-block}
.bili-img-upload-remove{position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#ff4d4f;color:#fff;border:none;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;line-height:1;padding:0}
.bili-img-upload-remove:hover{background:#e04343}
.bili-img-upload-error{color:#ff4d4f;font-size:12px;margin-top:8px;text-align:center;display:none}
.bili-img-upload-confirm-hint{text-align:center;margin-top:12px}
.bili-img-upload-confirm-hint span{color:#9499a0;font-size:12px}
.bili-img-upload-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid #e8e8e8}
.bili-img-upload-cancel,.bili-img-upload-confirm{padding:6px 16px;border-radius:6px;cursor:pointer;font-size:13px}
.bili-img-upload-cancel{border:1px solid #c9ccd0;background:#fff;color:#61666d}
.bili-img-upload-cancel:hover{background:#f1f2f3}
.bili-img-upload-confirm{border:none;background:#00aeec;color:#fff;font-weight:500}
.bili-img-upload-confirm:hover{background:#009fd4}
.bili-img-preview-item{display:flex;align-items:center;gap:10px;padding:8px 10px;background:#f5f5f5;border-radius:8px;margin-bottom:6px}
.bili-img-preview-item img{width:56px;height:56px;border-radius:6px;object-fit:cover;flex-shrink:0}
.bili-img-preview-name{flex:1;font-size:13px;color:#333;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bili-img-preview-remove{width:24px;height:24px;border:none;background:#e0e0e0;border-radius:50%;cursor:pointer;font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center;flex-shrink:0;padding:0;color:#666}
.bili-img-preview-remove:hover{background:#ff4d4f;color:#fff}
.bili-img-preview-add{text-align:center;padding:10px;border:1px dashed #c9ccd0;border-radius:8px;cursor:pointer;color:#00aeec;font-size:13px;margin-top:4px}
.bili-img-preview-add:hover{background:#e8f7fd;border-color:#00aeec}
.bili-img-preview-grid{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-start}
.bili-img-preview-card{position:relative;width:80px;flex-shrink:0}
.bili-img-preview-card img{width:80px;height:80px;border-radius:8px;object-fit:cover;display:block}
.bili-img-preview-card .card-remove{position:absolute;top:-6px;right:-6px;width:20px;height:20px;background:rgba(0,0,0,0.65);border:none;border-radius:50%;cursor:pointer;color:#fff;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0}
.bili-img-preview-card .card-remove:hover{background:#ff4d4f}
.bili-img-preview-card .card-name{font-size:10px;color:#9499a0;text-align:center;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:80px}
`);

    // ==================== 常量 ====================
    var uploadIconSvg = '<svg width="59" height="45" viewBox="0 0 59 45" fill="none" xmlns="http://www.w3.org/2000/svg">'
        + '<path d="M40.333 13.747H1.583v29.708h38.75V13.747z" stroke="#9499A0" stroke-width="2" fill="none"/>'
        + '<path d="M19.667 30.253h38.75V.545H19.667v29.708z" fill="#AECBFA"/>'
        + '<path d="M19.667 21.843v8.41h38.75v-10.512l-8.75-7.334a5.23 5.23 0 00-3.673-1.305 5.23 5.23 0 00-3.673 1.478l-8.838 8.212-5-3.537a4.71 4.71 0 00-3.035-1.024 4.71 4.71 0 00-2.202.626l-4.2 4.193z" fill="#669DF6"/>'
        + '<circle cx="30.006" cy="9.814" r="3.125" fill="#E8F0FE"/></svg>';

    // ==================== 工具 ====================
    function isImageFile(file) { return file && file.type.startsWith('image/'); }

    // 只在单个 commentBox 的 shadowRoot 内查找图片按钮，不做全 DOM 遍历
    function getImageButton(commentBoxEl) {
        if (!commentBoxEl || !commentBoxEl.shadowRoot) return null;
        var icon = commentBoxEl.shadowRoot.querySelector('bili-icon[icon="BDC/image_line/3"]');
        return icon ? icon.closest('button') : null;
    }

    // ==================== 弹窗 ====================
    var currentFiles = [];
    var TOTAL_LIMIT = 9;
    var currentLimit = TOTAL_LIMIT; // 每次打开弹窗时根据已上传数重新计算

    // 查询 B站已上传的图片数量
    function getExistingPicCount(commentBoxEl) {
        if (!commentBoxEl || !commentBoxEl.shadowRoot) return 0;
        var pu = commentBoxEl.shadowRoot.querySelector('bili-comment-pictures-upload');
        if (!pu || !pu.shadowRoot) return 0;
        var content = pu.shadowRoot.querySelector('#content');
        if (!content) return 0;
        // 统计缩略图子元素（排除 slide-btn 等非图片元素，图片以 bili-comment-picture-item 或类似形式存在）
        var items = content.querySelectorAll('bili-comment-picture-item, .picture-item, [class*="picture"], [class*="image"]');
        if (items.length === 0) {
            // 回退：直接数 content 的直接子元素
            items = content.children;
        }
        return items.length;
    }

    function createOverlay(commentBoxEl) {
        var existing = document.querySelector('.bili-img-upload-overlay');
        if (existing) existing.remove();
        currentFiles = [];
        currentLimit = TOTAL_LIMIT - getExistingPicCount(commentBoxEl);
        if (currentLimit <= 0) currentLimit = 0;

        var existingCount = TOTAL_LIMIT - currentLimit;
        var hintHtml = currentLimit <= 0
            ? '<span style="color:#ff4d4f">已达到 ' + TOTAL_LIMIT + ' 张上限，无法继续添加</span>'
            : '<span>已选 <b class="bili-img-count">0</b> 张'
                + (existingCount > 0 ? ' | 已有 ' + existingCount + ' 张' : '')
                + ' | 还可添加 <b>' + currentLimit + '</b> 张</span>';

        var overlay = document.createElement('div');
        overlay.className = 'bili-img-upload-overlay';
        overlay.innerHTML = ''
            + '<div class="bili-img-upload-modal">'
            + '<div class="bili-img-upload-header"><h2>上传图片</h2>'
            + '<button class="bili-img-upload-close" title="关闭"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>'
            + '</div>'
            + '<div class="bili-img-upload-body">'
            + '<div class="bili-img-upload-dropzone" tabindex="0">'
            + renderDropzoneContent()
            + '</div>'
            + '<div class="bili-img-upload-error"></div>'
            + '<div class="bili-img-upload-confirm-hint">' + hintHtml + '</div>'
            + '<div class="bili-img-upload-actions">'
            + '<button class="bili-img-upload-cancel">取消</button>'
            + '<button class="bili-img-upload-confirm"' + (currentLimit <= 0 ? ' disabled' : '') + '>上传</button>'
            + '</div></div></div>';
        document.body.appendChild(overlay);

        var dropzone = overlay.querySelector('.bili-img-upload-dropzone');
        var errorDiv = overlay.querySelector('.bili-img-upload-error');

        function showError(msg) { errorDiv.textContent = msg; errorDiv.style.display = 'block'; }
        function hideError() { errorDiv.style.display = 'none'; }
        function updateCount() {
            var cnt = overlay.querySelector('.bili-img-count');
            if (cnt) cnt.textContent = currentFiles.length;
        }

        function truncName(name, max) {
            max = max || 20;
            if (name.length <= max) return name;
            var ext = name.lastIndexOf('.');
            var suffix = ext > 0 ? name.substring(ext) : '';
            var base = ext > 0 ? name.substring(0, ext) : name;
            return base.substring(0, max - suffix.length - 3) + '...' + suffix;
        }

        function renderDropzoneContent() {
            if (currentFiles.length === 0) {
                return '<div class="bili-img-upload-dropzone-img">' + uploadIconSvg + '</div>'
                    + '<div class="bili-img-upload-dropzone-text">将图片放到此处或<br><span class="bili-img-upload-select">选择图片</span></div>'
                    + '<div class="bili-img-upload-dropzone-sub">支持 JPG、PNG、WEBP、BMP、GIF，大小不超过 20MB</div>';
            }
            var html = '<div class="bili-img-preview-grid">';
            for (var f = 0; f < currentFiles.length; f++) {
                var url = URL.createObjectURL(currentFiles[f]);
                html += '<div class="bili-img-preview-card">'
                    + '<img src="' + url + '" alt=""/>'
                    + '<button class="card-remove" data-idx="' + f + '">&times;</button>'
                    + '<div class="card-name" title="' + currentFiles[f].name + '">' + truncName(currentFiles[f].name, 16) + '</div>'
                    + '</div>';
            }
            html += '</div>';
            html += '<div class="bili-img-preview-add"><span>+ 添加更多</span></div>';
            return html;
        }

        function rebindDropzone() {
            var removes = dropzone.querySelectorAll('.card-remove');
            for (var r = 0; r < removes.length; r++) {
                removes[r].addEventListener('click', function (e) {
                    e.stopPropagation();
                    var idx = parseInt(this.getAttribute('data-idx'));
                    currentFiles.splice(idx, 1);
                    refreshUI();
                });
            }
            // 添加更多
            var addBtn = dropzone.querySelector('.bili-img-preview-add');
            if (addBtn) {
                addBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    if (currentFiles.length >= currentLimit) { showError('最多只能上传 ' + currentLimit + ' 张图片'); return; }
                    openFilePicker();
                });
            }
            // 选择文字
            var sel = dropzone.querySelector('.bili-img-upload-select');
            if (sel) sel.addEventListener('click', function (e) { e.stopPropagation(); openFilePicker(); });
        }

        function refreshUI() {
            hideError();
            updateCount();
            dropzone.innerHTML = renderDropzoneContent();
            if (currentFiles.length > 0) dropzone.classList.add('has-image');
            else dropzone.classList.remove('has-image');
            rebindDropzone();
        }

        function addFiles(fileList) {
            hideError();
            var added = 0;
            for (var i = 0; i < fileList.length; i++) {
                var file = fileList[i];
                if (!file || !isImageFile(file)) continue;
                if (file.size > 20 * 1024 * 1024) { showError('图片 "' + file.name + '" 超过 20MB，已跳过'); continue; }
                if (currentFiles.length >= currentLimit) { showError('最多只能上传 ' + currentLimit + ' 张图片'); break; }
                currentFiles.push(file);
                added++;
            }
            if (added > 0 || currentFiles.length > 0) refreshUI();
        }

        function openFilePicker() {
            if (currentFiles.length >= currentLimit) { showError('最多只能上传 ' + currentLimit + ' 张图片'); return; }
            var input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'image/jpeg,image/png,image/webp,image/bmp,image/gif';
            input.addEventListener('change', function () {
                if (input.files.length > 0) addFiles(input.files);
            });
            input.click();
        }

        function onDocumentPaste(e) {
            if (!document.querySelector('.bili-img-upload-overlay')) { document.removeEventListener('paste', onDocumentPaste); return; }
            if (e.target.closest('[contenteditable="true"],input,textarea')) return;
            var imgFiles = [];
            for (var i = 0; i < e.clipboardData.items.length; i++) {
                if (e.clipboardData.items[i].type.startsWith('image/')) {
                    imgFiles.push(e.clipboardData.items[i].getAsFile());
                }
            }
            if (imgFiles.length > 0) { e.preventDefault(); addFiles(imgFiles); }
        }

        function onKeyDown(e) { if (e.key === 'Escape') destroy(); }

        function destroy() {
            document.removeEventListener('paste', onDocumentPaste);
            document.removeEventListener('keydown', onKeyDown);
            overlay.remove();
        }

        function doUpload() {
            if (currentFiles.length === 0) return;
            var confirmBtn = overlay.querySelector('.bili-img-upload-confirm');
            var cancelBtn = overlay.querySelector('.bili-img-upload-cancel');
            if (confirmBtn) { confirmBtn.disabled = true; }
            if (cancelBtn) { cancelBtn.disabled = true; }

            var total = currentFiles.length;
            var completed = 0;
            var failed = 0;

            function updateProgress() {
                if (confirmBtn) { confirmBtn.textContent = '上传中 ' + (completed + failed) + '/' + total; }
            }
            updateProgress();

            function finishBatch() {
                if (failed > 0) {
                    showError(failed + ' 张上传失败，' + completed + ' 张成功');
                    if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.textContent = '重试失败项'; }
                    if (cancelBtn) { cancelBtn.disabled = false; }
                } else {
                    destroy();
                }
            }

            function uploadNext() {
                if (currentFiles.length === 0) {
                    finishBatch();
                    return;
                }
                var file = currentFiles.shift();
                updateProgress();
                injectAndUpload(file, commentBoxEl, overlay, function (err) {
                    if (err) {
                        failed++;
                        currentFiles.unshift(file);
                        // 失败立即停止，不等后续文件，让用户看到错误后决定是否重试
                        finishBatch();
                    } else {
                        completed++;
                        // 成功则用 setTimeout 断掉同步递归链，防止多文件时栈溢出
                        if (currentFiles.length > 0) {
                            setTimeout(uploadNext, 50);
                        } else {
                            finishBatch();
                        }
                    }
                });
            }

            uploadNext();
        }

        document.addEventListener('paste', onDocumentPaste);
        document.addEventListener('keydown', onKeyDown);

        dropzone.addEventListener('click', function () {
            if (currentFiles.length === 0) openFilePicker();
        });
        dropzone.addEventListener('dragover', function (e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('drag-over'); });
        dropzone.addEventListener('dragleave', function (e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('drag-over'); });
        dropzone.addEventListener('drop', function (e) {
            e.preventDefault(); e.stopPropagation();
            dropzone.classList.remove('drag-over');
            if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
        });
        dropzone.addEventListener('paste', function (e) {
            var imgFiles = [];
            for (var i = 0; i < e.clipboardData.items.length; i++) {
                if (e.clipboardData.items[i].type.startsWith('image/')) {
                    imgFiles.push(e.clipboardData.items[i].getAsFile());
                }
            }
            if (imgFiles.length > 0) { e.preventDefault(); addFiles(imgFiles); }
        });
        dropzone.addEventListener('dblclick', function (e) { if (currentFiles.length > 0) { e.preventDefault(); e.stopPropagation(); doUpload(); } });
        overlay.querySelector('.bili-img-upload-close').addEventListener('click', destroy);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) destroy(); });
        overlay.querySelector('.bili-img-upload-cancel').addEventListener('click', destroy);
        overlay.querySelector('.bili-img-upload-confirm').addEventListener('click', doUpload);

        rebindDropzone();
        return overlay;
    }

    // ==================== 核心：劫持 input.click 注入文件到 B站上传管线 ====================
    var isUploading = false;
    var uploadInProgress = false;

    function getPicturesUpload(commentBoxEl) {
        if (!commentBoxEl || !commentBoxEl.shadowRoot) return null;
        return commentBoxEl.shadowRoot.querySelector('#editor bili-comment-pictures-upload')
            || commentBoxEl.shadowRoot.querySelector('bili-comment-pictures-upload');
    }

    function injectAndUpload(file, commentBoxEl, overlay, done) {
        if (uploadInProgress) { done('上一次上传还在处理中，请稍候'); return; }
        uploadInProgress = true;

        var picsUpload = getPicturesUpload(commentBoxEl);
        if (!picsUpload || !picsUpload.shadowRoot) {
            uploadInProgress = false;
            done('未找到图片上传组件，请先点击评论区输入框展开工具栏');
            return;
        }

        // 劫持 HTMLInputElement.click —— B站 picturesUpload.trigger() 内部调用 this.el.click()
        var origClick = HTMLInputElement.prototype.click;
        var injected = false;

        HTMLInputElement.prototype.click = function () {
            if (!injected && this.type === 'file') {
                injected = true;
                var dt = new DataTransfer();
                dt.items.add(file);
                // Chrome 允许通过 DataTransfer 给 input 赋值
                this.files = dt.files;
                this.dispatchEvent(new Event('change', { bubbles: true }));
                HTMLInputElement.prototype.click = origClick;
                return;
            }
            return origClick.call(this);
        };

        // 超时恢复
        var timeoutId = setTimeout(function () {
            if (!injected) {
                HTMLInputElement.prototype.click = origClick;
                uploadInProgress = false;
                done('上传超时，请重试');
            }
        }, 15000);

        // 监听 B站上传完成事件
        function onUploadDone() {
            clearTimeout(timeoutId);
            picsUpload.removeEventListener('change', onUploadDone);
            uploadInProgress = false;
            done(null);
        }
        picsUpload.addEventListener('change', onUploadDone);

        // 通过 trigger() 触发 B站上传流程
        // trigger() 内部: this.defer = wf(); this.el.click()
        // 我们的 prototype 劫持拦截 .click() 注入文件
        isUploading = true;
        if (typeof picsUpload.trigger === 'function') {
            picsUpload.trigger();
        } else {
            // 回退：点击图片按钮
            var imgBtn = getImageButton(commentBoxEl);
            if (imgBtn) imgBtn.click();
        }
        isUploading = false;

        // 如果 trigger 同步失败（未拦截到），原型劫持应该已被清除
        // 但万一 trigger 是同步的且没经过 file input click...
        if (!injected) {
            // 可能 trigger 的方式不同，等待超时处理
        }
    }

    // ==================== 劫持图片按钮 (轻量版) ====================
    var hijackedBtns = new WeakSet();
    var boxObservers = new WeakMap();

    function hijackButton(imgBtn, commentBoxEl) {
        if (hijackedBtns.has(imgBtn)) return;
        hijackedBtns.add(imgBtn);

        function intercept(e) {
            if (isUploading) return;
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            createOverlay(commentBoxEl);
        }
        imgBtn.addEventListener('click', intercept, true);
        imgBtn.addEventListener('pointerdown', intercept, true);
    }

    function setupBoxObserver(commentBoxEl) {
        if (!commentBoxEl || !commentBoxEl.shadowRoot) return;
        if (boxObservers.has(commentBoxEl)) return;

        // 立即劫持（如果按钮已存在）
        var btn = getImageButton(commentBoxEl);
        if (btn) hijackButton(btn, commentBoxEl);

        // 监听 shadowRoot 内的 childList + attributes
        // footer 可能：1) 尚未创建(childList)  2) 已创建但 hidden(class)  3) 已创建且可见
        var obs = new MutationObserver(function () {
            var btn2 = getImageButton(commentBoxEl);
            if (btn2) hijackButton(btn2, commentBoxEl);
        });

        obs.observe(commentBoxEl.shadowRoot, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class']
        });

        boxObservers.set(commentBoxEl, obs);
    }

    // ==================== 初始化 ====================
    var containerObserverSet = false;
    var initRetries = 0;
    var MAX_INIT_RETRIES = 8;

    function findAndSetupBoxes(root) {
        function walk(node) {
            if (!node) return;
            if (node.tagName === 'BILI-COMMENT-BOX') {
                setupBoxObserver(node);
                return; // 无需深入 comment-box 的 light DOM children
            }
            if (node.children) {
                for (var i = 0; i < node.children.length; i++) {
                    walk(node.children[i]);
                }
            }
            if (node.shadowRoot) {
                walk(node.shadowRoot);
            }
        }
        walk(root);
    }

    function tryInit() {
        var biliComments = document.querySelector('bili-comments');
        if (!biliComments || !biliComments.shadowRoot) {
            return false; // 容器还没加载
        }

        // 只设置一次容器级 observer
        if (!containerObserverSet) {
            containerObserverSet = true;
            new MutationObserver(function () {
                findAndSetupBoxes(biliComments.shadowRoot);
            }).observe(biliComments.shadowRoot, { childList: true, subtree: true });
        }

        // 穿透 shadow DOM 扫描
        findAndSetupBoxes(biliComments.shadowRoot);

        // 延迟重试：B站 lazy-load 可能异步渲染多层 shadow DOM
        // 内容可能在我们扫描后才完成渲染，需多次重试
        if (initRetries < MAX_INIT_RETRIES) {
            initRetries++;
            setTimeout(tryInit, 600 + initRetries * 400);
        }
        return true;
    }

    // bodyObserver：捕获动态插入的 bili-comments
    var bodyObserver = new MutationObserver(function (mutations) {
        for (var i = 0; i < mutations.length; i++) {
            var added = mutations[i].addedNodes;
            for (var j = 0; j < added.length; j++) {
                var node = added[j];
                if (node.nodeType !== 1) continue;
                if (node.tagName === 'BILI-COMMENTS' || (node.querySelector && node.querySelector('bili-comments'))) {
                    containerObserverSet = false;
                    initRetries = 0;
                    tryInit();
                    return;
                }
            }
        }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    // 首次尝试；如果失败（bili-comments 不在 DOM），等 bodyObserver
    if (!tryInit()) { /* 等待 bodyObserver */ }

    // SPA 导航
    var lastUrl = location.href;
    var origPushState = history.pushState;
    history.pushState = function () {
        origPushState.apply(this, arguments);
        lastUrl = location.href;
        containerObserverSet = false;
        initRetries = 0;
        setTimeout(tryInit, 1500);
    };
    var origReplaceState = history.replaceState;
    history.replaceState = function () {
        origReplaceState.apply(this, arguments);
        lastUrl = location.href;
        containerObserverSet = false;
        initRetries = 0;
        setTimeout(tryInit, 1500);
    };
    new MutationObserver(function () {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            containerObserverSet = false;
            initRetries = 0;
            setTimeout(tryInit, 1500);
        }
    }).observe(document.body, { childList: true, subtree: true });
})();
