const { pdfjsLib } = globalThis;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfDoc = null;
const rendered = new Set();

async function renderPage(num) {
    if (!pdfDoc || rendered.has(num) || num < 1 || num > pdfDoc.numPages) return;
    const canvas = document.getElementById('pdf-page-' + num);
    if (!canvas) return;
    rendered.add(num);

    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: 1 });
    const scale = Math.min(1280 / viewport.width, 720 / viewport.height);
    const scaledViewport = page.getViewport({ scale });
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 1280, 720);

    await page.render({
        canvasContext: ctx,
        viewport: scaledViewport,
        transform: [1, 0, 0, 1, (1280 - scaledViewport.width) / 2, (720 - scaledViewport.height) / 2]
    }).promise;
}

function getActiveIndex() {
    const container = document.getElementById(':$p');
    if (!container) return -1;
    const slides = container.querySelectorAll(':scope > svg[data-marpit-svg]');
    return [...slides].findIndex(s => s.classList.contains('bespoke-marp-active'));
}

async function init() {
    const params = new URLSearchParams(location.search);
    const view = params.get('view');

    // bespoke 서브뷰(overview 등)는 PDF 로드 불필요
    if (view) {
        document.getElementById('pdf-loading').style.display = 'none';
        return;
    }

    const fileName = params.get('file');

    if (!fileName) {
        alert('파일을 찾을 수 없습니다.');
        location.href = 'index.html';
        return;
    }

    document.title = decodeURIComponent(fileName) + ' - Presentation';

    try {
        pdfDoc = await pdfjsLib.getDocument('pdfs/' + fileName).promise;
    } catch (e) {
        console.error('PDF load error:', e);
        alert('PDF를 불러오는 중 오류가 발생했습니다.');
        location.href = 'index.html';
        return;
    }

    document.getElementById('pdf-loading').style.display = 'none';

    const idx = getActiveIndex();
    const startPage = idx >= 0 ? idx + 1 : 1;
    renderPage(startPage);
    renderPage(startPage + 1);

    const container = document.getElementById(':$p');
    if (container) {
        new MutationObserver(() => {
            const activeIdx = getActiveIndex();
            if (activeIdx >= 0) {
                renderPage(activeIdx + 1);
                renderPage(activeIdx + 2);
            }
        }).observe(container, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }
}

init();
