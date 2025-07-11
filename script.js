// 페이지 로드가 완료되면 fetchNews 함수를 실행합니다.
document.addEventListener('DOMContentLoaded', fetchNews);

async function fetchNews() {
    const newsContainer = document.getElementById('news-container');
    
    // 🚨 1단계에서 발급받은 GNews의 API 키를 입력하세요!
    const apiKey = '6c141a3bf180fef4f3b57f0d560c1e4e'; 

    // GNews API를 이용해 한국의 최신 헤드라인 뉴스를 가져옵니다.
    const url = `https://gnews.io/api/v4/top-headlines?lang=en&country=us&max=20&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            // 응답이 성공적이지 않을 경우, 에러 상태를 텍스트로 보여주기 위함
            const errorData = await response.json();
            throw new Error(`API Error: ${errorData.errors.join(', ')}`);
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
        newsContainer.innerHTML = `<p>뉴스를 불러오는 데 실패했습니다. 인터넷 연결이나 GNews API 키를 확인해주세요. (에러: ${error.message})</p>`;
    }
}
