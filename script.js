// --- 💡 탭 전환 로직 ---
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetContentId = tab.dataset.tab + '-content';
            document.getElementById(targetContentId).classList.add('active');
        });
    });

    // 데이터 로딩 함수들 호출
    fetchAnalysisReport();
    fetchKoreanNews();
    fetchEnglishNews();
});


// --- ✨ AI 분석 보고서 가져오기 함수 (구조 분석 로직으로 대폭 수정) ---
async function fetchAnalysisReport() {
    const reportContainer = document.getElementById('analysis-report-container');
    const reportUrl = 'https://raw.githubusercontent.com/jglsnu12/k_titan/main/final_analysis_report.txt';

    try {
        const response = await fetch(reportUrl);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        const reportText = await response.text();

        // --- ✨ 새로운 지능형 파싱 로직 ---
        const lines = reportText.split('\n');
        let htmlContent = '';
        let isInList = false;

        lines.forEach(line => {
            // 1. **Bold** 텍스트 먼저 처리
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

            // 2. 제목(##) 처리
            if (line.startsWith('## ')) {
                if (isInList) { htmlContent += '</ul>'; isInList = false; }
                htmlContent += `<h2>${line.substring(3)}</h2>`;
            } 
            // 3. 목록(*) 처리
            else if (line.startsWith('* ')) {
                if (!isInList) { htmlContent += '<ul>'; isInList = true; }
                htmlContent += `<li>${line.substring(2)}</li>`;
            } 
            // 4. 빈 줄은 문단 구분으로 처리
            else if (line.trim() === '') {
                if (isInList) { htmlContent += '</ul>'; isInList = false; }
            } 
            // 5. 그 외에는 모두 일반 문단으로 처리
            else {
                if (isInList) { htmlContent += '</ul>'; isInList = false; }
                htmlContent += `<p>${line}</p>`;
            }
        });

        if (isInList) { htmlContent += '</ul>'; } // 마지막 줄이 목록일 경우 닫아주기
        // --- 파싱 로직 끝 ---

        reportContainer.innerHTML = htmlContent;

    } catch (error) {
        reportContainer.innerHTML = `<p>종합 분석 보고서를 불러오는 데 실패했습니다. (에러: ${error.message})</p>`;
    }
}


// --- 기존 뉴스 API 호출 함수들 (변경 없음) ---
// (이하 코드는 이전과 동일)
async function fetchKoreanNews() {
    const newsContainer = document.getElementById('korean-news-container');
    const rssFeeds = [
        'https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml',
        'https://www.yonhapnewstv.co.kr/browse/feed/',
        'https://www.hani.co.kr/rss/',
        'https://www.khan.co.kr/rss/rssdata/total_news.xml',
    ];

    try {
        const responses = await Promise.all(rssFeeds.map(feedUrl => fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`)));
        for (const response of responses) if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const jsonResults = await Promise.all(responses.map(res => res.json()));
        const allItems = jsonResults.flatMap(result => result.items || []).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate)).slice(0, 40);
        
        newsContainer.innerHTML = ''; 
        allItems.forEach(item => {
            const articleElement = document.createElement('div');
            articleElement.className = 'news-article';
            const description = item.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
            articleElement.innerHTML = `
                <a href="${item.link}" target="_blank" rel="noopener noreferrer"><h2>${item.title}</h2></a>
                <p>${description || '내용 요약 없음'}</p>
                <div class="article-meta"><span>출처: ${item.author || '언론사'}</span> | <span>${new Date(item.pubDate).toLocaleString()}</span></div>`;
            newsContainer.appendChild(articleElement);
        });
    } catch (error) {
        newsContainer.innerHTML = `<p>국내 뉴스를 불러오는 데 실패했습니다. (에러: ${error.message})</p>`;
    }
}

async function fetchEnglishNews() {
    const newsContainer = document.getElementById('english-news-container');
    const apiKey = '6c141a3bf180fef4f3b57f0d560c1e4e'; // 본인의 GNews 키를 입력하세요.
    const categories = ['world', 'nation', 'business', 'technology'];

    try {
        const responses = await Promise.all(categories.map(category => fetch(`https://gnews.io/api/v4/top-headlines?lang=en&category=${category}&max=10&apikey=${apiKey}`)));
        for (const response of responses) if (!response.ok) throw new Error(`API Error`);
        const jsonResults = await Promise.all(responses.map(res => res.json()));
        const allArticles = jsonResults.flatMap(result => result.articles || []).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        newsContainer.innerHTML = '';
        allArticles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.className = 'news-article';
            articleElement.innerHTML = `
                <a href="${article.url}" target="_blank" rel="noopener noreferrer"><h2>${article.title}</h2></a>
                <p>${article.description || 'No summary available.'}</p>
                <div class="article-meta"><span>Source: ${article.source.name}</span> | <span>${new Date(article.publishedAt).toLocaleString()}</span></div>`;
            newsContainer.appendChild(articleElement);
        });
    } catch (error) {
        newsContainer.innerHTML = `<p>해외 뉴스를 불러오는 데 실패했습니다. (에러: ${error.message})</p>`;
    }
}
