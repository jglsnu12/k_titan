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
// deletePost 함수는 loadPosts를 호출하므로 loadPosts가 DOMContentLoaded 밖에서 정의되어야 합니다.
async function deletePost(postId) {
    if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
        try { await deleteDoc(doc(db, 'suggestions', postId)); alert("게시글이 삭제되었습니다."); loadPosts(); }
        catch (error) { console.error("Error deleting document: ", error); alert("삭제 중 오류가 발생했습니다."); }
    }
}

// --- loadPosts 함수 ---
async function loadPosts() {
    const postsContainer = document.getElementById('posts-container'); // 이 안에서 다시 가져옵니다.
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
// ✨ 지도 마커 위치 조정 함수 및 데이터 (DOMContentLoaded 외부)
// =================================================================

const countryMarkerPositions = {
    usa: { top: 650 / 1385 * 100, left: 350 / 2048 * 100 },    // 미국
    china: { top: 650 / 1385 * 100, left: 1500 / 2048 * 100 },  // 중국
    japan: { top: 700 / 1385 * 100, left: 1770 / 2048 * 100 },  // 일본
    korea: { top: 650 / 1385 * 100, left: 1660 / 2048 * 100 },  // 대한민국
    northkorea: { top: 570 / 1385 * 100, left: 1640 / 2048 * 100 }, // 북한
    russia: { top: 450 / 1385 * 100, left: 1380 / 2048 * 100 }  // 러시아
};

function updateMapMarkerPositions() {
    const mapVisualizationWrapper = document.querySelector('.map-visualization-wrapper');
    const worldMapImage = document.querySelector('.world-map-image');
    if (!worldMapImage || !mapVisualizationWrapper || worldMapImage.naturalWidth === 0) {
        console.warn("Map image not ready or not found for marker positioning. Skipping update.");
        return;
    }
    const mapRect = worldMapImage.getBoundingClientRect();
    const wrapperRect = mapVisualizationWrapper.getBoundingClientRect();
    const mapOffsetX = mapRect.left - wrapperRect.left;
    const mapOffsetY = mapRect.top - wrapperRect.top;
    const actualMapWidth = mapRect.width;
    const actualMapHeight = mapRect.height;
    const mapMarkers = document.querySelectorAll('.map-marker');
    mapMarkers.forEach(marker => {
        const countryId = marker.dataset.countryId;
        const position = countryMarkerPositions[countryId];
        if (position) {
            const markerPixelLeftRelativeToMap = (actualMapHeight * position.left / 100) * 1.4 + actualMapWidth / 2 - actualMapHeight / 2 - 150;
            const markerPixelTopRelativeToMap = (actualMapHeight * position.top / 100);
            const markerPixelLeftRelativeToWrapper = mapOffsetX + markerPixelLeftRelativeToMap;
            const markerPixelTopRelativeToWrapper = mapOffsetY + markerPixelTopRelativeToMap;
            marker.style.left = `${(markerPixelLeftRelativeToWrapper / wrapperRect.width) * 100}%`;
            marker.style.top = `${(markerPixelTopRelativeToWrapper / wrapperRect.height) * 100}%`;
        }
    });
}

function calculateOverallStability(countryData) {
    if (!countryData || !countryData.categories || countryData.categories.length === 0) {
        return { averageScore: 'N/A', stabilityTag: '알 수 없음', stabilityClass: 'unknown' };
    }
    let totalScore = 0;
    let validCategoryCount = 0;
    countryData.categories.forEach(category => {
        if (typeof category.score === 'number' && !isNaN(category.score)) {
            totalScore += category.score;
            validCategoryCount++;
        }
    });
    let averageScore = 'N/A';
    if (validCategoryCount > 0) {
        averageScore = Math.round(totalScore / validCategoryCount);
    }
    let stabilityTag = '알 수 없음';
    let stabilityClass = 'unknown';
    if (typeof averageScore === 'number') {
        if (averageScore >= 81) { stabilityTag = '안정'; stabilityClass = 'stable'; }
        else if (averageScore >= 61) { stabilityTag = '경계'; stabilityClass = 'moderate'; }
        else if (averageScore >= 41) { stabilityTag = '불안'; stabilityClass = 'unstable'; }
        else if (averageScore >= 21) { stabilityTag = '심각'; stabilityClass = 'severe'; }
        else { stabilityTag = '위기'; stabilityClass = 'crisis'; }
    }
    return { averageScore, stabilityTag, stabilityClass };
}

// =================================================================
// ✨ 국가 데이터 로딩 함수 (DOMContentLoaded 외부)
// =================================================================
async function loadCountryData() {
    const leftPanel = document.querySelector('.country-info-panel.left-panel');
    const rightPanel = document.querySelector('.country-info-panel.right-panel');
    const mapVisualizationWrapper = document.querySelector('.map-visualization-wrapper');

    if (!leftPanel || !rightPanel || !mapVisualizationWrapper) {
        console.error("Required map elements not found in loadCountryData.");
        return;
    }

    const mapImageUrl = 'assets/world-map.jpg';
    let mapImage = mapVisualizationWrapper.querySelector('.world-map-image');

    if (!mapImage) {
        mapImage = document.createElement('img');
        mapImage.src = mapImageUrl;
        mapImage.alt = 'World Map';
        mapImage.className = 'world-map-image';
        mapVisualizationWrapper.prepend(mapImage);
    } else {
        if (mapImage.src.indexOf(mapImageUrl) === -1) {
            mapImage.src = mapImageUrl;
        }
    }

    if (mapImage.complete && mapImage.naturalWidth > 0) {
        setTimeout(updateMapMarkerPositions, 50);
    } else {
        mapImage.addEventListener('load', () => setTimeout(updateMapMarkerPositions, 50));
        mapImage.addEventListener('error', () => console.error("DEBUG: Failed to load map image:", mapImageUrl));
    }

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
                console.error(`DEBUG: Failed to load data for ${meta.id}: ${response.status} - ${errorText}`);
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
                switch (meta.id) {
                    case 'usa': countryName = '미국'; countryFlag = '🇺🇸'; break;
                    case 'china': countryName = '중국'; countryFlag = '🇨🇳'; break;
                    case 'japan': countryName = '일본'; countryFlag = '🇯🇵'; break;
                    case 'korea': countryName = '대한민국'; countryFlag = '🇰🇷'; break;
                    case 'northkorea': countryName = '북한'; countryFlag = '🇰🇵'; break;
                    case 'russia': countryName = '러시아'; countryFlag = '🇷🇺'; break;
                    default: countryName = meta.id.toUpperCase(); countryFlag = '❓';
                }
                allCountriesData.push({
                    id: meta.id,
                    name: countryName,
                    flag: countryFlag,
                    overall_stability: data.overall_stability || '알 수 없음',
                    overall_briefing: data.overall_briefing || '보고서 요약 없음.',
                    report_title: data.report_title || `${countryName} 국제 정세 분석 보고서`,
                    report_intro: data.report_intro || '보고서 서론 없음.',
                    categories: data.categories || [],
                    markerClass: meta.id
                });
            }
        } catch (error) {
            console.error(`DEBUG: Error fetching data for ${meta.id}:`, error);
            allCountriesData.push({
                ...meta,
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

            const { averageScore, stabilityTag, stabilityClass } = calculateOverallStability(country);
            const scoreDisplay = document.createElement('div');
            scoreDisplay.className = 'marker-score-display';
            scoreDisplay.innerHTML = `
                <span class="avg-score">${averageScore}점</span>
                <span class="stability-tag ${stabilityClass}">${stabilityTag}</span>
            `;
            const existingScoreDisplay = marker.querySelector('.marker-score-display');
            if (existingScoreDisplay) {
                marker.removeChild(existingScoreDisplay);
            }
            marker.appendChild(scoreDisplay);
        }
    });
}

// =================================================================
// ✨ 3. DOMContentLoaded 이벤트 리스너 (모든 DOM 상호작용 및 이벤트 처리)
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
        }
        if (aiChatPopup) {
            aiChatPopup.classList.remove('active');
        }
    }

    // --- 탭 클릭 이벤트 리스너 ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetContentId = tab.dataset.tab + '-content';
            document.getElementById(targetContentId).classList.add('active');

            // 데이터 로딩 함수 호출 및 챗봇 버튼 표시/숨김
            if (targetContentId === 'dashboard-content') { // 국제정세 대시보드 탭
                fetchAnalysisReport();
                fetchKoreanNews();
                fetchEnglishNews();
                renderCalendar();
                loadCountryData(); // 국가 데이터 로딩
                // 챗봇 버튼 표시
                if (chatToggleButton) {
                    chatToggleButton.classList.add('active-tab-button');
                }
            } else { // 'home' 탭, 'suggestions' 탭 등 그 외 모든 탭
                if (targetContentId === 'suggestions-content') {
                    loadPosts(); // 게시판 로드
                }
                // 챗봇 버튼 및 팝업 숨김
                hideChatbotElements();
            }
        });
    });

    // --- 초기 페이지 로드 시 활성화될 탭에 따른 챗봇 버튼 상태 설정 ---
    const initialActiveTabButton = document.querySelector('.tab-button.active');
    if (initialActiveTabButton) {
        const initialTargetContentId = initialActiveTabButton.dataset.tab + '-content';
        if (initialTargetContentId === 'dashboard-content') {
            if (chatToggleButton) {
                chatToggleButton.classList.add('active-tab-button');
            }
            loadCountryData();
        } else {
            hideChatbotElements();
        }
    }

    // ✨ 창 크기 변경 시 마커 위치 업데이트 이벤트 리스너 추가
    window.addEventListener('resize', updateMapMarkerPositions);

    // =================================================================
    // ✨ 챗봇 기능 이벤트 리스너 및 함수 정의 (✅ 최종 수정 버전)
    // =================================================================
    
    // 챗봇 열고 닫기 토글
    if (chatToggleButton && aiChatPopup) {
        chatToggleButton.addEventListener('click', () => {
            // 'active' 클래스를 토글하여 CSS에서 정의된 모든 스타일을 제어
            aiChatPopup.classList.toggle('active');

            // 팝업이 활성화되면(active 클래스가 추가되면) 입력창에 포커스
            if (aiChatPopup.classList.contains('active')) {
                userAiInput.focus();
            }
        });
    }

    // 챗봇 닫기 버튼
    if (chatCloseButton && aiChatPopup) {
        chatCloseButton.addEventListener('click', () => {
            // 'active' 클래스를 제거하여 팝업을 숨김
            aiChatPopup.classList.remove('active');
        });
    }

    const USER_ID = "current_dashboard_user_popup";

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
            if (data.error) { aiDiv.style.color = 'red'; aiDiv.innerText = `AI: 오류 발생: ${data.error}`; }
            else { aiDiv.innerText = `AI: ${data.response}`; }
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

    if (showModalBtn) {
        showModalBtn.addEventListener('click', () => modal.style.display = 'flex');
        closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    }

    if (postForm) {
        postForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const author = document.getElementById('post-author').value;
            const password = document.getElementById('post-password').value;
            const content = document.getElementById('post-content').value;
            try { await addDoc(collection(db, 'suggestions'), { author, password, content, status: 'unresolved', timestamp: serverTimestamp() }); postForm.reset(); modal.style.display = 'none'; loadPosts(); }
            catch (error) { console.error("Error adding document: ", error); alert("게시글 등록에 실패했습니다."); }
        });
    }

    const postsContainerElement = document.getElementById('posts-container');
    if (postsContainerElement) {
        postsContainerElement.addEventListener('submit', async (e) => {
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

    if (postsContainerElement) {
        postsContainerElement.addEventListener('click', async (e) => {
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
                        if (action === '수정') { openEditModal(postId, docSnap.data()); }
                        else if (action === '삭제') { deletePost(postId); }
                        else if (action) { alert("잘못된 입력입니다."); }
                    } else { alert("비밀번호가 일치하지 않습니다."); }
                } catch (error) { console.error("Error managing post: ", error); alert("처리 중 오류가 발생했습니다."); }
            }
        });
    }

    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', () => { editModal.style.display = 'none'; });
    }

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
            } catch (error) { console.error("Error updating document: ", error); alert("수정 중 오류가 발생했습니다."); }
        });
    }

}); // DOMContentLoaded 닫는 중괄호

// openEditModal 함수를 DOMContentLoaded 밖으로 이동하여 전역 접근 가능하게 함
function openEditModal(postId, postData) {
    const editModal = document.getElementById('edit-modal');
    const editPostId = document.getElementById('edit-post-id');
    const editPostContent = document.getElementById('edit-post-content');

    if (editModal && editPostId && editPostContent) {
        editPostId.value = postId;
        editPostContent.value = postData.content;
        editModal.style.display = 'flex';
    }
}
