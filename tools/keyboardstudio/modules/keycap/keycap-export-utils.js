export function saveBlob(blob, name) {
    if (window._slicerExportPending) {
        window._slicerExportBlob = blob;
        window._slicerExportName = name;
        return;
    }

    if (typeof saveAs !== 'undefined') {
        saveAs(blob, name);
        return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
