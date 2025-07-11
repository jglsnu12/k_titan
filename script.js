// --- 💡 탭 전환 로직 ---
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // 모든 탭과 콘텐츠에서 'active' 클래스 제거
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // 클릭된 탭과 그에 맞는 콘텐츠에 'active' 클래스 추가
            tab.classList.add('active');
            const targetContentId = tab.dataset.tab + '-content'; // e.g., 'home-content'
            document.getElementById(targetContentId).classList.add('active');
        });
    });

    // ✨ 데이터 로딩 함수들 호출
    fetchAnalysisReport(); // AI 분석 보고서 불러오기
    fetchKoreanNews();
    fetchEnglishNews();
});


// --- ✨ AI 분석 보고서 가져오기 함수 (새로 추가) ---
async function fetchAnalysisReport() {
    const reportContainer = document.getElementById('analysis-report-container');
    // GitHub 리포지토리의 원본(raw) 파일 주소
    const reportUrl = 'https://raw.githubusercontent.com/jglsnu12/k_titan/main/final_analysis_report.txt';

    try {
        const response = await fetch(reportUrl);
        if (!response.ok) {
            // 파일을 못찾거나 다른 에러가 발생했을 경우
            throw new Error(`HTTP Error: ${response.status}`);
        }
        const reportText = await response.text();

        // 텍스트의 줄바꿈을 HTML <br> 태그로 변경하여 형식 유지
        reportContainer.innerHTML = reportText.replace(/\n/g, '<br>');

    } catch (error) {
        reportContainer.innerHTML = `<p>종합 분석 보고서를 불러오는 데 실패했습니다. (에러: ${error.message})</p>`;
    }
}


// --- 기존 뉴스 API 호출 함수들 (변경 없음) ---

// 1. 국내 뉴스 가져오기
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

// 2. 해외 뉴스 가져오기
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
