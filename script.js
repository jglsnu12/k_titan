// =================================================================
// ✨ 1. Firebase 연동 및 설정 (파일 최상단에 추가)
// =================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// ⚠️ 본인의 Firebase 설정 키를 아래에 붙여넣으세요.
const firebaseConfig = {
  apiKey: "AIzaSyAgSSLC7PW5RSY_pUQskc502D4HT31leRc",
  authDomain: "k-titan.firebaseapp.com",
  projectId: "k-titan",
  storageBucket: "k-titan.firebasestorage.app",
  messagingSenderId: "904124999177",
  appId: "1:904124999177:web:0634ab4babc77b1384bad8"
};

// Firebase 앱 초기화 및 Firestore 서비스 가져오기
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


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
            // ✨ '제안사항' 탭을 클릭했을 때 loadPosts 함수 호출 (이 부분이 중요!)
            if (targetContentId === 'suggestions-content') {
                loadPosts();
            }
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

// =================================================================
// ✨ 4. 게시판 기능 (파일 하단에 추가)
// =================================================================

const postsContainer = document.getElementById('posts-container');
const modal = document.getElementById('write-modal');
const showModalBtn = document.getElementById('show-write-modal');
const closeModalBtn = document.getElementById('close-modal');
const postForm = document.getElementById('post-form');

async function loadPosts() {
    if (!postsContainer) return;
    postsContainer.innerHTML = '<p class="loading">게시글을 불러오는 중...</p>';
    const postsQuery = query(collection(db, 'suggestions'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(postsQuery);
    if (querySnapshot.empty) {
        postsContainer.innerHTML = '<p>아직 등록된 제안이 없습니다.</p>';
        return;
    }
    let postsHtml = '';
    querySnapshot.forEach(docSnap => {
        const post = docSnap.data();
        const postId = docSnap.id;
        const date = post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleString() : '날짜 정보 없음';
        const statusClass = post.status === 'resolved' ? 'resolved' : 'unresolved';
        const statusText = post.status === 'resolved' ? '답변 완료' : '검토 중';
        let commentHtml = '';
        if (post.comment) {
            commentHtml = `<div class="comment-section"><div class="comment-card"><p class="comment-author"><strong>관리자 답변</strong></p><p>${post.comment}</p></div></div>`;
        } else {
             commentHtml = `<div class="comment-section"><form class="comment-form" data-id="${postId}"><input type="text" class="comment-input" placeholder="관리자 답변을 입력하세요..." required><button type="submit" class="comment-submit">답변 등록</button></form></div>`;
        }
        postsHtml += `<div class="post-card" id="post-${postId}"><div class="post-header"><span><strong>${post.author}</strong> | ${date}</span><span class="post-status ${statusClass}">${statusText}</span></div><div class="post-content"><p>${post.content}</p></div>${commentHtml}</div>`;
    });
    postsContainer.innerHTML = postsHtml;
}

if(showModalBtn) {
    showModalBtn.addEventListener('click', () => modal.style.display = 'flex');
    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

if(postForm) {
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const author = document.getElementById('post-author').value;
        const password = document.getElementById('post-password').value;
        const content = document.getElementById('post-content').value;
        try {
            await addDoc(collection(db, 'suggestions'), { author, password, content, status: 'unresolved', timestamp: serverTimestamp() });
            postForm.reset();
            modal.style.display = 'none';
            loadPosts();
        } catch (error) { console.error("Error adding document: ", error); alert("게시글 등록에 실패했습니다."); }
    });
}

if(postsContainer) {
    postsContainer.addEventListener('submit', async (e) => {
        if (e.target.classList.contains('comment-form')) {
            e.preventDefault();
            const postId = e.target.dataset.id;
            const commentText = e.target.querySelector('.comment-input').value;
            try {
                const postRef = doc(db, 'suggestions', postId);
                await updateDoc(postRef, { comment: commentText, status: 'resolved' });
                loadPosts();
            } catch (error) { console.error("Error updating document: ", error); alert("답변 등록에 실패했습니다."); }
        }
    });
}

