// =================================================================
// ✨ 1. Firebase 연동 및 설정 (파일 최상단에 추가)
// =================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, addDoc, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

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


// =================================================================
// ✨ 2. 전역 유틸리티 및 데이터 로딩 함수 (DOMContentLoaded 외부)
// 이 함수들은 DOMContentLoaded 이벤트와는 독립적으로 정의되며,
// 이벤트 리스너 내부에서 호출될 수 있습니다.
// =================================================================

async function fetchAnalysisReport() {
    const reportContainer = document.getElementById('analysis-report-container');
    if (!reportContainer) return;
    const reportUrl = 'https://raw.githubusercontent.com/jglsnu12/k_titan/main/final_analysis_report.txt';

    try {
        const response = await fetch(reportUrl);
        if (!response.ok) { throw new Error(`HTTP Error: ${response.status}`); }
        const reportText = await response.text();
        let htmlContent = '';
        const lines = reportText.split('\n');
        let inList = false;
        lines.forEach(line => {
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            if (line.startsWith('## ')) { if (inList) { htmlContent += '</ul>'; inList = false; } htmlContent += `<h2>${line.substring(3)}</h2>`; }
            else if (line.startsWith('* ')) { if (!inList) { htmlContent += '<ul>'; inList = true; } htmlContent += `<li>${line.substring(2)}</li>`; }
            else if (line.trim() === '') { if (inList) { htmlContent += '</ul>'; inList = false; } }
            else { if (inList) { htmlContent += '</ul>'; inList = false; } htmlContent += `<p>${line}</p>`; }
        });
        if (inList) { htmlContent += '</ul>'; }
        reportContainer.innerHTML = htmlContent;
    } catch (error) { reportContainer.innerHTML = `<p class="error-message">종합 분석 보고서를 불러오는 데 실패했습니다. (에러: ${error.message})</p>`; }
}

async function fetchKoreanNews() {
    const newsContainer = document.getElementById('korean-news-container');
    if (!newsContainer) return;
    newsContainer.innerHTML = '<p class="loading">연합뉴스 [정치] 기사를 테스트 중...</p>';
    const politicsRssUrl = 'https://www.yna.co.kr/rss/northkorea.xml';
    try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(politicsRssUrl)}`);
        if (!response.ok) { throw new Error(`HTTP Error: ${response.status}`); }
        const result = await response.json();
        const allItems = result.items || [];
        newsContainer.innerHTML = '';
        if (allItems.length === 0) { newsContainer.innerHTML = '<p class="no-data">표시할 뉴스가 없습니다.</p>'; return; }
        allItems.forEach(item => {
            const articleElement = document.createElement('div');
            articleElement.className = 'news-article';
            const description = item.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
            const category = '정치';
            articleElement.innerHTML = `
                <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                    <span class="news-category">[${category}]</span>
                    <h2>${item.title}</h2>
                </a>
                <p>${description || '내용 요약 없음'}</p>
                <div class="article-meta">
                    <span>출처: ${item.author || '연합뉴스'}</span> | <span>${new Date(item.pubDate).toLocaleString()}</span>
                </div>`;
            newsContainer.appendChild(articleElement);
        });
    } catch (error) { newsContainer.innerHTML = `<p class="error-message">국내 뉴스를 불러오는 데 실패했습니다. (에러: ${error.message})</p`; }
}

async function fetchEnglishNews() {
    const newsContainer = document.getElementById('english-news-container');
    if (!newsContainer) return;
    const apiKey = '6c141a3bf180fef4f3b57f0d560c1e4e'; // 본인의 GNews 키를 입력하세요.
    const categories = ['world', 'nation', 'business', 'technology'];
    try {
        const responses = await Promise.all(categories.map(category => fetch(`https://gnews.io/api/v4/top-headlines?lang=en&category=${category}&max=10&apikey=${apiKey}`)));
        for (const response of responses) if (!response.ok) throw new Error(`API Error`);
        const jsonResults = await Promise.all(responses.map(res => res.json()));
        const allArticles = jsonResults.flatMap(result => result.articles || []).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        newsContainer.innerHTML = '';
        if (allArticles.length === 0) { newsContainer.innerHTML = '<p class="no-data">No English news to display.</p>'; return; }
        allArticles.forEach(article => {
            const articleElement = document.createElement('div');
            articleElement.className = 'news-article';
            articleElement.innerHTML = `
                <a href="${article.url}" target="_blank" rel="noopener noreferrer"><h2>${article.title}</h2></a>
                <p>${article.description || 'No summary available.'}</p>
                <div class="article-meta"><span>Source: ${article.source.name}</span> | <span>${new Date(article.publishedAt).toLocaleString()}</span></div>`;
            newsContainer.appendChild(articleElement);
        });
    } catch (error) { newsContainer.innerHTML = `<p class="error-message">해외 뉴스를 불러오는 데 실패했습니다. (에러: ${error.message})</p>`; }
}

function renderCalendar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const events = [
        { date: '2025-07-20', description: 'G7 정상회담', countries: ['🇯🇵', '🇺🇸', '🇬🇧', '🇫🇷', '🇩🇪', '🇮🇹', '🇨🇦'] },
        { date: '2025-07-25', description: '유럽중앙은행(ECB) 통화정책회의', countries: ['🇪🇺'] },
        { date: '2025-08-01', description: '미국-중국 전략 경제 대화', countries: ['🇺🇸', '🇨🇳'] },
        { date: '2025-08-15', description: '광복절 기념식 (한국)', countries: ['🇰🇷'] },
        { date: '2025-09-05', description: 'UN 총회 개막', countries: ['🇺🇳'] },
        { date: '2025-09-10', description: '한미일 안보 협의체 회의', countries: ['🇰🇷', '🇺🇸', '🇯🇵'] },
        { date: '2025-09-20', description: '독일 총선', countries: ['🇩🇪'] },
        { date: '2025-07-11', description: '미국 소비자물가지수(CPI) 발표', countries: ['🇺🇸'] },
        { date: '2025-07-10', description: 'G20 외교장관 회의', countries: ['🇰🇷', '🇺🇸', '🇯🇵', '🇨🇳'] },
        { date: '2025-07-09', description: '한미 연합 군사훈련 \'프리덤 실드\' 실시', countries: ['🇰🇷', '🇺🇸'] },
        { date: '2025-06-30', description: 'APEC 제1차 고위관리회의', countries: ['🇰🇷', '🇯🇵', '🇨🇳', '🇺🇸'] },
        { date: '2025-06-25', description: '브릭스(BRICS) 정상회담', countries: ['🇧🇷', '🇷🇺', '🇮🇳', '🇨🇳', '🇿🇦'] },
    ];
    const upcomingList = document.getElementById('upcoming-list');
    const pastList = document.getElementById('past-list');
    if (!upcomingList || !pastList) return;
    events.forEach(event => { event.eventDate = new Date(event.date); });
    const sortedUpcoming = events.filter(event => event.eventDate >= today).sort((a, b) => a.eventDate - b.eventDate);
    const sortedPast = events.filter(event => event.eventDate < today).sort((a, b) => b.eventDate - a.eventDate);
    function renderEventList(listElement, eventArray) {
        listElement.innerHTML = '';
        if (eventArray.length === 0) { listElement.innerHTML = '<li class="no-data-item">일정이 없습니다.</li>'; return; }
        eventArray.forEach(event => {
            const listItem = document.createElement('li');
            listItem.classList.add('event-item');
            const formattedDate = new Date(event.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) + ' (' + ['일', '월', '화', '수', '목', '금', '토'][new Date(event.date).getDay()] + ')';
            const flagsHtml = event.countries.map(flagEmoji => `<span class="flag-emoji">${flagEmoji}</span>`).join('');
            listItem.innerHTML = `
                <span class="date">${formattedDate}</span>
                <span class="description">${event.description}</span>
                <span class="flags">${flagsHtml}</span>
            `;
            listElement.appendChild(listItem);
        });
    }
    renderEventList(upcomingList, sortedUpcoming);
    renderEventList(pastList, sortedPast);
}

// --- 게시판 기능 관련 유틸리티 함수들 ---
function formatPostContent(content) {
    return content.trim().replace(/\n\s*\n/g, '\n').replace(/(\r\n|\r|\n){2,}/g, '\n').replace(/\n/g, '<br>');
}
function openEditModal(postId, postData) {
    document.getElementById('edit-post-id').value = postId;
    document.getElementById('edit-post-content').textContent = postData.content;
    document.getElementById('edit-modal').style.display = 'flex';
}
async function deletePost(postId) {
    if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
        try { await deleteDoc(doc(db, 'suggestions', postId)); alert("게시글이 삭제되었습니다."); loadPosts(); }
        catch (error) { console.error("Error deleting document: ", error); alert("삭제 중 오류가 발생했습니다."); }
    }
}

// --- loadPosts 함수 ---
async function loadPosts() {
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) return;
    postsContainer.innerHTML = '<p class="loading">게시글을 불러오는 중...</p>';
    const postsQuery = query(collection(db, 'suggestions'), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(postsQuery);
    if (querySnapshot.empty) { postsContainer.innerHTML = '<p>아직 등록된 제안이 없습니다.</p>'; return; }
    let postsHtml = '';
    querySnapshot.forEach(docSnap => {
        const post = docSnap.data();
        const postId = docSnap.id;
        const date = post.timestamp ? new Date(post.timestamp.seconds * 1000).toLocaleString() : '날짜 정보 없음';
        const statusClass = post.status === 'resolved' ? 'resolved' : 'unresolved';
        const statusText = post.status === 'resolved' ? '답변 완료' : '검토 중';
        let commentHtml = '';
        if (post.comment) { commentHtml = `<div class="comment-section"><div class="comment-card"><p class="comment-author"><strong>관리자 답변</strong></p><p>${post.comment}</p></div></div>`; }
        else { commentHtml = `<div class="comment-section"><form class="comment-form" data-id="${postId}"><input type="text" class="comment-input" placeholder="관리자 답변을 입력하세요..." required><button type="submit" class="comment-submit">답변 등록</button></form></div>`; }
        postsHtml += `
            <div class="post-card" id="post-${postId}">
                <div class="post-header">
                    <span><strong>${post.author}</strong> | ${date}</span>
                    <span class="post-status ${statusClass}">${statusText}</span>
                </div>
                <div class="post-content">
                    <p>${formatPostContent(post.content)}</p>
                </div>
                <div class="post-actions">
                    <button class="post-manage-btn" data-id="${postId}" data-author="${post.author}">수정/삭제</button>
                </div>
                ${commentHtml}
            </div>`;
    });
    postsContainer.innerHTML = postsHtml;
}

// =================================================================
// ✨ NEW: 국가 데이터 로딩 함수 (DOMContentLoaded 외부)
// 이 함수가 최신 버전이며, 아래에 중복된 함수는 삭제되어야 합니다.
// =================================================================
async function loadCountryData() {
    const leftPanel = document.querySelector('.country-info-panel.left-panel');
    const rightPanel = document.querySelector('.country-info-panel.right-panel');
    const mapVisualizationWrapper = document.querySelector('.map-visualization-wrapper');

    // 지도 이미지 관련 로그 추가
    console.log("loadCountryData called.");
    console.log("mapVisualizationWrapper:", mapVisualizationWrapper); // 이 요소가 null인지 확인

    if (!leftPanel || !rightPanel || !mapVisualizationWrapper) {
        console.error("Required map elements not found."); // 요소가 없으면 여기서 리턴
        return;
    }

    const mapImageUrl = 'assets/world_map.jpg'; // ⚠️ 여기에 실제 지도 이미지 경로를 입력하세요.
    const mapImage = document.createElement('img');
    mapImage.src = mapImageUrl;
    mapImage.alt = 'World Map';
    mapImage.className = 'world-map-image';
    
    // 기존 이미지가 있다면 제거하고 새로 추가 (탭 전환 시 중복 추가 방지)
    const existingMapImage = mapVisualizationWrapper.querySelector('.world-map-image');
    if (existingMapImage) {
        mapVisualizationWrapper.removeChild(existingMapImage);
        console.log("Existing map image removed.");
    }
    
    mapVisualizationWrapper.prepend(mapImage);
    console.log("New map image appended to mapVisualizationWrapper. src:", mapImageUrl);

    const countriesMeta = [
        { id: 'usa', name: '미국', flag: '🇺🇸', markerClass: 'us' },
        { id: 'china', name: '중국', flag: '🇨🇳', markerClass: 'cn' },
        { id: 'japan', name: '일본', flag: '🇯🇵', markerClass: 'jp' },
        { id: 'korea', name: '대한민국', flag: '🇰🇷', markerClass: 'kr' },
        { id: 'northkorea', name: '북한', flag: '🇰🇵', markerClass: 'kp' },
        { id: 'russia', name: '러시아', flag: '🇷🇺', markerClass: 'ru' },
    ];

    leftPanel.innerHTML = '<p class="loading-panel">국가 정보를 불러오는 중...</p>';
    rightPanel.innerHTML = '<p class="loading-panel">국가 정보를 불러오는 중...</p>';

    const allCountriesData = [];

    for (const meta of countriesMeta) {
        try {
            const response = await fetch(`http://localhost:5000/get_country_data/${meta.id}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Failed to load data for ${meta.id}: ${response.status} - ${errorText}`);
                allCountriesData.push({
                    ...meta,
                    report_title: `${meta.name} 국제 정세 분석 보고서`,
                    report_intro: '데이터 로드 실패 또는 파일 없음.',
                    overall_stability: '알 수 없음',
                    overall_briefing: '데이터 요약 없음.',
                    categories: []
                });
            } else {
                const data = await response.json();
                let countryName = '';
                let countryFlag = '';
                switch(meta.id) { // meta.id 사용
                    case 'usa': countryName = '미국'; countryFlag = '🇺🇸'; break;
                    case 'china': countryName = '중국'; countryFlag = '🇨🇳'; break;
                    case 'japan': countryName = '일본'; countryFlag = '🇯🇵'; break;
                    case 'korea': countryName = '대한민국'; countryFlag = '🇰🇷'; break;
                    case 'northkorea': countryName = '북한'; countryFlag = '🇰🇵'; break;
                    case 'russia': countryName = '러시아'; countryFlag = '🇷🇺'; break;
                    default: countryName = meta.id.toUpperCase(); countryFlag = '❓';
                }

                allCountriesData.push({
                    id: meta.id, // meta.id 사용
                    name: countryName,
                    flag: countryFlag,
                    overall_stability: data.overall_stability || '알 수 없음',
                    overall_briefing: data.overall_briefing || '보고서 요약 없음.',
                    report_title: data.report_title || `${countryName} 국제 정세 분석 보고서`,
                    report_intro: data.report_intro || '보고서 서론 없음.',
                    categories: data.categories || [],
                    markerClass: meta.id // meta.id 사용
                });
            }
        } catch (error) {
            console.error(`Error fetching data for ${meta.id}:`, error);
            allCountriesData.push({
                ...meta, // 기존 메타 정보 복사
                report_title: `${meta.name} 국제 정세 분석 보고서`,
                report_intro: '네트워크 오류 또는 서버 접속 불가.',
                overall_stability: '알 수 없음',
                overall_briefing: `네트워크 오류 또는 서버 접속 불가 (${error.message}).`,
                categories: []
            });
        }
    }

    leftPanel.innerHTML = '';
    rightPanel.innerHTML = '';

    allCountriesData.forEach((country, index) => {
        const countryCard = document.createElement('div');
        countryCard.className = 'country-card';
        const overallStabilityClass = country.overall_stability ? country.overall_stability.toLowerCase().replace(' ', '') : 'unknown';
        
        let categoriesDetailHtml = '';
        country.categories.forEach(cat => {
            const levelClass = cat.level ? cat.level.toLowerCase().replace(' ', '') : 'unknown';
            categoriesDetailHtml += `
                <div class="category-detail">
                    <h4>${cat.name} (${cat.overall_evaluation || cat.level || '알 수 없음'})</h4>
                    <span class="category-score">점수: ${cat.score !== null ? cat.score : 'N/A'}</span>
                    <span class="category-level ${levelClass}">단계: ${cat.level || '알 수 없음'}</span>
                    <div class="signals-toggle-area">
                        <button class="toggle-signals-btn">세부 내용 보기</button>
                        <div class="signals-content" style="display: none;">
                            <p><strong>+ 긍정적 신호:</strong> ${cat.positive_signal || '없음'}</p>
                            <p><strong>- 부정적 신호:</strong> ${cat.negative_signal || '없음'}</p>
                            <p><strong>종합 평가:</strong> ${cat.overall_evaluation || '없음'}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        countryCard.innerHTML = `
            <div class="country-header">
                <h3><span class="flag-emoji">${country.flag}</span> ${country.name}</h3>
                <span class="stability-rating ${overallStabilityClass}">${country.overall_stability}</span>
            </div>
            <p class="overall-briefing">${country.overall_briefing}</p>
            <button class="toggle-details-btn">상세 분석 보고서 보기</button>
            <div class="country-details" style="display: none;">
                <p class="report-intro"><strong>서론:</strong> ${country.report_intro}</p>
                ${categoriesDetailHtml || '<p>상세 분석 데이터가 없습니다.</p>'}
            </div>
        `;
        
        if (index < 3) {
            leftPanel.appendChild(countryCard);
        } else {
            rightPanel.appendChild(countryCard);
        }

        const toggleReportBtn = countryCard.querySelector('.toggle-details-btn');
        const countryDetailsDiv = countryCard.querySelector('.country-details');
        if (toggleReportBtn && countryDetailsDiv) {
            toggleReportBtn.addEventListener('click', () => {
                if (countryDetailsDiv.style.display === 'none') {
                    countryDetailsDiv.style.display = 'block';
                    toggleReportBtn.textContent = '보고서 간략히 보기';
                } else {
                    countryDetailsDiv.style.display = 'none';
                    toggleReportBtn.textContent = '상세 분석 보고서 보기';
                }
            });
        }

        countryCard.querySelectorAll('.toggle-signals-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const signalsContent = btn.nextElementSibling;
                if (signalsContent) {
                    if (signalsContent.style.display === 'none') {
                        signalsContent.style.display = 'block';
                        btn.textContent = '세부 내용 숨기기';
                    } else {
                        signalsContent.style.display = 'none';
                        btn.textContent = '세부 내용 보기';
                    }
                }
            });
        });

        const marker = document.querySelector(`.map-marker.${country.markerClass}`);
        if (marker) {
            marker.addEventListener('click', () => {
                document.querySelectorAll('.country-card').forEach(card => card.classList.remove('active'));
                countryCard.classList.add('active');
                countryCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                if (countryDetailsDiv && countryDetailsDiv.style.display === 'none') {
                    countryDetailsDiv.style.display = 'block';
                    toggleReportBtn.textContent = '보고서 간략히 보기';
                }
            });
        }
    });
}


// =================================================================
// ✨ 3. DOMContentLoaded 이벤트 리스너 (모든 DOM 상호작용 및 이벤트 처리)
// 이 블록 안에서 모든 DOM 요소들을 가져오고, 이벤트 리스너들을 등록합니다.
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    // --- 탭 관련 DOM 요소 ---
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    // --- 챗봇 관련 DOM 요소 ---
    const chatToggleButton = document.getElementById('chat-toggle-button');
    const aiChatPopup = document.getElementById('ai-chat-popup');
    const chatCloseButton = document.getElementById('chat-close-button');
    const userAiInput = document.getElementById('user-ai-input');
    const chatMessages = document.getElementById('chat-messages');

    // --- 게시판 모달 및 폼 관련 DOM 요소 ---
    const modal = document.getElementById('write-modal');
    const showModalBtn = document.getElementById('show-write-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const postForm = document.getElementById('post-form');
    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');
    const closeEditModalBtn = document.getElementById('close-edit-modal');


    // --- 챗봇 버튼 및 팝업의 초기 상태 설정 함수 ---
    function hideChatbotElements() {
        if (chatToggleButton) {
            chatToggleButton.classList.remove('active-tab-button');
            chatToggleButton.style.display = 'none'; // 강제 숨김
        }
        if (aiChatPopup) {
            aiChatPopup.classList.remove('active');
            aiChatPopup.style.display = 'none'; // 메시지 박스도 명시적으로 display: none 적용
        }
    }

    // --- 탭 클릭 이벤트 리스너 ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetContentId = tab.dataset.tab + '-content'; // 예: 'dashboard-content'
            document.getElementById(targetContentId).classList.add('active');
            
            // 데이터 로딩 함수 호출 및 챗봇 버튼 표시/숨김
            if (targetContentId === 'dashboard-content') { // 국제정세 대시보드 탭
                fetchAnalysisReport();
                fetchKoreanNews();
                fetchEnglishNews();
                renderCalendar();
                loadCountryData(); // 국가 데이터 로딩
                // 챗봇 버튼 및 팝업 표시
                if (chatToggleButton) {
                    chatToggleButton.classList.add('active-tab-button');
                    chatToggleButton.style.display = 'flex'; // 명시적으로 display: flex 적용
                }
            } else { // 'home' 탭, 'suggestions' 탭 등 그 외 모든 탭
                if (targetContentId === 'suggestions-content') {
                    loadPosts(); // 게시판 로드
                }
                // 챗봇 버튼 및 팝업 숨김 (강제)
                hideChatbotElements(); // 재사용 가능한 함수 호출
            }
        });
    });

    // --- 초기 페이지 로드 시 활성화될 탭에 따른 챗봇 버튼 상태 설정 ---
    // (예: '홈' 탭이 기본 active인 경우 챗봇 버튼 숨김)
    const initialActiveTabButton = document.querySelector('.tab-button.active');
    if (initialActiveTabButton) {
        const initialTargetContentId = initialActiveTabButton.dataset.tab + '-content';
        if (initialTargetContentId === 'dashboard-content') {
             if (chatToggleButton) {
                chatToggleButton.classList.add('active-tab-button');
                chatToggleButton.style.display = 'flex'; // 명시적으로 display: flex 적용
            }
            loadCountryData(); // 초기 로드 시 대시보드 탭이면 국가 데이터 로딩
        } else {
            hideChatbotElements(); // 초기 탭이 대시보드가 아니면 숨김
        }
    }


    // =================================================================
    // ✨ 챗봇 기능 이벤트 리스너 및 함수 정의
    // =================================================================

    // 챗봇 열고 닫기 토글
    if (chatToggleButton) {
        chatToggleButton.addEventListener('click', () => {
            // 팝업이 숨김 상태일 때만 display 속성 변경 (보이게 할 때)
            if (!aiChatPopup.classList.contains('active')) {
                aiChatPopup.style.display = 'flex';
            }
            aiChatPopup.classList.toggle('active');
            if (aiChatPopup.classList.contains('active')) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
                userAiInput.focus();
            } else {
                // 팝업이 닫힐 때 display 속성 변경 (완전히 숨길 때)
                setTimeout(() => {
                    aiChatPopup.style.display = 'none';
                }, 300); // CSS transition 시간(0.3s)과 맞춤
            }
        });
    }

    if (chatCloseButton) {
        chatCloseButton.addEventListener('click', () => {
            aiChatPopup.classList.remove('active');
            setTimeout(() => {
                aiChatPopup.style.display = 'none';
            }, 300); // CSS transition 시간(0.3s)과 맞춤
        });
    }

    // 사용자 ID (임시)
    const USER_ID = "current_dashboard_user_popup";

    // AI 메시지 전송 함수 (전역 함수로 노출)
    window.sendMessageAI = async function() {
        const message = userAiInput.value.trim();

        if (message === '') return;

        const userDiv = document.createElement('div');
        userDiv.className = 'user-message';
        userDiv.innerText = `나: ${message}`;
        chatMessages.appendChild(userDiv);

        userAiInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'ai-message';
        loadingDiv.innerText = `AI: 답변 생성 중...`;
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch('http://localhost:5000/chat_ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message, user_id: USER_ID })
            });

            const data = await response.json();

            chatMessages.removeChild(loadingDiv);
            const aiDiv = document.createElement('div');
            aiDiv.className = 'ai-message';
            if (data.error) {
                aiDiv.style.color = 'red';
            } else {
                aiDiv.innerText = `AI: ${data.response}`;
            }
            chatMessages.appendChild(aiDiv);

        } catch (error) {
            console.error('Error sending message to AI:', error);
            chatMessages.removeChild(loadingDiv);
            const errorDiv = document.createElement('div');
            errorDiv.className = 'ai-message';
            errorDiv.style.color = 'red';
            errorDiv.innerText = `AI: 네트워크 오류 또는 서버 문제로 답변을 받을 수 없습니다. (${error.message})`;
            chatMessages.appendChild(errorDiv);
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };


    // =================================================================
    // ✨ 게시판 기능 이벤트 리스너 정의
    // =================================================================

    // '새 글 작성하기' 모달 토글
    if (showModalBtn) {
        showModalBtn.addEventListener('click', () => modal.style.display = 'flex');
        closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    // 게시글 등록 폼 제출
    if (postForm) {
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

    // 관리자 답변 제출
    if (postsContainer) { // postsContainer는 여기서 다시 getElementById로 가져올 필요 없이 바로 사용 가능
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

    // '수정/삭제' 버튼 클릭 이벤트 처리
    if (postsContainer) { // postsContainer는 여기서 다시 getElementById로 가져올 필요 없이 바로 사용 가능
        postsContainer.addEventListener('click', async (e) => {
            if (e.target.classList.contains('post-manage-btn')) {
                const postId = e.target.dataset.id;
                const author = e.target.dataset.author;

                const password = prompt(`'${author}'님의 게시글 비밀번호를 입력하세요.`);
                if (!password) return;

                try {
                    const postRef = doc(db, 'suggestions', postId);
                    const docSnap = await getDoc(postRef);

                    if (docSnap.exists() && docSnap.data().password === password) {
                        const action = prompt("'수정' 또는 '삭제'라고 입력하세요.");
                        if (action === '수정') {
                            openEditModal(postId, docSnap.data());
                        } else if (action === '삭제') {
                            deletePost(postId);
                        } else if (action) {
                            alert("잘못된 입력입니다.");
                        }
                    } else {
                        alert("비밀번호가 일치하지 않습니다.");
                    }
                } catch (error) {
                    console.error("Error managing post: ", error);
                    alert("처리 중 오류가 발생했습니다.");
                }
            }
        });
    }

    // 수정 모달창 닫기 버튼
    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', () => {
            editModal.style.display = 'none';
        });
    }

    // 수정 폼 제출 이벤트
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const postId = document.getElementById('edit-post-id').value;
            const newContent = document.getElementById('edit-post-content').value;

            try {
                const postRef = doc(db, 'suggestions', postId);
                await updateDoc(postRef, { content: newContent });
                alert("게시글이 수정되었습니다.");
                editModal.style.display = 'none';
                loadPosts();
            } catch (error) {
                console.error("Error updating document: ", error);
                alert("수정 중 오류가 발생했습니다.");
            }
        });
    }
}); // DOMContentLoaded 닫는 중괄호 (여기서 끝납니다)
