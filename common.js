/* ============================================================
   common.js — 公共脚本
   适用于：报文与物理层系列文档
   ============================================================ */

(function (window, document) {
    'use strict';

    // ============================
    // 1. 导航栏 (Nav Bar)
    // ============================

    /**
     * 页面导航配置列表
     * 在各页面中可通过 CommonNav.init(currentPage) 初始化
     */
    const NAV_PAGES = [
        { id: 'index',        label: '目录',            file: 'index.html' },
        { id: 'llr',          label: 'LLR',             file: 'llr_encoding.html' },
        { id: 'packet_66b',   label: '64/66B 报文演示',  file: 'packet_66B.html' },
        { id: 'flow',         label: '报文收发流程',      file: '报文收发链路层物理层标准处理流程.html' },
        { id: 'ipg_dic',      label: 'IPG 与 FCS',      file: 'IPG_DIC.html' },
    ];

    const CommonNav = {
        pages: NAV_PAGES,

        /**
         * 初始化导航栏
         * @param {string} currentPageId - 当前页面ID（如 'llr', 'packet_66b'）
         * @param {Array} [extraPages] - 额外页面列表，合并到 NAV_PAGES 后面
         */
        init(currentPageId, extraPages) {
            const allPages = extraPages
                ? [...this.pages, ...extraPages]
                : this.pages;

            // 查找或创建 nav-bar
            let navBar = document.querySelector('.nav-bar');
            if (!navBar) {
                navBar = document.createElement('div');
                navBar.className = 'nav-bar';
                document.body.prepend(navBar);
            }

            // 返回目录按钮
            const backLink = document.createElement('a');
            backLink.className = 'nav-back';
            backLink.href = 'index.html';
            backLink.textContent = '← 返回目录';
            navBar.appendChild(backLink);

            // 下拉菜单
            const dropdown = document.createElement('div');
            dropdown.className = 'nav-dropdown';

            const dropdownBtn = document.createElement('button');
            dropdownBtn.className = 'nav-dropdown-btn';
            dropdownBtn.textContent = '其他页面 ▼';
            dropdown.appendChild(dropdownBtn);

            const dropdownContent = document.createElement('div');
            dropdownContent.className = 'nav-dropdown-content';

            allPages.forEach(page => {
                const a = document.createElement('a');
                a.href = page.file;
                a.textContent = page.label;
                if (page.id === currentPageId) {
                    a.style.color = 'var(--accent-cyan)';
                    a.style.fontWeight = '600';
                }
                dropdownContent.appendChild(a);
            });

            dropdown.appendChild(dropdownContent);
            navBar.appendChild(dropdown);

            // 点击切换下拉
            dropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownContent.classList.toggle('show');
            });
            document.addEventListener('click', () => {
                dropdownContent.classList.remove('show');
            });
        }
    };

    // ============================
    // 2. Tab 切换
    // ============================

    const CommonTabs = {
        /**
         * 初始化 Tab 切换功能
         * @param {string} containerSelector - Tab 容器选择器
         * @param {Object} [options]
         * @param {string} [options.btnSelector='.tab-btn'] - Tab 按钮选择器
         * @param {string} [options.contentSelector='.tab-content'] - Tab 内容选择器
         * @param {string} [options.activeClass='active']
         * @param {Function} [options.onSwitch] - 切换回调 (tabId, btnEl, contentEl)
         */
        init(containerSelector, options = {}) {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            const btnSelector = options.btnSelector || '.tab-btn';
            const contentSelector = options.contentSelector || '.tab-content';
            const activeClass = options.activeClass || 'active';
            const onSwitch = options.onSwitch || null;

            const buttons = container.querySelectorAll(btnSelector);
            const contents = container.querySelectorAll(contentSelector);

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.dataset.tab || btn.dataset.target;

                    // 切换按钮高亮
                    buttons.forEach(b => b.classList.remove(activeClass));
                    btn.classList.add(activeClass);

                    // 切换内容显示
                    contents.forEach(c => {
                        if (c.id === targetId || c.dataset.tab === targetId) {
                            c.classList.add(activeClass);
                        } else {
                            c.classList.remove(activeClass);
                        }
                    });

                    if (onSwitch) {
                        const activeContent = container.querySelector(
                            `${contentSelector}.${activeClass}`
                        );
                        onSwitch(targetId, btn, activeContent);
                    }
                });
            });
        }
    };

    // ============================
    // 3. 动画控制器
    // ============================

    class AnimationController {
        /**
         * @param {Object} options
         * @param {Function} options.stepFn - 单步执行函数，返回 false 时停止
         * @param {number} [options.interval=1000] - 自动播放间隔 (ms)
         * @param {Function} [options.onReset] - 重置回调
         * @param {Function} [options.onComplete] - 完成回调
         */
        constructor(options) {
            this.stepFn = options.stepFn;
            this.interval = options.interval || 1000;
            this.onReset = options.onReset || null;
            this.onComplete = options.onComplete || null;
            this._timer = null;
            this._running = false;
            this._speedMultiplier = 1;
        }

        /** 执行单步 */
        step() {
            const result = this.stepFn();
            if (result === false && this._running) {
                this.stop();
                if (this.onComplete) this.onComplete();
            }
            return result;
        }

        /** 开始自动播放 */
        start() {
            if (this._running) return;
            this._running = true;
            this._tick();
        }

        /** 停止自动播放 */
        stop() {
            this._running = false;
            if (this._timer) {
                clearTimeout(this._timer);
                this._timer = null;
            }
        }

        /** 切换自动播放状态 */
        toggle() {
            this._running ? this.stop() : this.start();
        }

        /** 重置 */
        reset() {
            this.stop();
            if (this.onReset) this.onReset();
        }

        /** 设置速度倍率 */
        setSpeed(multiplier) {
            this._speedMultiplier = multiplier;
        }

        /** 设置间隔 */
        setInterval(ms) {
            this.interval = ms;
        }

        get isRunning() {
            return this._running;
        }

        _tick() {
            if (!this._running) return;
            const result = this.stepFn();
            if (result === false) {
                this._running = false;
                if (this.onComplete) this.onComplete();
                return;
            }
            const delay = this.interval / this._speedMultiplier;
            this._timer = setTimeout(() => this._tick(), delay);
        }
    }

    // ============================
    // 4. 66B Block 工具函数
    // ============================

    const Block66B = {
        /**
         * 创建 66B 块的 DOM 元素
         * @param {Object} block
         * @param {string} block.sync - '01' | '10'
         * @param {string} block.type - Block Type (e.g., '0x78')
         * @param {Array<string>} block.bytes - 7 or 8 data bytes (hex strings)
         * @param {Array<string>} [block.classes] - 每个字节的额外 CSS class
         * @param {string} [block.label] - 块标签
         * @returns {HTMLElement}
         */
        createBlockElement(block) {
            const el = document.createElement('div');
            el.className = 'block-66b';

            // Sync header
            const syncEl = document.createElement('span');
            syncEl.className = `sync-header sync-${block.sync}`;
            syncEl.textContent = block.sync;
            el.appendChild(syncEl);

            // Payload
            const payloadEl = document.createElement('span');
            payloadEl.className = 'block-payload';

            const bytes = block.bytes || [];
            const classes = block.classes || [];

            bytes.forEach((b, i) => {
                const byteEl = document.createElement('span');
                byteEl.className = 'block-byte';
                if (classes[i]) byteEl.classList.add(classes[i]);
                byteEl.textContent = b;
                payloadEl.appendChild(byteEl);
            });

            el.appendChild(payloadEl);

            if (block.label) {
                el.title = block.label;
            }

            return el;
        },

        /**
         * 生成 LLR-eligible Start Block 的字节数据
         * @param {number} frameSeq - 20-bit frame sequence number
         * @returns {Object} block description
         */
        eligibleStartBlock(frameSeq) {
            const seq = frameSeq & 0xFFFFF;
            const d1High = (seq >> 16) & 0xF;
            const d1 = (d1High << 4) | 0x7; // {seq[19:16], 0x7}
            const d2 = (seq >> 8) & 0xFF;
            const d3 = seq & 0xFF;

            return {
                sync: '10',
                type: '0x78',
                bytes: [
                    '78',
                    this._hex(d1), this._hex(d2), this._hex(d3),
                    '55', '55', '55', 'D5'
                ],
                classes: [
                    'byte-start', 'byte-seq', 'byte-seq', 'byte-seq',
                    'byte-preamble', 'byte-preamble', 'byte-preamble', 'byte-sfd'
                ],
                label: `Start (eligible) seq=0x${seq.toString(16).toUpperCase()}`
            };
        },

        /**
         * 生成 LLR-ineligible Start Block 的字节数据
         * @returns {Object} block description
         */
        ineligibleStartBlock() {
            return {
                sync: '10',
                type: '0x78',
                bytes: ['78', '55', '55', '55', '55', '55', '55', 'D5'],
                classes: [
                    'byte-start', 'byte-preamble', 'byte-preamble', 'byte-preamble',
                    'byte-preamble', 'byte-preamble', 'byte-preamble', 'byte-sfd'
                ],
                label: 'Start (ineligible)'
            };
        },

        /**
         * 生成 Data Block
         * @param {Array<string>} [dataBytes] - 8 hex strings
         * @returns {Object}
         */
        dataBlock(dataBytes) {
            const bytes = dataBytes || ['XX', 'XX', 'XX', 'XX', 'XX', 'XX', 'XX', 'XX'];
            return {
                sync: '01',
                bytes: bytes,
                classes: bytes.map(() => 'byte-data'),
                label: 'Data Block'
            };
        },

        /**
         * 生成 IDLE Block
         * @returns {Object}
         */
        idleBlock() {
            return {
                sync: '10',
                bytes: ['1E', '00', '00', '00', '00', '00', '00', '00'],
                classes: ['byte-ctrl', ...Array(7).fill('byte-idle')],
                label: 'IDLE Block'
            };
        },

        /**
         * 生成 Terminate Block
         * @param {number} termPos - /T/ position (0-7)
         * @returns {Object}
         */
        terminateBlock(termPos) {
            // Block type depends on /T/ position
            const blockTypes = ['0x87', '0x99', '0xAA', '0xB4', '0xCC', '0xD2', '0xE1', '0xFF'];
            return {
                sync: '10',
                bytes: [blockTypes[termPos] || '87', ...Array(7).fill('00')],
                classes: ['byte-term', ...Array(7).fill('byte-idle')],
                label: `Terminate (pos=${termPos})`
            };
        },

        /**
         * 生成 CtlOS Block (LLR ACK/NACK/INIT/INIT_ECHO)
         * @param {number} msgType - 0x01=ACK, 0x02=NACK, 0x03=INIT, 0x04=INIT_ECHO
         * @param {number} seq - 20-bit sequence number
         * @param {number} [initData=0] - 16-bit init data (for INIT/ECHO)
         * @returns {Object}
         */
        ctlosBlock(msgType, seq, initData = 0) {
            const s = seq & 0xFFFFF;
            const d2 = (s >> 12) & 0xFF;
            const d3 = (s >> 4) & 0xFF;
            const d4High = s & 0xF;
            const d4 = (d4High << 4) | 0x6; // O-code = 0x6
            const d5 = (initData >> 8) & 0xFF;
            const d6 = initData & 0xFF;

            const typeNames = {
                0x01: 'ACK', 0x02: 'NACK',
                0x03: 'INIT', 0x04: 'INIT_ECHO'
            };

            return {
                sync: '10',
                bytes: [
                    '4B',
                    this._hex(msgType),
                    this._hex(d2), this._hex(d3),
                    this._hex(d4),
                    this._hex(d5), this._hex(d6),
                    '00'
                ],
                classes: [
                    'byte-ctrl', 'byte-ocode', 'byte-seq', 'byte-seq',
                    'byte-ocode', 'byte-data', 'byte-data', 'byte-idle'
                ],
                label: `CtlOS ${typeNames[msgType] || '?'} seq=0x${s.toString(16)}`
            };
        },

        _hex(n) {
            return n.toString(16).toUpperCase().padStart(2, '0');
        }
    };

    // ============================
    // 5. DIC 计算器
    // ============================

    const DICCalculator = {
        /**
         * 计算 DIC (Deficit Idle Count) 补偿
         * @param {number} frameLength - 帧长度 (bytes, 含 Preamble+SFD+DA...+FCS)
         * @param {number} currentDIC - 当前 DIC 寄存器值 (0-3)
         * @param {number} [macIPG=12] - MAC 提供的 IPG 字节数
         * @returns {Object} { termPosition, deficit, newDIC, overflow, ipgAdjust, actualIPG }
         */
        calculate(frameLength, currentDIC, macIPG = 12) {
            // /T/ position = (frameLength + 4) % 4  (FCS 的对齐残余)
            // 简化计算：帧长度不含 preamble(8B)
            const totalWithoutPreamble = frameLength; // DA+SA+Type+Payload+FCS
            const termPosition = totalWithoutPreamble % 4;
            const deficit = termPosition; // 0, 1, 2, 3

            const newDICRaw = currentDIC + deficit;
            const overflow = newDICRaw >= 4;
            const newDIC = newDICRaw % 4;
            const ipgAdjust = overflow ? 4 : 0;
            const actualIPG = macIPG - deficit + ipgAdjust;

            return {
                termPosition,
                deficit,
                newDIC,
                overflow,
                ipgAdjust,
                actualIPG
            };
        }
    };

    // ============================
    // 6. 工具函数
    // ============================

    const Utils = {
        /**
         * 安全获取 DOM 元素
         * @param {string} selector
         * @returns {HTMLElement|null}
         */
        $(selector) {
            return document.querySelector(selector);
        },

        /**
         * 获取所有匹配的 DOM 元素
         * @param {string} selector
         * @returns {NodeList}
         */
        $$(selector) {
            return document.querySelectorAll(selector);
        },

        /**
         * 延迟执行
         * @param {number} ms
         * @returns {Promise}
         */
        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        /**
         * 十六进制格式化
         * @param {number} n
         * @param {number} [digits=2]
         * @returns {string}
         */
        hex(n, digits = 2) {
            return '0x' + (n >>> 0).toString(16).toUpperCase().padStart(digits, '0');
        },

        /**
         * 二进制格式化
         * @param {number} n
         * @param {number} [bits=8]
         * @returns {string}
         */
        bin(n, bits = 8) {
            return (n >>> 0).toString(2).padStart(bits, '0');
        },

        /**
         * 生成随机整数 [min, max]
         * @param {number} min
         * @param {number} max
         * @returns {number}
         */
        randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        /**
         * 生成随机 MAC 地址
         * @returns {string} e.g., "AA:BB:CC:DD:EE:FF"
         */
        randomMAC() {
            const bytes = Array.from({ length: 6 }, () =>
                Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
            );
            return bytes.join(':');
        },

        /**
         * 生成随机以太网帧数据（hex 字符串数组）
         * @param {number} length - 帧长度 (64-1518)
         * @returns {Array<string>}
         */
        randomFrameBytes(length) {
            return Array.from({ length }, () =>
                Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
            );
        },

        /**
         * 计算 Hamming 距离
         * @param {number} a
         * @param {number} b
         * @returns {number}
         */
        hammingDistance(a, b) {
            let xor = a ^ b;
            let count = 0;
            while (xor) {
                count += xor & 1;
                xor >>= 1;
            }
            return count;
        },

        /**
         * 平滑滚动到元素
         * @param {string|HTMLElement} target - 选择器或元素
         * @param {number} [offset=60] - 顶部偏移
         */
        scrollTo(target, offset = 60) {
            const el = typeof target === 'string'
                ? document.querySelector(target)
                : target;
            if (!el) return;
            const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: y, behavior: 'smooth' });
        },

        /**
         * 数字动画（从 from 到 to）
         * @param {HTMLElement} el
         * @param {number} from
         * @param {number} to
         * @param {number} [duration=500]
         * @param {string} [format='int'] - 'int' | 'float2'
         */
        animateNumber(el, from, to, duration = 500, format = 'int') {
            const startTime = performance.now();
            const update = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // ease-out
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = from + (to - from) * eased;
                if (format === 'float2') {
                    el.textContent = current.toFixed(2);
                } else {
                    el.textContent = Math.round(current);
                }
                if (progress < 1) requestAnimationFrame(update);
            };
            requestAnimationFrame(update);
        },

        /**
         * 高亮闪烁元素
         * @param {HTMLElement} el
         * @param {string} [color='rgba(100,255,218,0.3)']
         * @param {number} [duration=600]
         */
        flashHighlight(el, color = 'rgba(100,255,218,0.3)', duration = 600) {
            const original = el.style.backgroundColor;
            el.style.transition = `background-color ${duration / 2}ms ease`;
            el.style.backgroundColor = color;
            setTimeout(() => {
                el.style.backgroundColor = original;
                setTimeout(() => {
                    el.style.transition = '';
                }, duration / 2);
            }, duration / 2);
        },

        /**
         * 节流
         * @param {Function} fn
         * @param {number} limit
         * @returns {Function}
         */
        throttle(fn, limit) {
            let inThrottle = false;
            return function (...args) {
                if (!inThrottle) {
                    fn.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => (inThrottle = false), limit);
                }
            };
        },

        /**
         * 防抖
         * @param {Function} fn
         * @param {number} wait
         * @returns {Function}
         */
        debounce(fn, wait) {
            let timer = null;
            return function (...args) {
                clearTimeout(timer);
                timer = setTimeout(() => fn.apply(this, args), wait);
            };
        }
    };

    // ============================
    // 7. Modal 弹窗
    // ============================

    const Modal = {
        /**
         * 绑定 Modal 的打开/关闭逻辑
         * @param {string} overlaySelector - overlay 容器选择器
         * @param {string} [openBtnSelector] - 打开按钮选择器
         * @param {string} [closeBtnSelector='.modal-close'] - 关闭按钮选择器
         */
        bind(overlaySelector, openBtnSelector, closeBtnSelector = '.modal-close') {
            const overlay = document.querySelector(overlaySelector);
            if (!overlay) return;

            if (openBtnSelector) {
                document.querySelectorAll(openBtnSelector).forEach(btn => {
                    btn.addEventListener('click', () => overlay.classList.add('show'));
                });
            }

            overlay.querySelectorAll(closeBtnSelector).forEach(btn => {
                btn.addEventListener('click', () => overlay.classList.remove('show'));
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) overlay.classList.remove('show');
            });
        },

        /** 打开指定 modal */
        open(selector) {
            const el = document.querySelector(selector);
            if (el) el.classList.add('show');
        },

        /** 关闭指定 modal */
        close(selector) {
            const el = document.querySelector(selector);
            if (el) el.classList.remove('show');
        }
    };

    // ============================
    // 8. Intersection Observer (滚动动画)
    // ============================

    const ScrollAnimator = {
        /**
         * 初始化滚动进入动画
         * @param {string} [selector='.animate-on-scroll']
         * @param {Object} [options]
         */
        init(selector = '.animate-on-scroll', options = {}) {
            const threshold = options.threshold || 0.1;
            const animClass = options.animClass || 'animate-fadeInUp';

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add(animClass);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold });

            document.querySelectorAll(selector).forEach(el => {
                el.style.opacity = '0';
                observer.observe(el);
            });
        }
    };

    // ============================
    // 9. 键盘快捷键
    // ============================

    const Keyboard = {
        _handlers: {},

        /**
         * 注册键盘快捷键
         * @param {string} key - 键名 (e.g., 'Space', 'ArrowRight', 'r')
         * @param {Function} handler
         * @param {Object} [modifiers] - { ctrl, shift, alt }
         */
        on(key, handler, modifiers = {}) {
            const id = this._keyId(key, modifiers);
            this._handlers[id] = handler;
        },

        /** 移除快捷键 */
        off(key, modifiers = {}) {
            const id = this._keyId(key, modifiers);
            delete this._handlers[id];
        },

        /** 初始化键盘监听 */
        init() {
            document.addEventListener('keydown', (e) => {
                // 忽略输入框中的按键
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

                const modifiers = {
                    ctrl: e.ctrlKey || e.metaKey,
                    shift: e.shiftKey,
                    alt: e.altKey
                };
                const id = this._keyId(e.key, modifiers);

                if (this._handlers[id]) {
                    e.preventDefault();
                    this._handlers[id](e);
                }

                // 也尝试不带修饰符匹配 (用于简单快捷键)
                const simpleId = this._keyId(e.key, {});
                if (!this._handlers[id] && this._handlers[simpleId]) {
                    e.preventDefault();
                    this._handlers[simpleId](e);
                }
            });
        },

        _keyId(key, modifiers = {}) {
            const parts = [];
            if (modifiers.ctrl) parts.push('Ctrl');
            if (modifiers.shift) parts.push('Shift');
            if (modifiers.alt) parts.push('Alt');
            parts.push(key);
            return parts.join('+');
        }
    };

    // ============================
    // Export to global scope
    // ============================

    window.CommonNav = CommonNav;
    window.CommonTabs = CommonTabs;
    window.AnimationController = AnimationController;
    window.Block66B = Block66B;
    window.DICCalculator = DICCalculator;
    window.Utils = Utils;
    window.Modal = Modal;
    window.ScrollAnimator = ScrollAnimator;
    window.Keyboard = Keyboard;

})(window, document);