const { pdfjsLib } = globalThis;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfDoc = null;
let pageNum = 1;
let pageRendering = false;
let pageNumPending = null;
let hideTimer = null;

const canvas = document.getElementById('pdf-canvas');
const ctx = canvas.getContext('2d');
const progressBar = document.getElementById('progress-bar');
const controlsOverlay = document.getElementById('controls-overlay');

function getFileNameFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const fileName = params.get('file');
    return fileName ? decodeURIComponent(fileName) : null;
}

function showControls() {
    controlsOverlay.classList.remove('hidden');
    document.body.style.cursor = '';
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        controlsOverlay.classList.add('hidden');
        document.body.style.cursor = 'none';
    }, 3000);
}

async function renderPage(num) {
    pageRendering = true;

    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: 1 });
    const wrapper = document.getElementById('canvas-wrapper');
    const finalScale = Math.min(wrapper.clientWidth / viewport.width, wrapper.clientHeight / viewport.height) * 0.95;

    // 캔버스 해상도를 2배로 렌더링 후 CSS로 절반 크기 표시 (고DPI 대응)
    const scaledViewport = page.getViewport({ scale: finalScale * 2 });
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    canvas.style.width = (scaledViewport.width / 2) + 'px';
    canvas.style.height = (scaledViewport.height / 2) + 'px';

    try {
        await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;
        pageRendering = false;
        if (pageNumPending !== null) {
            renderPage(pageNumPending);
            pageNumPending = null;
        }
    } catch (error) {
        console.error('Render error:', error);
        pageRendering = false;
    }

    document.getElementById('page-num').textContent = num;
    progressBar.style.width = (num / pdfDoc.numPages * 100) + '%';
}

function queueRenderPage(num) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onPrevPage() {
    if (pageNum <= 1) return;
    pageNum--;
    queueRenderPage(pageNum);
}

function onNextPage() {
    if (pageNum >= pdfDoc.numPages) return;
    pageNum++;
    queueRenderPage(pageNum);
}

document.getElementById('prev-page').addEventListener('click', onPrevPage);
document.getElementById('next-page').addEventListener('click', onNextPage);

window.addEventListener('mousemove', showControls);
window.addEventListener('mousedown', showControls);

window.addEventListener('keydown', (e) => {
    showControls();
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        onPrevPage();
    } else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        onNextPage();
    } else if (e.key === 'f' || e.key === 'F') {
        toggleFullScreen();
    } else if (e.key === 'Escape' && !document.fullscreenElement) {
        location.href = 'index.html';
    }
});

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

document.getElementById('fullscreen-btn').addEventListener('click', toggleFullScreen);

window.addEventListener('resize', () => {
    if (pdfDoc) queueRenderPage(pageNum);
});

async function init() {
    const fileName = getFileNameFromUrl();
    if (!fileName) {
        alert('파일을 찾을 수 없습니다.');
        location.href = 'index.html';
        return;
    }

    document.title = `${fileName} - Presentation`;
    showControls();

    try {
        pdfDoc = await pdfjsLib.getDocument(`pdfs/${fileName}`).promise;
        document.getElementById('page-count').textContent = pdfDoc.numPages;
        document.getElementById('loading-overlay').style.display = 'none';
        renderPage(pageNum);
    } catch (error) {
        console.error('Error loading PDF:', error);
        alert('PDF를 불러오는 중 오류가 발생했습니다.');
        location.href = 'index.html';
    }
}

init();
