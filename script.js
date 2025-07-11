// 페이지 로드가 완료되면 두 뉴스 함수를 모두 실행합니다.
document.addEventListener('DOMContentLoaded', () => {
    fetchKoreanNews();
    fetchEnglishNews();
});

// 1. 국내 뉴스 가져오기 (RSS)
async function fetchKoreanNews() {
    const newsContainer = document.getElementById('korean-news-container');
    const url = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%3Fhl%3Dko%26gl%3DKR%26ceid%3DKR%3Ako';

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        if (data.status !== 'ok') throw new Error('RSS 피드를 가져오는 데 실패했습니다.');

        newsContainer.innerHTML = ''; // 로딩 메시지 삭제
        data.items.forEach(item => {
            const articleElement = document.createElement('div');
            articleElement.className = 'news-article';
            const description = item.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
            articleElement.innerHTML = `
                <a href="${item.link}" target="_blank" rel="noopener noreferrer"><h2>${item.title}</h2></a>
                <p>${description || '내용 요약 없음'}</p>
                <div class="article-meta">
                    <span>출처: ${item.author}</span> | <span>${new Date(item.pubDate).toLocaleString()}</span>
                </div>`;
            newsContainer.appendChild(articleElement);
        });
    } catch (error) {
        console.error('국내 뉴스 로딩 실패:', error);
        newsContainer.innerHTML = `<p>국내 뉴스를 불러오는 데 실패했습니다. (에러: ${error.message})</p>`;
    }
}

// 2. 해외 뉴스 가져오기 (GNews)
async function fetchEnglishNews() {
    const newsContainer = document.getElementById('english-news-container');
    
    // 🚨 여기에 GNews에서 발급받은 본인의 실제 API 키를 입력하세요!
    const apiKey = '6c141a3bf180fef4f3b57f0d560c1e4e'; 
    const url = `https://gnews.io/api/v4/top-headlines?lang=en&max=20&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.errors.join(', ')}`);
        }
        const data = await response.json();

        newsContainer.innerHTML = ''; // 로딩 메시지 삭제
        data.articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.className = 'news-article';
            articleElement.innerHTML = `
                <a href="${article.url}" target="_blank" rel="noopener noreferrer"><h2>${article.title}</h2></a>
                <p>${article.description || 'No summary available.'}</p>
                <div class="article-meta">
                    <span>Source: ${article.source.name}</span> | <span>${new Date(article.publishedAt).toLocaleString()}</span>
                </div>`;
            newsContainer.appendChild(articleElement);
        });
    } catch (error) {
        console.error('해외 뉴스 로딩 실패:', error);
        newsContainer.innerHTML = `<p>해외 뉴스를 불러오는 데 실패했습니다. GNews API 키를 확인해주세요. (에러: ${error.message})</p>`;
    }
}
