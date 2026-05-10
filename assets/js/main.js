document.addEventListener('DOMContentLoaded', () => {
    const listElement = document.getElementById('pdf-list');

    async function loadPDFList() {
        try {
            // GitHub Actions에 의해 생성된 pdf-list.json 가져오기
            const response = await fetch('pdf-list.json');
            if (!response.ok) {
                throw new Error('목록을 가져오지 못했습니다. (pdf-list.json이 아직 생성되지 않았을 수 있습니다.)');
            }
            
            const pdfFiles = await response.json();
            listElement.innerHTML = '';

            if (pdfFiles.length === 0) {
                listElement.innerHTML = '<li class="empty">업로드된 PDF 파일이 없습니다.</li>';
                return;
            }

            pdfFiles.forEach(({ name, pages }) => {
                const li = document.createElement('li');
                li.className = 'pdf-item';

                const encodedName = encodeURIComponent(name);
                const pagesParam = pages ? `&pages=${pages}` : '';

                li.innerHTML = `
                    <a href="viewer.html?file=${encodedName}${pagesParam}">
                        <span class="pdf-icon">📄</span>
                        <span class="pdf-name"></span>
                    </a>
                `;
                li.querySelector('.pdf-name').textContent = name;
                listElement.appendChild(li);
            });
        } catch (error) {
            console.error('Error:', error);
            listElement.innerHTML = `<li class="error">오류 발생: ${error.message}</li>`;
        }
    }

    loadPDFList();
});
