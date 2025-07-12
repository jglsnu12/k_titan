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


// --- 💡 탭 전환 로직 ---
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');


    const chatToggleButton = document.getElementById('chat-toggle-button');
    const aiChatPopup = document.getElementById('ai-chat-popup');
    const chatCloseButton = document.getElementById('chat-close-button');
    const userAiInput = document.getElementById('user-ai-input');
    const chatMessages = document.getElementById('chat-messages');
    
    if (chatToggleButton) { // 요소가 존재하는지 확인 (안전성)
        chatToggleButton.classList.remove('active-tab-button'); // 혹시 모를 상황 대비하여 클래스 제거
        chatToggleButton.style.display = 'none'; // CSS !important가 있음에도 강제로 JS에서 초기 숨김
    }
    if (aiChatPopup) {
        aiChatPopup.classList.remove('active'); // 팝업 닫기
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const targetContentId = tab.dataset.tab + '-content';
            document.getElementById(targetContentId).classList.add('active');
            
            // Call data loading functions when respective tabs are active
            if (targetContentId === 'suggestions-content') {
                loadPosts();
            } else if (targetContentId === 'dashboard-content') {
                fetchAnalysisReport();
                fetchKoreanNews();
                fetchEnglishNews();
                renderCalendar(); // ✨ NEW: Call renderCalendar for dashboard tab

                // ✨ '국제정세 대시보드' 탭 활성화 시 챗봇 버튼 표시
                if (chatToggleButton) {
                    chatToggleButton.classList.add('active-tab-button');
                    chatToggleButton.style.display = 'flex'; // 명시적으로 display 설정
                }
            } else {
                // ✨ 다른 탭 활성화 시 챗봇 버튼 숨김
                if (chatToggleButton) {
                    chatToggleButton.classList.remove('active-tab-button');
                    chatToggleButton.style.display = 'none'; // 명시적으로 display 설정
                }
                // 만약 챗봇 팝업이 열려있었다면 닫습니다.
                if (aiChatPopup && aiChatPopup.classList.contains('active')) {
                    aiChatPopup.classList.remove('active');
                }
            }
        });
    });


    // Initial load for the active tab (assuming 'home' is active by default)
    // If 'dashboard' is active by default, you'd call its functions here too.
    // Since you provided 'home' as active in index.html, only analysis/news are called.
    // If you want dashboard to load on startup, set it to active in index.html
    // and call its functions here.
    // fetchAnalysisReport(); // These will be called when dashboard-content is activated
    // fetchKoreanNews();     // Or if dashboard-content is the initial active tab
    // fetchEnglishNews();
});


// --- ✨ AI 분석 보고서 가져오기 함수 (구조 분석 로직으로 대폭 수정) ---
async function fetchAnalysisReport() {
    const reportContainer = document.getElementById('analysis-report-container');
    if (!reportContainer) return; // Add check if element exists (for other tabs)
    const reportUrl = 'https://raw.githubusercontent.com/jglsnu12/k_titan/main/final_analysis_report.txt';

    try {
        const response = await fetch(reportUrl);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }
        const reportText = await response.text();

        // --- ✨ 새로운 지능형 파싱 로직 ---
        let htmlContent = '';
        const lines = reportText.split('\n');
        let inList = false;

        lines.forEach(line => {
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold text

            if (line.startsWith('## ')) {
                if (inList) { htmlContent += '</ul>'; inList = false; }
                htmlContent += `<h2>${line.substring(3)}</h2>`;
            } else if (line.startsWith('* ')) {
                if (!inList) { htmlContent += '<ul>'; inList = true; }
                htmlContent += `<li>${line.substring(2)}</li>`;
            } else if (line.trim() === '') {
                if (inList) { htmlContent += '</ul>'; inList = false; }
                // Do nothing for empty lines between paragraphs
            } else {
                if (inList) { htmlContent += '</ul>'; inList = false; }
                htmlContent += `<p>${line}</p>`;
            }
        });

        if (inList) { htmlContent += '</ul>'; } // Close last list if any
        
        reportContainer.innerHTML = htmlContent;

    } catch (error) {
        reportContainer.innerHTML = `<p class="error-message">종합 분석 보고서를 불러오는 데 실패했습니다. (에러: ${error.message})</p>`;
    }
}


async function fetchKoreanNews() {
    const newsContainer = document.getElementById('korean-news-container');
    if (!newsContainer) return;
    newsContainer.innerHTML = '<p class="loading">연합뉴스 [정치] 기사를 테스트 중...</p>';

    // ✨ 1. 정치 카테고리 RSS 주소 하나만 지정합니다.
    const politicsRssUrl = 'https://www.yna.co.kr/rss/northkorea.xml';

    try {
        // ✨ 2. fetch 요청을 한 번만 보냅니다.
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(politicsRssUrl)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        // ✨ 3. Promise.all 없이 JSON 결과를 바로 받습니다.
        const result = await response.json();
        const allItems = result.items || []; // result.items가 바로 기사 배열입니다.

        newsContainer.innerHTML = ''; 
        if (allItems.length === 0) {
            newsContainer.innerHTML = '<p class="no-data">표시할 뉴스가 없습니다.</p>';
            return;
        }

        allItems.forEach(item => {
            const articleElement = document.createElement('div');
            articleElement.className = 'news-article';
            
            const description = item.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...';
            
            // ✨ 4. 카테고리를 '정치'로 고정합니다.
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
    } catch (error) {
        newsContainer.innerHTML = `<p class="error-message">국내 뉴스를 불러오는 데 실패했습니다. (에러: ${error.message})</p>`;
    }
}

async function fetchEnglishNews() {
    const newsContainer = document.getElementById('english-news-container');
    if (!newsContainer) return; // Add check if element exists
    const apiKey = '6c141a3bf180fef4f3b57f0d560c1e4e'; // 본인의 GNews 키를 입력하세요.
    const categories = ['world', 'nation', 'business', 'technology'];

    try {
        const responses = await Promise.all(categories.map(category => fetch(`https://gnews.io/api/v4/top-headlines?lang=en&category=${category}&max=10&apikey=${apiKey}`)));
        for (const response of responses) if (!response.ok) throw new Error(`API Error`);
        const jsonResults = await Promise.all(responses.map(res => res.json()));
        const allArticles = jsonResults.flatMap(result => result.articles || []).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        newsContainer.innerHTML = '';
        if (allArticles.length === 0) {
            newsContainer.innerHTML = '<p class="no-data">No English news to display.</p>';
            return;
        }
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
        newsContainer.innerHTML = `<p class="error-message">해외 뉴스를 불러오는 데 실패했습니다. (에러: ${error.message})</p>`;
    }
}

// =================================================================
// ✨ NEW: 국제 정세 캘린더 렌더링 함수
// =================================================================

function renderCalendar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight for consistent date comparison

    // Manually entered event data
    const events = [
        // --- Upcoming Events (Dates after current date: July 12, 2025) ---
        { date: '2025-07-20', description: 'G7 정상회담', countries: ['🇯🇵', '🇺🇸', '🇬🇧', '🇫🇷', '🇩🇪', '🇮🇹', '🇨🇦'] },
        { date: '2025-07-25', description: '유럽중앙은행(ECB) 통화정책회의', countries: ['🇪🇺'] },
        { date: '2025-08-01', description: '미국-중국 전략 경제 대화', countries: ['🇺🇸', '🇨🇳'] },
        { date: '2025-08-15', description: '광복절 기념식 (한국)', countries: ['🇰🇷'] },
        { date: '2025-09-05', description: 'UN 총회 개막', countries: ['🇺🇳'] },
        { date: '2025-09-10', description: '한미일 안보 협의체 회의', countries: ['🇰🇷', '🇺🇸', '🇯🇵'] },
        { date: '2025-09-20', description: '독일 총선', countries: ['🇩🇪'] },
        // --- Past Events (Dates before current date: July 12, 2025) ---
        { date: '2025-07-11', description: '미국 소비자물가지수(CPI) 발표', countries: ['🇺🇸'] }, // Yesterday
        { date: '2025-07-10', description: 'G20 외교장관 회의', countries: ['🇰🇷', '🇺🇸', '🇯🇵', '🇨🇳'] },
        { date: '2025-07-09', description: '한미 연합 군사훈련 \'프리덤 실드\' 실시', countries: ['🇰🇷', '🇺🇸'] },
        { date: '2025-06-30', description: 'APEC 제1차 고위관리회의', countries: ['🇰🇷', '🇯🇵', '🇨🇳', '🇺🇸'] },
        { date: '2025-06-25', description: '브릭스(BRICS) 정상회담', countries: ['🇧🇷', '🇷🇺', '🇮🇳', '🇨🇳', '🇿🇦'] },
        // Add more events here
    ];

    const upcomingList = document.getElementById('upcoming-list');
    const pastList = document.getElementById('past-list');

    if (!upcomingList || !pastList) return; // Ensure elements exist

    // Add eventDate Date object to each event for easier comparison and sorting
    events.forEach(event => {
        event.eventDate = new Date(event.date);
    });

    // Filter and sort events
    const sortedUpcoming = events.filter(event => event.eventDate >= today)
                                 .sort((a, b) => a.eventDate - b.eventDate); // Ascending order for upcoming
    const sortedPast = events.filter(event => event.eventDate < today)
                             .sort((a, b) => b.eventDate - a.eventDate);     // Descending order for past (most recent first)

    function renderEventList(listElement, eventArray) {
        listElement.innerHTML = ''; // Clear previous list items
        if (eventArray.length === 0) {
            listElement.innerHTML = '<li class="no-data-item">일정이 없습니다.</li>';
            return;
        }

        eventArray.forEach(event => {
            const listItem = document.createElement('li');
            listItem.classList.add('event-item');

            const formattedDate = new Date(event.date).toLocaleDateString('ko-KR', {
                month: 'numeric',
                day: 'numeric'
            }) + ' (' + ['일', '월', '화', '수', '목', '금', '토'][new Date(event.date).getDay()] + ')';

            const flagsHtml = event.countries.map(flagEmoji => {
                // For simplicity, using flag emojis directly in span.
                // If you want SVG images, you'd need a robust emoji-to-ISO conversion.
                // The previous flagToIso function is a simple example.
                // For optimal performance, include only necessary SVG files or use a reliable CDN.
                return `<span class="flag-emoji">${flagEmoji}</span>`;
            }).join('');

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

// =================================================================
// ✨ 4. 게시판 기능 (파일 하단에 추가)
// =================================================================

const postsContainer = document.getElementById('posts-container');
const modal = document.getElementById('write-modal');
const showModalBtn = document.getElementById('show-write-modal');
const closeModalBtn = document.getElementById('close-modal');
const postForm = document.getElementById('post-form');

function formatPostContent(content) {
    return content
        .trim()         // 앞뒤 공백 제거
        .replace(/\n\s*\n/g, '\n')      // 빈 줄 제거
        .replace(/(\r\n|\r|\n){2,}/g, '\n')  // 2줄 이상 연속 줄바꿈을 한 줄로
        .replace(/\n/g, '<br>');            // \n을 <br>로 바꿈
}

// 기존 loadPosts 함수를 찾아서 아래 내용으로 전체 교체해주세요.
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
        
        // ✨ '관리' 버튼이 포함된 HTML로 변경
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

// =================================================================
// ✨ 5. 게시글 수정/삭제 기능 (파일 하단에 추가)
// =================================================================

const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeEditModalBtn = document.getElementById('close-edit-modal');

// '수정/삭제' 버튼 클릭 이벤트 처리
if (postsContainer) {
    postsContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('post-manage-btn')) {
            const postId = e.target.dataset.id;
            const author = e.target.dataset.author;

            const password = prompt(`'${author}'님의 게시글 비밀번호를 입력하세요.`);
            if (!password) return; // 사용자가 취소한 경우

            try {
                // Firestore에서 해당 게시물의 비밀번호 확인
                const postRef = doc(db, 'suggestions', postId);
                const docSnap = await getDoc(postRef);

                if (docSnap.exists() && docSnap.data().password === password) {
                    // 비밀번호 일치
                    const action = prompt("'수정' 또는 '삭제'라고 입력하세요.");
                    if (action === '수정') {
                        openEditModal(postId, docSnap.data());
                    } else if (action === '삭제') {
                        deletePost(postId);
                    } else if (action) {
                        alert("잘못된 입력입니다.");
                    }
                } else {
                    // 비밀번호 불일치 또는 게시물 없음
                    alert("비밀번호가 일치하지 않습니다.");
                }
            } catch (error) {
                console.error("Error managing post: ", error);
                alert("처리 중 오류가 발생했습니다.");
            }
        }
    });
}

// 수정 모달 열기
function openEditModal(postId, postData) {
    document.getElementById('edit-post-id').value = postId;
    document.getElementById('edit-post-content').textContent = postData.content;
    editModal.style.display = 'flex';
}

// 게시글 삭제 처리
async function deletePost(postId) {
    if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
        try {
            await deleteDoc(doc(db, 'suggestions', postId));
            alert("게시글이 삭제되었습니다.");
            loadPosts();
        } catch (error) {
            console.error("Error deleting document: ", error);
            alert("삭제 중 오류가 발생했습니다.");
        }
    }
}

// 수정 모달창 닫기 버튼
if(closeEditModalBtn) {
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
            await updateDoc(postRef, {
                content: newContent
            });
            alert("게시글이 수정되었습니다.");
            editModal.style.display = 'none';
            loadPosts();
        } catch (error) {
            console.error("Error updating document: ", error);
            alert("수정 중 오류가 발생했습니다.");
        }
    });
}


// 챗봇 열고 닫기 토글
chatToggleButton.addEventListener('click', () => {
    aiChatPopup.classList.toggle('active');
    if (aiChatPopup.classList.contains('active')) {
        chatMessages.scrollTop = chatMessages.scrollHeight; // 열릴 때 스크롤 하단으로
        userAiInput.focus(); // 입력 필드에 포커스
    }
});

chatCloseButton.addEventListener('click', () => {
    aiChatPopup.classList.remove('active');
});

// 사용자 ID는 간단한 예시를 위해 하드코딩. 실제 서비스에서는 로그인 사용자 ID 등을 사용해야 함.
const USER_ID = "current_dashboard_user_popup"; // 기존과 충돌하지 않도록 다른 ID 사용

// AI 메시지 전송 함수
async function sendMessageAI() {
    const message = userAiInput.value.trim();

    if (message === '') return;

    // 사용자 메시지 표시
    const userDiv = document.createElement('div');
    userDiv.className = 'user-message';
    userDiv.innerText = `나: ${message}`;
    chatMessages.appendChild(userDiv);

    userAiInput.value = ''; // 입력 필드 초기화
    chatMessages.scrollTop = chatMessages.scrollHeight; // 스크롤 하단으로

    // AI 응답 로딩 메시지
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-message';
    loadingDiv.innerText = `AI: 답변 생성 중...`;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // 백엔드 서버의 /chat_ai 엔드포인트로 요청
        // 서버 주소는 Flask 앱이 실행되는 주소와 포트로 설정 (예: http://localhost:5000)
        const response = await fetch('http://localhost:5000/chat_ai', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message, user_id: USER_ID })
        });

        const data = await response.json();

        // 로딩 메시지 제거 후 AI 응답 표시
        chatMessages.removeChild(loadingDiv);
        const aiDiv = document.createElement('div');
        aiDiv.className = 'ai-message';
        if (data.error) {
            aiDiv.style.color = 'red';
            aiDiv.innerText = `AI: 오류 발생: ${data.error}`;
        } else {
            aiDiv.innerText = `AI: ${data.response}`;
        }
        chatMessages.appendChild(aiDiv);

    } catch (error) {
        console.error('Error sending message to AI:', error);
        chatMessages.removeChild(loadingDiv); // 로딩 메시지 제거
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ai-message';
        errorDiv.style.color = 'red';
        errorDiv.innerText = `AI: 네트워크 오류 또는 서버 문제로 답변을 받을 수 없습니다. (${error.message})`;
        chatMessages.appendChild(errorDiv);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 전역 스코프에서 sendMessageAI 함수를 사용할 수 있도록 window 객체에 할당
// (HTML의 onclick="sendMessageAI()"에서 호출하기 위함)
window.sendMessageAI = sendMessageAI;

// --- AI 챗봇 팝업 기능 끝 ---

