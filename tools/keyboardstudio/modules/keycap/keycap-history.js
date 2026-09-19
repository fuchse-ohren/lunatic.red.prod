function cloneState(state) {
    return JSON.parse(JSON.stringify(state));
}

export function createHistoryManager(initialState, {
    maxLength = 50,
    onChange = null,
    onUpdateButtons = null
} = {}) {
    const history = [cloneState(initialState)];
    let historyIndex = 0;

    function notifyButtons() {
        if (typeof onUpdateButtons === 'function') onUpdateButtons();
    }

    function commit(currentState) {
        if (historyIndex < history.length - 1) history.splice(historyIndex + 1);
        history.push(cloneState(currentState));
        historyIndex++;

        if (history.length > maxLength) {
            history.shift();
            historyIndex--;
        }

        notifyButtons();
    }

    function undo() {
        if (historyIndex <= 0) return false;

        historyIndex--;
        if (typeof onChange === 'function') onChange(cloneState(history[historyIndex]));
        notifyButtons();
        return true;
    }

    function redo() {
        if (historyIndex >= history.length - 1) return false;

        historyIndex++;
        if (typeof onChange === 'function') onChange(cloneState(history[historyIndex]));
        notifyButtons();
        return true;
    }

    function replaceLatest(currentState) {
        if (history.length === 0) return;
        history[history.length - 1] = cloneState(currentState);
        if (historyIndex >= history.length) historyIndex = history.length - 1;
        notifyButtons();
    }

    return {
        history,
        commit,
        undo,
        redo,
        replaceLatest,
        canUndo: () => historyIndex > 0,
        canRedo: () => historyIndex < history.length - 1,
        getIndex: () => historyIndex
    };
}
