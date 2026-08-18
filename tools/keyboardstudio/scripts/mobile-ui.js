// Mobile-only UI wiring extracted from index.html.
        (function () {
            function isMobile() { return window.innerWidth <= 768; }
            if (!isMobile()) return;

            const panelOverlay = document.getElementById('mobile-panel-overlay');
            const settingsBtn = document.getElementById('mobile-nav-settings');
            const undoredoBtn = document.getElementById('mobile-nav-undoredo');
            const genModeBtn = document.getElementById('mobile-nav-genmode');
            const gumballBtn = document.getElementById('mobile-nav-gumball');
            const exportBtn = document.getElementById('mobile-nav-export');
            const searchToggle = document.getElementById('mobile-search-toggle');
            const searchBox = document.getElementById('mobile-search-box');
            const mobileSearchInput = document.getElementById('mobile-search-input');
            const pcSearchBox = document.getElementById('search-box');

            // 戻る/進むポップアップ
            const urPopup = document.getElementById('mobile-undoredo-popup');
            const mobileUndo = document.getElementById('mobile-undo');
            const mobileRedo = document.getElementById('mobile-redo');
            const pcUndo = document.getElementById('btn-undo');
            const pcRedo = document.getElementById('btn-redo');

            // ヒント無効化
            const hintToggle = document.getElementById('enable-hints');
            if (hintToggle) {
                hintToggle.checked = false;
                hintToggle.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // ================================================
            // モバイル用セクション非表示
            // 表示: sec-import, 直感操作, sec-svg, sec-color（AMS設定ボタン除外）
            // 非表示: sec-basic, sec-structure, sec-shape, sec-texture, sec-stem,
            //         sec-utility, sec-text, sec-preset, sec-export, sprue-kit, sec-batch
            // ================================================
            const normalContent = document.getElementById('normal-mode-content');
            if (normalContent) {
                const showSections = new Set(['sec-basic', 'sec-structure', 'sec-shape', 'sec-text', 'sec-svg', 'sec-color', 'sec-preset']);
                let currentSection = '';

                for (const child of normalContent.children) {
                    // H3ヘッダーでセクション切替
                    if (child.tagName === 'H3' && child.id) {
                        currentSection = child.id;
                        if (!showSections.has(currentSection)) {
                            child.classList.add('mobile-hide');
                            continue;
                        }
                        continue; // 表示セクションのH3は残す
                    }

                    // Import 3Dパネル → モバイルでは非表示
                    if (child.classList?.contains('v60-import-panel')) {
                        child.classList.add('mobile-hide');
                        continue;
                    }

                    // sec-color内の特定要素を非表示
                    if (currentSection === 'sec-color') {
                        // AMS設定ボタン
                        if (child.id === 'btn-ams-config') {
                            child.classList.add('mobile-hide');
                            continue;
                        }
                        // AMS JSON読み込みボタンの親div
                        if (child.querySelector?.('#btn-ams-import-json')) {
                            child.classList.add('mobile-hide');
                            continue;
                        }
                        // AMS登録ヒント文を非表示
                        child.querySelectorAll?.('p[data-i18n="ams_register_hint"], p[data-i18n="simple_ams_select"]')
                            .forEach(p => p.style.display = 'none');
                        continue; // 色パレット自体は表示
                    }

                    // section-sep → モバイルではすべて非表示（表示セクションは自然に並ぶ）
                    if (child.classList?.contains('section-sep')) {
                        child.classList.add('mobile-hide');
                        continue;
                    }

                    // 非表示セクションの子要素はすべて隠す
                    if (!showSections.has(currentSection)) {
                        child.classList.add('mobile-hide');
                    }
                }
            }

            // ================================================
            // セクションジャンプ絞り込み
            // ================================================
            setTimeout(() => {
                const secSelect = document.getElementById('section-select');
                if (secSelect) {
                    const keepSecs = new Set(['', 'sec-basic', 'sec-structure', 'sec-shape', 'sec-text', 'sec-svg', 'sec-color', 'sec-preset']);
                    Array.from(secSelect.options).forEach(opt => {
                        if (!keepSecs.has(opt.value)) opt.style.display = 'none';
                    });
                }
            }, 500);

            // 言語同期
            const mobileLangSelect = document.getElementById('mobile-language-select');
            const pcLangSelect = document.getElementById('language-select');
            if (mobileLangSelect && pcLangSelect) {
                mobileLangSelect.value = pcLangSelect.value;
                mobileLangSelect.addEventListener('change', () => {
                    pcLangSelect.value = mobileLangSelect.value;
                    pcLangSelect.dispatchEvent(new Event('change', { bubbles: true }));
                });
                pcLangSelect.addEventListener('change', () => {
                    mobileLangSelect.value = pcLangSelect.value;
                });
            }

            // --- 設定パネル ---
            function closePanel() {
                document.body.classList.remove('mobile-panel-open');
                settingsBtn.classList.remove('active');
                setTimeout(() => window.dispatchEvent(new Event('resize')), 350);
            }
            settingsBtn.addEventListener('click', () => {
                closeUndoRedo();
                document.body.classList.toggle('mobile-panel-open');
                settingsBtn.classList.toggle('active', document.body.classList.contains('mobile-panel-open'));
                setTimeout(() => window.dispatchEvent(new Event('resize')), 350);
            });
            panelOverlay.addEventListener('click', closePanel);

            // --- 戻る/進むポップアップ ---
            function syncUndoRedoState() {
                if (pcUndo) mobileUndo.disabled = pcUndo.disabled;
                if (pcRedo) mobileRedo.disabled = pcRedo.disabled;
            }
            function openUndoRedo() {
                syncUndoRedoState();
                urPopup.style.display = 'flex';
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => urPopup.classList.add('open'));
                });
                undoredoBtn.classList.add('active');
            }
            function closeUndoRedo() {
                urPopup.classList.remove('open');
                undoredoBtn.classList.remove('active');
                setTimeout(() => {
                    if (!urPopup.classList.contains('open')) urPopup.style.display = 'none';
                }, 300);
            }

            undoredoBtn.addEventListener('click', () => {
                if (urPopup.classList.contains('open')) {
                    closeUndoRedo();
                } else {
                    closePanel();
                    openUndoRedo();
                }
            });

            mobileUndo.addEventListener('click', () => {
                if (pcUndo && !pcUndo.disabled) pcUndo.click();
                setTimeout(syncUndoRedoState, 50);
            });
            mobileRedo.addEventListener('click', () => {
                if (pcRedo && !pcRedo.disabled) pcRedo.click();
                setTimeout(syncUndoRedoState, 50);
            });

            // PC側のundo/redoボタンのdisabled変化を監視
            if (pcUndo) {
                new MutationObserver(syncUndoRedoState)
                    .observe(pcUndo, { attributes: true, attributeFilter: ['disabled'] });
            }
            if (pcRedo) {
                new MutationObserver(syncUndoRedoState)
                    .observe(pcRedo, { attributes: true, attributeFilter: ['disabled'] });
            }

            // 画面タップでポップアップを閉じる
            document.addEventListener('click', (e) => {
                if (urPopup.classList.contains('open') &&
                    !e.target.closest('#mobile-undoredo-popup') &&
                    !e.target.closest('#mobile-nav-undoredo')) {
                    closeUndoRedo();
                }
            });

            // --- 生成モード ---
            const gmPopup = document.getElementById('mobile-genmode-popup');
            const gmTargetSel = document.getElementById('mobile-genmode-target');
            const gmModeSel = document.getElementById('mobile-genmode-mode');
            const modeSelectMap = { text: 'text-mode', text2: 'text2-mode', side: 'side-mode', svg: 'svg-mode' };

            function syncGenModeFromPC() {
                const pcSel = document.getElementById(modeSelectMap[gmTargetSel.value]);
                if (pcSel) gmModeSel.value = pcSel.value;
            }
            function closeGenMode() {
                gmPopup.classList.remove('open');
                genModeBtn.classList.remove('active');
                setTimeout(() => { if (!gmPopup.classList.contains('open')) gmPopup.style.display = 'none'; }, 250);
            }
            genModeBtn.addEventListener('click', () => {
                if (gmPopup.classList.contains('open')) { closeGenMode(); return; }
                closePanel(); closeUndoRedo();
                syncGenModeFromPC();
                gmPopup.style.display = 'block';
                requestAnimationFrame(() => requestAnimationFrame(() => gmPopup.classList.add('open')));
                genModeBtn.classList.add('active');
            });
            gmTargetSel.addEventListener('change', syncGenModeFromPC);
            gmModeSel.addEventListener('change', () => {
                const pcSel = document.getElementById(modeSelectMap[gmTargetSel.value]);
                if (pcSel) { pcSel.value = gmModeSel.value; pcSel.dispatchEvent(new Event('change', { bubbles: true })); }
            });
            document.addEventListener('click', (e) => {
                if (gmPopup.classList.contains('open') &&
                    !e.target.closest('#mobile-genmode-popup') &&
                    !e.target.closest('#mobile-nav-genmode')) { closeGenMode(); }
            });

            // --- ガムボール ---
            gumballBtn.addEventListener('click', () => {
                document.getElementById('hud-gumball-toggle')?.click();
                gumballBtn.classList.toggle('active');
            });

            // --- エクスポート ---
            exportBtn.addEventListener('click', () => {
                closePanel();
                closeUndoRedo();
                document.getElementById('btn-export-single')?.click();
            });

            // --- 検索 ---
            searchToggle.addEventListener('click', () => {
                searchBox.classList.toggle('open');
                if (searchBox.classList.contains('open')) mobileSearchInput.focus();
            });
            mobileSearchInput.addEventListener('input', () => {
                if (pcSearchBox) {
                    pcSearchBox.value = mobileSearchInput.value;
                    pcSearchBox.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
            document.addEventListener('click', (e) => {
                if (!e.target.closest('#mobile-search-box') &&
                    !e.target.closest('#mobile-search-toggle') &&
                    searchBox.classList.contains('open')) {
                    searchBox.classList.remove('open');
                }
            });

            // 画面回転
            window.addEventListener('resize', () => {
                if (!isMobile()) {
                    document.body.classList.remove('mobile-panel-open');
                    closeUndoRedo();
                }
            });
        })();