// 페이지 로드가 완료되면 실행될 함수
document.addEventListener('DOMContentLoaded', function() {
    fetchTopHeadlines();
});

// NewsAPI를 이용해 주요 뉴스 헤드라인을 가져오는 함수
async function fetchTopHeadlines() {
    const newsContainer = document.getElementById('news-container');
    const apiKey = 'f845bb0b7bf14bcfab8bc14e34a526dd'; // 여기에 본인의 NewsAPI 키를 입력하세요.
    // 예시: 주요 5개국 뉴스 (미국, 중국, 일본, 러시아, 한국)
    const url = `https://newsapi.org/v2/top-headlines?country=us&country=cn&country=jp&country=ru&country=kr&pageSize=10&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // API 키가 유효하지 않거나 다른 오류 발생 시
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // 로딩 메시지 삭제
        newsContainer.innerHTML = '';

        // 가져온 뉴스 기사를 화면에 표시
        data.articles.forEach(article => {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            newsItem.innerHTML = `
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">${article.title}</a>
                <p>${article.source.name} - ${new Date(article.publishedAt).toLocaleString()}</p>
            `;
            newsContainer.appendChild(newsItem);
        });

    } catch (error) {
        console.error("뉴스를 불러오는 데 실패했습니다:", error);
        newsContainer.innerHTML = '<p>최신 뉴스를 불러오는 데 실패했습니다. API 키를 확인하거나 나중에 다시 시도해 주세요.</p>';
    }
}

// 참고: 경제 지표나 지도 데이터도 위와 같이 각 데이터를 제공하는 API를 활용하여
// fetch 함수로 호출하고, 받은 데이터를 화면에 표시하는 코드를 추가하면
// 완벽한 동적 대시보드를 만들 수 있습니다.
