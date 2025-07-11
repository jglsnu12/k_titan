// 페이지 로드가 완료되면 fetchNews 함수를 실행합니다.
document.addEventListener('DOMContentLoaded', fetchNews);

async function fetchNews() {
    const newsContainer = document.getElementById('news-container');
    
    // 🚨 여기에 1단계에서 발급받은 본인의 실제 API 키를 입력하세요!
    const apiKey = 'f845bb0b7bf14bcfab8bc14e34a526dd'; 

    // 주요 국가(미국, 중국, 일본, 러시아, 한국)의 최신 헤드라인 뉴스를 가져옵니다.
    const url = `https://newsapi.org/v2/top-headlines?country=us&category=general&pageSize=5&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        
        // API 키가 유효하지 않을 경우를 대비
        if (response.status === 401) {
            newsContainer.innerHTML = '<p>오류: NewsAPI 키가 유효하지 않습니다. script.js 파일을 확인해주세요.</p>';
            return;
        }

        const data = await response.json();
        
        // '로딩 중...' 메시지를 지웁니다.
        newsContainer.innerHTML = '';

        // 가져온 뉴스 기사들을 화면에 하나씩 추가합니다.
        data.articles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.className = 'news-article';

            articleElement.innerHTML = `
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                    <h2>${article.title}</h2>
                </a>
                <p>${article.description || '내용 요약 없음'}</p>
                <div class="article-meta">
                    <span>출처: ${article.source.name}</span> |
                    <span>${new Date(article.publishedAt).toLocaleString()}</span>
                </div>
            `;
            newsContainer.appendChild(articleElement);
        });

    } catch (error) {
        console.error('뉴스를 가져오는 데 실패했습니다:', error);
        newsContainer.innerHTML = '<p>뉴스를 불러오는 데 실패했습니다. 인터넷 연결이나 API 키를 확인해주세요.</p>';
    }
}
