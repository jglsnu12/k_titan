// 페이지 로드가 완료되면 두 뉴스 함수를 모두 실행합니다.
document.addEventListener('DOMContentLoaded', () => {
    fetchKoreanNews();
    fetchEnglishNews();
});

// 1. 국내 뉴스 가져오기 (이전과 동일)
async function fetchKoreanNews() {
    const newsContainer = document.getElementById('korean-news-container');
    
    // 여러 언론사의 RSS 피드 주소 목록
    const rssFeeds = [
        'https://www.yonhapnewstv.co.kr/browse/feed/', // 연합뉴스TV
        'https://www.khan.co.kr/rss/rssdata/total_news.xml', // 경향신문
        'https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml' // 조선일보
    ];

    try {
        // Promise.all을 사용해 모든 RSS 피드를 동시에 요청하고 기다립니다.
        const responses = await Promise.all(
            rssFeeds.map(feedUrl => 
                fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`)
            )
        );

        // 모든 응답이 성공적인지 확인합니다.
        for (const response of responses) {
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        }

        const jsonResults = await Promise.all(responses.map(res => res.json()));

        // 각 피드의 뉴스 아이템들을 하나의 배열로 합칩니다.
        const allItems = jsonResults.flatMap(result => result.items || []);

        // 합친 뉴스들을 최신순으로 정렬합니다.
        allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        
        // 상위 40개만 선택합니다.
        const limitedItems = allItems.slice(0, 40);

        newsContainer.innerHTML = ''; // 로딩 메시지 삭제

        limitedItems.forEach(item => {
            const articleElement = document.createElement('div');
            articleElement.className = 'news-article';
            const description = item.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
            articleElement.innerHTML = `
                <a href="${item.link}" target="_blank" rel="noopener noreferrer"><h2>${item.title}</h2></a>
                <p>${description || '내용 요약 없음'}</p>
                <div class="article-meta">
                    <span>출처: ${item.author || '언론사'}</span> | <span>${new Date(item.pubDate).toLocaleString()}</span>
                </div>`;
            newsContainer.appendChild(articleElement);
        });

    } catch (error) {
        console.error('국내 뉴스 로딩 실패:', error);
        newsContainer.innerHTML = `<p>국내 뉴스를 불러오는 데 실패했습니다. (에러: ${error.message})</p>`;
    }
}

// 2. 해외 뉴스 가져오기 (GNews - 여러 카테고리를 합치는 방식으로 변경)
async function fetchEnglishNews() {
    const newsContainer = document.getElementById('english-news-container');
    
    // 🚨 GNews API 키를 확인해주세요.
    const apiKey = '6c141a3bf180fef4f3b57f0d560c1e4e'; // 여기에 본인의 GNews API 키를 입력하세요.
    
    // 💡 가져올 뉴스의 카테고리 목록
    const categories = ['general', 'world', 'nation'];

    try {
        // Promise.all을 사용해 모든 카테고리 뉴스를 동시에 요청합니다.
        const responses = await Promise.all(
            categories.map(category => 
                fetch(`https://gnews.io/api/v4/top-headlines?lang=en&category=${category}&max=10&apikey=${apiKey}`)
            )
        );

        for (const response of responses) {
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error in category ${response.url}: ${errorData.errors.join(', ')}`);
            }
        }

        const jsonResults = await Promise.all(responses.map(res => res.json()));

        // 각 카테고리의 뉴스 기사들을 하나의 배열로 합칩니다.
        const allArticles = jsonResults.flatMap(result => result.articles || []);

        // 합친 뉴스들을 최신순으로 정렬합니다.
        allArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        newsContainer.innerHTML = ''; // 로딩 메시지 삭제

        allArticles.forEach(article => {
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
