// 페이지 로드가 완료되면 두 뉴스 함수를 모두 실행합니다.
document.addEventListener('DOMContentLoaded', () => {
    fetchKoreanNews();
    fetchEnglishNews();
});

// 1. 국내 뉴스 가져오기 (최근 7일 필터 추가)
async function fetchKoreanNews() {
    const newsContainer = document.getElementById('korean-news-container');
    const rssFeeds = [
        'https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml',
        'https://www.yonhapnewstv.co.kr/browse/feed/',
        'https://www.hani.co.kr/rss/',
        'https://www.khan.co.kr/rss/rssdata/total_news.xml',
        'https://rss.hankookilbo.com/daily/dh_politics.xml'
    ];

    try {
        // 💡 오늘 날짜 및 7일 전 날짜 계산
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const responses = await Promise.all(
            rssFeeds.map(feedUrl => fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`))
        );

        for (const response of responses) {
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        }

        const jsonResults = await Promise.all(responses.map(res => res.json()));

        const allItems = jsonResults.flatMap(result => result.items || []);

        // 💡 7일 이내의 기사만 필터링하는 코드 추가
        const recentItems = allItems.filter(item => new Date(item.pubDate) >= sevenDaysAgo);

        recentItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        const limitedItems = recentItems.slice(0, 40);
        
        newsContainer.innerHTML = ''; 

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

// 2. 해외 뉴스 가져오기 (최근 7일 필터 추가)
async function fetchEnglishNews() {
    const newsContainer = document.getElementById('english-news-container');
    const apiKey = '6c141a3bf180fef4f3b57f0d560c1e4e'; // 본인의 GNews API 키를 입력하세요.
    const categories = ['general', 'world', 'business', 'technology'];
    let allArticles = [];

    try {
        // 💡 오늘 날짜 및 7일 전 날짜 계산
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        newsContainer.innerHTML = '<p class="loading">해외 뉴스를 불러오는 중...</p>';

        for (const category of categories) {
            const url = `https://gnews.io/api/v4/top-headlines?lang=en&category=${category}&max=10&apikey=${apiKey}`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`Error fetching category ${category}: ${response.status}`);
                continue;
            }

            const data = await response.json();
            if (data.articles) {
                allArticles = allArticles.concat(data.articles);
            }
            
            await new Promise(resolve => setTimeout(resolve, 500)); 
        }

        // 💡 7일 이내의 기사만 필터링하는 코드 추가
        const recentArticles = allArticles.filter(article => new Date(article.publishedAt) >= sevenDaysAgo);

        recentArticles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        newsContainer.innerHTML = '';

        recentArticles.slice(0, 40).forEach(article => { // 필터링 후 40개로 제한
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
        console.error('해외 뉴스 로딩 중 전체 실패:', error);
        newsContainer.innerHTML = `<p>해외 뉴스를 불러오는 데 실패했습니다. GNews API 키 또는 인터넷 연결을 확인해주세요.</p>`;
    }
}
