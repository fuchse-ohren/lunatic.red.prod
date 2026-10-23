// Toast notification service extracted from keycap-app.js.
// 単一トーストとプログレスバー付きトースト (showProgressToast/update/hide) を管理。
// プログレスバー表示中は通常 toast を抑制 (重複防止)。

let progressToastElement = null;

function _container() {
    return document.getElementById('toast-container');
}

export function showToast(message, isError = false) {
    if (progressToastElement && !isError) return;
    const container = _container();
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast' + (isError ? ' error' : '');
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function showProgressToast(message, progress = 0) {
    const container = _container();
    if (!container) return null;
    if (progressToastElement) progressToastElement.remove();

    const toast = document.createElement('div');
    toast.className = 'toast progress-toast';
    toast.innerHTML = `
        <div class="progress-message">${message}</div>
        <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: ${progress}%"></div>
        </div>
        <div class="progress-percent">${Math.round(progress)}%</div>
    `;
    toast.style.cssText = `
        min-width: 280px;
        padding: 12px 16px;
    `;
    const barContainer = toast.querySelector('.progress-bar-container');
    barContainer.style.cssText = `
        width: 100%;
        height: 6px;
        background: rgba(255,255,255,0.2);
        border-radius: 3px;
        margin: 8px 0 4px 0;
        overflow: hidden;
    `;
    const barFill = toast.querySelector('.progress-bar-fill');
    barFill.style.cssText = `
        height: 100%;
        background: linear-gradient(90deg, #00bcd4, #4fc3f7);
        border-radius: 3px;
        transition: width 0.3s ease;
    `;
    const percentText = toast.querySelector('.progress-percent');
    percentText.style.cssText = `
        font-size: 0.75rem;
        opacity: 0.8;
        text-align: right;
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    progressToastElement = toast;
    return toast;
}

export function updateProgressToast(message, progress) {
    if (!progressToastElement) {
        showProgressToast(message, progress);
        return;
    }
    const msgEl = progressToastElement.querySelector('.progress-message');
    const barFill = progressToastElement.querySelector('.progress-bar-fill');
    const percentText = progressToastElement.querySelector('.progress-percent');
    if (msgEl) msgEl.textContent = message;
    if (barFill) barFill.style.width = `${progress}%`;
    if (percentText) percentText.textContent = `${Math.round(progress)}%`;
}

export function hideProgressToast(finalMessage = null, isError = false, delay = 1500) {
    if (!progressToastElement) return;
    if (finalMessage) {
        const msgEl = progressToastElement.querySelector('.progress-message');
        const barFill = progressToastElement.querySelector('.progress-bar-fill');
        const percentText = progressToastElement.querySelector('.progress-percent');
        if (msgEl) msgEl.textContent = finalMessage;
        if (barFill) {
            barFill.style.width = '100%';
            barFill.style.background = isError ? '#f44336' : '#4caf50';
        }
        if (percentText) percentText.textContent = isError ? '' : '';
    }
    setTimeout(() => {
        if (progressToastElement) {
            progressToastElement.classList.remove('show');
            setTimeout(() => {
                if (progressToastElement) {
                    progressToastElement.remove();
                    progressToastElement = null;
                }
            }, 300);
        }
    }, delay);
}
