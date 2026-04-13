// =========================================
// FIREBASE CONFIG
// =========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCnD4eOT-5GP3G_GoM0egblaosY9LzGHeQ",
    authDomain: "stuhelp-bb382.firebaseapp.com",
    projectId: "stuhelp-bb382",
    storageBucket: "stuhelp-bb382.firebasestorage.app",
    messagingSenderId: "136284774173",
    appId: "1:136284774173:web:c11e1fc801f15b76680bf4",
    measurementId: "G-CY183LMXDX"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// =========================================
// Push Notifications & Service Worker Logic
let swRegistration = null;

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(reg => {
        swRegistration = reg;
    }).catch(err => console.error('SW Registration Failed:', err));
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function checkPushBanner() {
    const banner = document.getElementById('push-banner');
    if (!banner) return;
    const asked = localStorage.getItem('push_asked');
    const hasNotif = typeof Notification !== 'undefined';
    if ((hasNotif && Notification.permission === 'granted') || asked) {
        banner.classList.add('hidden');
    } else {
        if (hasNotif) banner.classList.remove('hidden');
        else banner.classList.add('hidden');
    }
}

// Welcome Modal Logic
document.addEventListener('DOMContentLoaded', () => {
    const welcomeModal = document.getElementById('welcome-modal');
    const btnEnter = document.getElementById('btn-enter-stuhelp');
    
    if (welcomeModal && btnEnter) {
        const hasWelcomed = localStorage.getItem('stuhelp_welcomed') === '1';
        if (!hasWelcomed) {
            // Show modal (remove hidden-modal class) after Splash Screen (800ms + 400ms)
            setTimeout(() => {
                welcomeModal.classList.remove('hidden-modal');
            }, 1200);
            
            btnEnter.addEventListener('click', () => {
                welcomeModal.classList.add('hidden-modal');
                localStorage.setItem('stuhelp_welcomed', '1');
                setTimeout(() => {
                    welcomeModal.style.display = 'none';
                }, 500);
            });
        } else {
            // Immediately hide if already visited
            welcomeModal.style.display = 'none';
        }
    }
    
    // Banner listeners
    const btnYes = document.getElementById('btn-push-yes');
    const btnNo = document.getElementById('btn-push-no');
    const banner = document.getElementById('push-banner');

    if (btnYes && btnNo && banner) {
        btnYes.addEventListener('click', () => {
            Notification.requestPermission().then(perm => {
                if(perm === 'granted') {
                    showToast('Уведомления включены!');
                }
                localStorage.setItem('push_asked', 'true');
                banner.classList.add('hidden');
            });
        });

        btnNo.addEventListener('click', () => {
            localStorage.setItem('push_asked', 'true');
            banner.classList.add('hidden');
        });
    }
    
    // Generic event delegation removed. Replaced by handleRespond and handleContact inline.
});

// Screen Management
const screens = {
    splash: document.getElementById('screen-splash'),
    register: document.getElementById('screen-register'),
    otp: document.getElementById('screen-otp'),
    profile: document.getElementById('screen-profile'),
    main: document.getElementById('screen-main'),
    editProfile: document.getElementById('screen-edit-profile'),
    createAd: document.getElementById('screen-create-ad'),
    chatRoom: document.getElementById('screen-chat-room')
};

function navigateTo(targetScreenId) {
    Object.values(screens).forEach(screen => {
        if (!screen) return; // skip null screens
        if (screen.id === targetScreenId) {
            screen.classList.remove('slide-right', 'slide-left');
            screen.classList.add('active');
            if (targetScreenId === 'screen-main') checkPushBanner();
        } else if (screen.classList.contains('active')) {
            screen.classList.remove('active');
            screen.classList.add('slide-left');
        }
    });
}

// User Data Store
const userData = {
    firstName: '',
    lastName: '',
    gender: '',
    birthdate: '',
    uni: ''
};

// 1. Splash Screen Logic & Session Check
let bypassSplash = false;
const savedStore = localStorage.getItem('stuhelp_user');
if (localStorage.getItem('stuhelp_logged_in') === 'true' && savedStore) {
    try {
        const parsed = JSON.parse(savedStore);
        userData.firstName = parsed.firstName || '';
        userData.lastName = parsed.lastName || '';
        userData.gender = parsed.gender || '';
        userData.birthdate = parsed.birthdate || '';
        userData.uni = parsed.university || '';
        
        // Update displays immediately
        document.getElementById('display-name').textContent = (userData.firstName || 'Имя') + ' ' + (userData.lastName || 'Фамилия');
        document.getElementById('display-uni').textContent = userData.uni || 'Университет не выбран';
        
        // Pre-fill edit profile form
        const editFirstName = document.getElementById('edit-first-name');
        const editLastName = document.getElementById('edit-last-name');
        const editGender = document.getElementById('edit-gender');
        const editBirthdate = document.getElementById('edit-birthdate');
        const editUni = document.getElementById('edit-uni');
        if(editFirstName) editFirstName.value = userData.firstName;
        if(editLastName) editLastName.value = userData.lastName;
        if(editGender) editGender.value = userData.gender;
        if(editBirthdate) editBirthdate.value = userData.birthdate;
        if(editUni) editUni.value = userData.uni;

        bypassSplash = true;
        
        // Instantly hide splash and transition to main
        if (screens.splash) {
            screens.splash.style.display = 'none';
        }
        
        setTimeout(() => {
            navigateTo('screen-main');
        }, 10);
    } catch(err) {
        console.error("Session parse err:", err);
    }
}

if (!bypassSplash) {
    setTimeout(() => {
        if (screens.splash) {
            screens.splash.style.display = 'flex'; // restore just in case
            screens.splash.classList.add('fade-out');
        }
        setTimeout(() => navigateTo('screen-register'), 400);
    }, 800);
}

// ── EmailJS Config ────────────────────────────────────────
const EMAILJS_SERVICE_ID  = 'service_7yzwv0n';
const EMAILJS_TEMPLATE_ID = 'template_siv9lk8';
const EMAILJS_PUBLIC_KEY  = '3cy3hBqQ4qfrK_6Eu';

// Инициализация EmailJS
let emailjsReady = false;

function loadEmailJS() {
    return new Promise((resolve, reject) => {
        if (emailjsReady) { resolve(); return; }
        if (typeof emailjs !== 'undefined') {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            emailjsReady = true;
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = () => {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            emailjsReady = true;
            console.log('[EmailJS] Initialized');
            resolve();
        };
        script.onerror = () => reject(new Error('EmailJS failed to load'));
        document.head.appendChild(script);
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function sendCode(email) {
    const code = generateOtp();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 минут

    localStorage.setItem("otp_code", code);
    localStorage.setItem("otp_expires", expiresAt);

    return loadEmailJS().then(() => {
        return emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: email,
            otp_code: code,
            name: 'StuHelp'
        });
    });
}

function verifyCode(inputCode) {
    const savedCode = localStorage.getItem("otp_code");
    const expires = parseInt(localStorage.getItem("otp_expires"));

    if (Date.now() > expires) {
        return "expired";
    }

    if (inputCode === savedCode) {
        return "success";
    }

    return "error";
}

// 2. Registration Logic
const btnGetCode = document.getElementById('btn-get-code');
const emailInput = document.getElementById('email-input');

btnGetCode.addEventListener('click', () => {
    const email = emailInput.value.trim();
    if (!isValidEmail(email)) {
        showToast('Пожалуйста, введите корректный email (содержащий @)');
        return;
    }
    
    btnGetCode.disabled = true;
    btnGetCode.textContent = "Отправка...";
    
    sendCode(email).then(() => {
        btnGetCode.disabled = false;
        btnGetCode.textContent = "Получить код";
        showToast('Код отправлен на ' + email);
        
        // Save user email
        localStorage.setItem("user_email", email);
        
        navigateTo('screen-otp');
        startOtpTimer();
    }).catch((error) => {
        btnGetCode.disabled = false;
        btnGetCode.textContent = "Получить код";
        showToast('Ошибка при отправке. Проверьте консоль.');
        console.error('EmailJS Error:', error);
    });
});

// 3. OTP Verification Logic
const otpBoxes = document.querySelectorAll('.otp-box');
const btnResend = document.getElementById('btn-resend');

// Auto-focus next OTP box
otpBoxes.forEach((box, index) => {
    box.addEventListener('input', (e) => {
        // Only numbers
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        
        if (e.target.value.length === 1) {
            if (index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            } else {
                // Last box filled, verify code
                let fullCode = "";
                otpBoxes.forEach(b => fullCode += b.value);
                
                const status = verifyCode(fullCode);
                if (status === "success") {
                    setTimeout(() => navigateTo('screen-profile'), 300);
                } else if (status === "expired") {
                    showToast('Код истек. Запросите новый.');
                    otpBoxes.forEach(b => b.value = '');
                    otpBoxes[0].focus();
                } else {
                    showToast('Неверный код. Попробуйте еще раз.');
                    otpBoxes.forEach(b => b.value = '');
                    otpBoxes[0].focus();
                }
            }
        }
    });
    // Backspace handling
    box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
            otpBoxes[index - 1].focus();
        }
    });
});

let timer;
let countdownInterval;
function startOtpTimer() {
    btnResend.classList.add('hidden');
    btnResend.disabled = true;
    
    clearTimeout(timer);
    clearInterval(countdownInterval);
    
    let timeLeft = 60; // 60 seconds
    
    const originalText = "отправить повторно";
    btnResend.classList.remove('hidden'); 
    btnResend.textContent = `повторно через ${timeLeft}с`;
    
    countdownInterval = setInterval(() => {
        timeLeft--;
        if(timeLeft > 0) {
            btnResend.textContent = `повторно через ${timeLeft}с`;
        } else {
            clearInterval(countdownInterval);
            btnResend.textContent = originalText;
            btnResend.disabled = false;
        }
    }, 1000);
}

btnResend.addEventListener('click', () => {
    const email = localStorage.getItem("user_email") || emailInput.value.trim();
    if (email) {
        btnResend.disabled = true;
        btnResend.textContent = "Отправка...";
        
        sendCode(email).then(() => {
            showToast('Новый код отправлен!');
            otpBoxes.forEach(box => box.value = '');
            otpBoxes[0].focus();
            startOtpTimer();
        }).catch((err) => {
            showToast('Ошибка при отправке.');
            btnResend.disabled = false;
            btnResend.textContent = "отправить повторно";
        });
    }
});



// 4. Profile Logic
const btnProfileNext = document.getElementById('btn-profile-next');


btnProfileNext.addEventListener('click', () => {
    const firstName = document.getElementById('first-name').value;
    const lastName = document.getElementById('last-name').value;
    const gender = document.querySelector('input[name="gender"]:checked');
    const uniInput = document.getElementById('uni-input');
    const uni = uniInput ? uniInput.value : '';
    
    // Save to user data
    userData.firstName = firstName.trim();
    userData.lastName = lastName.trim();
    userData.gender = gender ? (gender.value === 'male' ? 'Мужской' : 'Женский') : '';
    userData.uni = uni.trim();

    // Set display values in Profile tab
    document.getElementById('display-name').textContent = (userData.firstName || 'Имя') + ' ' + (userData.lastName || 'Фамилия');
    document.getElementById('display-uni').textContent = userData.uni || 'Университет не выбран';

    if (firstName && lastName && gender) {
        saveSessionAndNavigate();
    } else {
        // Just for prototype, allow moving forward even if empty
        saveSessionAndNavigate();
    }

    function saveSessionAndNavigate() {
        localStorage.setItem('stuhelp_user', JSON.stringify({
            email: localStorage.getItem('user_email') || 'user@gmail.com',
            firstName: userData.firstName,
            lastName: userData.lastName,
            gender: userData.gender,
            birthdate: userData.birthdate,
            university: userData.uni,
            registeredAt: Date.now()
        }));
        localStorage.setItem('stuhelp_logged_in', 'true');
        navigateTo('screen-main');
    }
});

// 5. Bottom Navigation Logic
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Reset active nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Hide all tabs
        tabPanes.forEach(tab => tab.classList.remove('active'));
        
        // Show target tab
        const targetId = item.getAttribute('data-target');
        if (targetId) {
            document.getElementById(targetId).classList.add('active');
        }
    });
});

// 6. University Bottom Sheet Logic (Shared)
const btnOpenUni = document.getElementById('open-uni-sheet');
const btnCloseUni = document.getElementById('close-uni-sheet');
const uniBottomSheet = document.getElementById('uni-bottom-sheet');
const uniSearch = document.getElementById('uni-search');
const uniItems = document.querySelectorAll('.uni-item:not(.option-item)');

let activeUniInput = document.getElementById('uni-input'); // tracks which input gets the text

function toggleUniSheet(show) {
    if (show) {
        uniBottomSheet.classList.add('open');
        uniSearch.focus();
    } else {
        uniBottomSheet.classList.remove('open');
        uniSearch.value = '';
        uniItems.forEach(item => item.style.display = 'block');
    }
}

if (btnOpenUni && btnCloseUni && uniBottomSheet) {
    btnOpenUni.addEventListener('click', () => {
        activeUniInput = document.getElementById('uni-input');
        toggleUniSheet(true);
    });
    
    btnCloseUni.addEventListener('click', () => toggleUniSheet(false));

    uniSearch.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        uniItems.forEach(item => {
            const match = item.textContent.toLowerCase().includes(term);
            item.style.display = match ? 'block' : 'none';
        });
    });

    uniItems.forEach(item => {
        item.addEventListener('click', () => {
            if (activeUniInput) activeUniInput.value = item.textContent;
            toggleUniSheet(false);
        });
    });
}

// 7. Edit Profile Screen Logic
const btnEditProfile = document.querySelector('.btn-edit-profile');
const btnEditBack = document.getElementById('btn-edit-back');
const btnSaveProfile = document.getElementById('btn-save-profile');

const editFirstName = document.getElementById('edit-first-name');
const editLastName = document.getElementById('edit-last-name');
const editGender = document.getElementById('edit-gender');
const editBirthdate = document.getElementById('edit-birthdate');
const editUni = document.getElementById('edit-uni');

if (btnEditProfile) {
    btnEditProfile.addEventListener('click', () => {
        // Hide error message if previously shown
        const errorMsg = document.getElementById('edit-profile-error');
        if (errorMsg) errorMsg.style.display = 'none';

        // Pre-fill form from userData
        editFirstName.value = userData.firstName;
        editLastName.value = userData.lastName;
        editGender.value = userData.gender;
        editBirthdate.value = userData.birthdate;
        editUni.value = userData.uni;

        navigateTo('screen-edit-profile');
    });
}

if (btnEditBack) {
    btnEditBack.addEventListener('click', () => {
        navigateTo('screen-main');
    });
}

if (btnSaveProfile) {
    btnSaveProfile.addEventListener('click', () => {
        const fName = editFirstName.value.trim();
        const lName = editLastName.value.trim();
        const gender = editGender.value.trim();
        const bDate = editBirthdate.value.trim();
        const uni = editUni.value.trim();

        const errorMsg = document.getElementById('edit-profile-error');

        // Check required fields
        if (!fName || !lName || !gender || !bDate || !uni) {
            if (errorMsg) errorMsg.style.display = 'block';
            return; // Do not save and do not navigate
        }
        
        if (errorMsg) errorMsg.style.display = 'none';

        // Save new values
        userData.firstName = fName;
        userData.lastName = lName;
        userData.gender = gender;
        userData.birthdate = bDate;
        userData.uni = uni;

        // Update main profile display with new values
        document.getElementById('display-name').textContent = fName + ' ' + lName;
        document.getElementById('display-uni').textContent = uni;

        setTimeout(() => {
            navigateTo('screen-main');
        }, 200);
    });
}

// 8. Gender Bottom Sheet
const openGenderSheet = document.getElementById('open-gender-sheet');
const genderBottomSheet = document.getElementById('gender-bottom-sheet');
const closeGenderSheet = document.getElementById('close-gender-sheet');
const genderItems = genderBottomSheet ? genderBottomSheet.querySelectorAll('.option-item') : [];

function toggleGenderSheet(show) {
    if (show) genderBottomSheet.classList.add('open');
    else genderBottomSheet.classList.remove('open');
}

if (openGenderSheet) openGenderSheet.addEventListener('click', () => toggleGenderSheet(true));
if (closeGenderSheet) closeGenderSheet.addEventListener('click', () => toggleGenderSheet(false));

genderItems.forEach(item => {
    item.addEventListener('click', () => {
        if(editGender) editGender.value = item.getAttribute('data-value');
        toggleGenderSheet(false);
    });
});

// 9. Re-use University Bottom Sheet for Edit Profile
const openEditUniSheet = document.getElementById('open-edit-uni-sheet');
if (openEditUniSheet) {
    openEditUniSheet.addEventListener('click', () => {
        activeUniInput = editUni;
        toggleUniSheet(true);
    });
}

// 10. Custom Date Picker Generator
const openDateSheet = document.getElementById('open-date-sheet');
const dateBottomSheet = document.getElementById('date-bottom-sheet');
const closeDateSheet = document.getElementById('close-date-sheet');
const btnConfirmDate = document.getElementById('btn-confirm-date');

const colDay = document.getElementById('col-day');
const colMonth = document.getElementById('col-month');
const colYear = document.getElementById('col-year');

const monthsRu = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

let curDay = 1, curMonth = 0, curYear = 2000;

let isRendering = false;

function renderDateCols() {
    if (!colDay) return;
    isRendering = true;
    
    let maxDays = new Date(curYear, curMonth + 1, 0).getDate();
    
    let dayHTML = '';
    for(let i=1; i<=maxDays; i++) dayHTML += `<div class="date-item ${i===curDay?'selected':''}">${i}</div>`;
    colDay.innerHTML = dayHTML;

    let monthHTML = '';
    monthsRu.forEach((m, idx) => monthHTML += `<div class="date-item ${idx===curMonth?'selected':''}">${m}</div>`);
    colMonth.innerHTML = monthHTML;

    let yearHTML = '';
    for(let i=1970; i<=2010; i++) yearHTML += `<div class="date-item ${i===curYear?'selected':''}">${i}</div>`;
    colYear.innerHTML = yearHTML;
    
    // Use a small timeout to let the DOM update before observing scroll changes
    setTimeout(() => {
        isRendering = false;
    }, 50);
}

function handleDateScroll(col, type) {
    if (isRendering) return;
    
    let items = col.querySelectorAll('.date-item');
    if (items.length === 0) return;
    
    let centerIndex = Math.round(col.scrollTop / 40);
    if(centerIndex < 0) centerIndex = 0;
    if(centerIndex >= items.length) centerIndex = items.length - 1;
    
    items.forEach(el => el.classList.remove('selected'));
    if(items[centerIndex]) items[centerIndex].classList.add('selected');

    let oldMonth = curMonth;
    let oldYear = curYear;

    if(type === 'd') curDay = parseInt(items[centerIndex].textContent);
    if(type === 'm') curMonth = centerIndex;
    if(type === 'y') curYear = parseInt(items[centerIndex].textContent);

    if(type === 'm' || type === 'y') {
        if (oldMonth === curMonth && oldYear === curYear) return;
        
        let maxDays = new Date(curYear, curMonth + 1, 0).getDate();
        if(curDay > maxDays) curDay = maxDays;
        
        // Efficiently update only the days column to avoid resetting month/year scrolls
        isRendering = true;
        let dayHTML = '';
        for(let i=1; i<=maxDays; i++) {
            dayHTML += `<div class="date-item ${i===curDay?'selected':''}">${i}</div>`;
        }
        colDay.innerHTML = dayHTML;
        colDay.scrollTop = (curDay - 1) * 40;
        
        setTimeout(() => {
            isRendering = false;
        }, 50);
    }
}

if(colDay) {
    colDay.addEventListener('scroll', () => handleDateScroll(colDay, 'd'));
    colMonth.addEventListener('scroll', () => handleDateScroll(colMonth, 'm'));
    colYear.addEventListener('scroll', () => handleDateScroll(colYear, 'y'));
}

function toggleDateSheet(show) {
    if (show) {
        dateBottomSheet.classList.add('open');
        renderDateCols();
        setTimeout(() => {
            colDay.scrollTop = (curDay - 1) * 40;
            colMonth.scrollTop = curMonth * 40;
            colYear.scrollTop = (curYear - 1970) * 40;
        }, 10);
    } else {
        dateBottomSheet.classList.remove('open');
    }
}

if (openDateSheet) openDateSheet.addEventListener('click', () => toggleDateSheet(true));
if (closeDateSheet) closeDateSheet.addEventListener('click', () => toggleDateSheet(false));
if (btnConfirmDate) {
    btnConfirmDate.addEventListener('click', () => {
        let fDay = curDay < 10 ? '0'+curDay : curDay;
        let fMonth = (curMonth + 1) < 10 ? '0'+(curMonth + 1) : (curMonth + 1);
        if(editBirthdate) editBirthdate.value = `${fDay}.${fMonth}.${curYear}`;
        toggleDateSheet(false);
    });
}

// 7. Create Ad Screen Logic
const screenCreateAd = document.getElementById('screen-create-ad');
if(screenCreateAd) screens['createAd'] = screenCreateAd;

const btnOpenCreateAd = document.getElementById('btn-open-create-ad');
const btnCreateAdBack = document.getElementById('btn-create-ad-back');

let myAds = []; // will be loaded from Firebase
let allFirebaseAds = []; // ALL ads from all users
let stuhelpResponses = JSON.parse(localStorage.getItem('stuhelp_responses')) || [];
let stuhelpChats = JSON.parse(localStorage.getItem('stuhelp_chats')) || [];
let editingAdId = null;
let editingAdFirebaseId = null; // Firebase document ID for editing

// Load ALL ads from Firebase in real-time
function initFirebaseAds() {
    const adsQuery = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
    onSnapshot(adsQuery, (snapshot) => {
        allFirebaseAds = [];
        myAds = [];
        const currentUserEmail = localStorage.getItem('user_email') || '';
        snapshot.forEach(docSnap => {
            const ad = { ...docSnap.data(), firebaseId: docSnap.id };
            allFirebaseAds.push(ad);
            if (ad.authorEmail === currentUserEmail) {
                myAds.push(ad);
            }
        });
        renderAds();
        renderMessages();
        renderChats();
    });
}

if(btnOpenCreateAd) btnOpenCreateAd.addEventListener('click', () => {
    editingAdId = null;
    const titleEl = document.getElementById('create-ad-title');
    if (titleEl) titleEl.textContent = "Создать объявление";
    
    document.getElementById('ad-specialty').value = '';
    document.getElementById('ad-description').value = '';
    document.getElementById('ad-price').value = '';
    const ac = document.getElementById('ad-char-counter');
    if(ac) ac.textContent = '0 / 500';
    
    document.querySelectorAll('.urgency-pill').forEach(p => p.classList.remove('active'));
    if(document.getElementById('ad-urgency')) document.getElementById('ad-urgency').value = '';
    
    navigateTo('screen-create-ad');
});

if(btnCreateAdBack) btnCreateAdBack.addEventListener('click', () => navigateTo('screen-profile'));

window.editAd = function(id) {
    const ad = myAds.find(a => a.id == id);
    if (!ad) return;
    
    editingAdId = id;
    const titleEl = document.getElementById('create-ad-title');
    if (titleEl) titleEl.textContent = "Редактировать объявление";
    
    document.getElementById('ad-specialty').value = ad.specialty;
    document.getElementById('ad-description').value = ad.description;
    document.getElementById('ad-price').value = ad.price;
    document.getElementById('ad-urgency').value = ad.urgency;
    const ac = document.getElementById('ad-char-counter');
    if(ac) ac.textContent = ad.description.length + " / 500";
    
    document.querySelectorAll('.urgency-pill').forEach(p => p.classList.remove('active'));
    if (ad.urgency) {
        const pillToActive = document.querySelector(`.urgency-pill.${ad.urgency}`);
        if(pillToActive) pillToActive.classList.add('active');
    }
    
    navigateTo('screen-create-ad');
};

let deletingAdId = null;
const deleteModal = document.getElementById('delete-confirm-modal');
window.confirmDeleteAd = function(id) {
    deletingAdId = id;
    if(deleteModal) {
        deleteModal.classList.remove('hidden-modal');
        deleteModal.style.display = 'flex';
    }
}
document.getElementById('btn-cancel-delete')?.addEventListener('click', () => {
    deletingAdId = null;
    if(deleteModal) {
        deleteModal.classList.add('hidden-modal');
        setTimeout(() => deleteModal.style.display = 'none', 300);
    }
});
document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
    if (deletingAdId !== null) {
        const adToDelete = myAds.find(a => a.id == deletingAdId);
        if (adToDelete && adToDelete.firebaseId) {
            deleteDoc(doc(db, 'ads', adToDelete.firebaseId))
                .then(() => showToast("Объявление удалено"))
                .catch(() => showToast("Ошибка при удалении"));
        }
    }
    deletingAdId = null;
    if(deleteModal) {
        deleteModal.classList.add('hidden-modal');
        setTimeout(() => deleteModal.style.display = 'none', 300);
    }
});

function renderAds() {
    const feedContainer = document.getElementById('feed-container');
    const myAdsContainer = document.getElementById('my-ads-container');
    
    if(myAdsContainer) {
        myAdsContainer.innerHTML = '';
        if(myAds.length === 0) {
            myAdsContainer.innerHTML = `
                <div class="my-ads-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    <p>У вас еще нет объявлений</p>
                </div>
            `;
        }
        
        myAds.forEach(ad => {
            let urgText = '';
            if (ad.urgency === 'high') urgText = '🔴 Высокая';
            else if (ad.urgency === 'medium') urgText = '🟡 Средняя';
            else if (ad.urgency === 'low') urgText = '🟢 Низкая';
            
            let priceText = ad.price === 'Договорная' ? ad.price : ad.price + ' тг';
            
            const cardP = document.createElement('div');
            cardP.className = 'ad-card fade-slide-in';
            cardP.innerHTML = `
                <div class="ad-card-header">
                    <div class="ad-card-price">${priceText}</div>
                    ${ad.urgency ? `<div class="ad-card-urgency ${ad.urgency}">${urgText}</div>` : ''}
                </div>
                <div class="ad-card-spec">${ad.specialty}</div>
                <div class="ad-card-desc" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${ad.description}</div>
                <div class="ad-card-actions">
                    <button class="btn-card secondary" onclick="editAd(${ad.id})">Редактировать</button>
                    <button class="btn-card danger" onclick="confirmDeleteAd(${ad.id})">Удалить</button>
                </div>
            `;
            myAdsContainer.prepend(cardP);
        });
    }

    if(feedContainer) {
        feedContainer.innerHTML = '';
        const allAds = [...allFirebaseAds]; // ALL ads from ALL users via Firebase
        
        allAds.forEach(ad => {
            let urgText = '';
            if (ad.urgency === 'high') urgText = '🔴 Высокая';
            else if (ad.urgency === 'medium') urgText = '🟡 Средняя';
            else if (ad.urgency === 'low') urgText = '🟢 Низкая';
            
            let priceText = ad.price === 'Договорная' ? ad.price : ad.price + ' тг';
            
            const card = document.createElement('div');
            card.className = 'ad-card fade-slide-in';
            if (ad.urgency) card.setAttribute('data-urgency', ad.urgency);
            card.innerHTML = `
                <div class="ad-card-header">
                    <div class="ad-card-price">${priceText}</div>
                    ${ad.urgency ? `<div class="ad-card-urgency ${ad.urgency}">${urgText}</div>` : ''}
                </div>
                <div style="font-size: 0.8rem; color: #aaa; margin-bottom: 5px;">${ad.authorName || 'Пользователь'} • ${ad.authorUni || 'Университет'}</div>
                <div class="ad-card-spec">${ad.specialty}</div>
                <div class="ad-card-desc">${ad.description}</div>
                <div class="ad-card-actions">
                    <button class="btn-card primary" onclick="handleRespond(${ad.id})">Откликнуться</button>
                    <button class="btn-card secondary" onclick="handleContact(${ad.id})">Связаться</button>
                </div>
            `;
            feedContainer.prepend(card);
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    initFirebaseAds(); // loads all ads from Firebase in real-time
    renderMessages();
    renderChats();
});

// Form Logic: Character counter
const adDescription = document.getElementById('ad-description');
const adCharCounter = document.getElementById('ad-char-counter');
if(adDescription && adCharCounter) {
    adDescription.addEventListener('input', () => {
        let len = adDescription.value.length;
        adCharCounter.textContent = `${len} / 500`;
        // enforce max length visually or via attributes
        if(len > 500) {
            adCharCounter.style.color = '#ff4d4d';
        } else {
            adCharCounter.style.color = 'rgba(255, 255, 255, 0.4)';
        }
    });
}

// Form Logic: Urgency Pills
const urgencyPills = document.querySelectorAll('.urgency-pill');
const adUrgency = document.getElementById('ad-urgency');
urgencyPills.forEach(pill => {
    pill.addEventListener('click', () => {
        urgencyPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        if(pill.classList.contains('high')) adUrgency.value = 'high';
        if(pill.classList.contains('medium')) adUrgency.value = 'medium';
        if(pill.classList.contains('low')) adUrgency.value = 'low';
    });
});



// Publish Button and Feed Logic
const btnPublishAd = document.getElementById('btn-publish-ad');
const feedContainer = document.getElementById('feed-container');

if(btnPublishAd && feedContainer) {
    btnPublishAd.addEventListener('click', () => {
        const specialty = document.getElementById('ad-specialty').value || 'Не указано';
        const description = document.getElementById('ad-description').value || 'Без описания';
        const price = document.getElementById('ad-price').value || 'Договорная';
        const urgency = document.getElementById('ad-urgency') ? document.getElementById('ad-urgency').value : '';



        if (editingAdId !== null) {
            // Update in Firebase
            const adToUpdate = myAds.find(a => a.id == editingAdId);
            if (adToUpdate && adToUpdate.firebaseId) {
                updateDoc(doc(db, 'ads', adToUpdate.firebaseId), { specialty, description, price, urgency })
                    .then(() => showToast("Объявление обновлено!"))
                    .catch(() => showToast("Ошибка при обновлении"));
            }
        } else {
            // Save new ad to Firebase
            const authorEmail = localStorage.getItem('user_email') || 'test@test.com';
            const authorName = (userData.firstName || 'Имя') + ' ' + (userData.lastName || 'Фамилия');
            const authorUni = userData.uni || 'Университет не выбран';

            const newAd = {
                id: Date.now(),
                specialty,
                description,
                price,
                urgency,
                authorEmail,
                authorName,
                authorUni,
                createdAt: Date.now()
            };

            addDoc(collection(db, 'ads'), newAd)
                .then(() => {
                    showToast("Объявление опубликовано!");
                    if (Notification.permission === 'granted' && swRegistration) {
                        swRegistration.showNotification('Объявление опубликовано!', {
                            body: `Ваше задание по специальности "${specialty}" успешно размещено.`,
                            icon: "https://img.icons8.com/color/48/000000/info--v1.png"
                        });
                    }
                })
                .catch(() => showToast("Ошибка при публикации"));
        }

        // Navigate and switch tabs
        navigateTo('screen-main');
        
        // Find and click the profile tab icon to make it active 
        const profileTabBtn = document.querySelector('.nav-item[data-target="tab-profile"]');
        if(profileTabBtn) profileTabBtn.click();
        
        // Scroll to top
        const mainContent = document.querySelector('.main-content');
        if(mainContent) mainContent.scrollTop = 0;
    });
}

// Feed Filter Logic
const filterPills = document.querySelectorAll('.feed-filter-pill');
filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
        const filterVal = pill.getAttribute('data-filter');
        const isActive = pill.classList.contains('active');
        
        // Reset all pills
        filterPills.forEach(p => p.classList.remove('active'));
        
        if (!isActive) {
            // Activate clicked pill
            pill.classList.add('active');
            filterFeed(filterVal);
        } else {
            // Deactivate and show all
            filterFeed('all');
        }
    });
});

function filterFeed(urgencyFilter) {
    if(!feedContainer) return;
    const cards = feedContainer.querySelectorAll('.ad-card');
    cards.forEach(card => {
        if (urgencyFilter === 'all') {
            card.style.display = 'block';
        } else {
            const cardUrgency = card.getAttribute('data-urgency');
            if (cardUrgency === urgencyFilter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

// Specialty Bottom Sheet Logic
const specBottomSheet = document.getElementById('spec-bottom-sheet');
const openSpecSheet = document.getElementById('open-spec-sheet');
const closeSpecSheet = document.getElementById('close-spec-sheet');
const specSearch = document.getElementById('spec-search');
const specSearchClear = document.getElementById('spec-search-clear');
const specList = document.getElementById('spec-list');
const adSpecialtyInput = document.getElementById('ad-specialty');

function toggleSpecSheet(show) {
    if (show) {
        specBottomSheet.classList.add('open');
        renderSpecialties(""); // initial render all
        if(specSearch) {
            specSearch.value = "";
            specSearchClear.style.display = "none";
        }
    } else {
        specBottomSheet.classList.remove('open');
    }
}

if(openSpecSheet) openSpecSheet.addEventListener('click', () => toggleSpecSheet(true));
if(closeSpecSheet) closeSpecSheet.addEventListener('click', () => toggleSpecSheet(false));

if(specSearchClear) {
    specSearchClear.addEventListener('click', () => {
        specSearch.value = "";
        specSearchClear.style.display = "none";
        renderSpecialties("");
        specSearch.focus();
    });
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Render specialties dynamically
function renderSpecialties(query = "") {
    if(!specList || typeof specialtiesData === 'undefined') return;
    
    // Group specialties by category
    const grouped = {
        "Бакалавриат": [],
        "Магистратура": [],
        "Докторантура PhD": []
    };
    
    // Process query
    const lowerQuery = query.toLowerCase().trim();
    let regex = null;
    if (lowerQuery) {
        // Find matches exactly as user typed (case-insensitive)
        regex = new RegExp(`(${escapeRegExp(lowerQuery)})`, 'gi');
    }

    specialtiesData.forEach(item => {
        const matchCode = lowerQuery ? item.code.toLowerCase().includes(lowerQuery) : true;
        const matchName = lowerQuery ? item.name.toLowerCase().includes(lowerQuery) : true;
        
        if (matchCode || matchName) {
            let displayCode = item.code;
            let displayName = item.name;
            
            // Apply highlighting if there's a query and minimal length passed (1+ char)
            if (regex) {
                if(matchCode) displayCode = item.code.replace(regex, '<span class="search-highlight">$1</span>');
                if(matchName) displayName = item.name.replace(regex, '<span class="search-highlight">$1</span>');
            }
            
            if(grouped[item.category]) {
                grouped[item.category].push({
                    originalName: item.name,
                    htmlCode: displayCode,
                    htmlName: displayName
                });
            }
        }
    });

    let html = "";
    let totalResults = 0;
    
    for (const [category, items] of Object.entries(grouped)) {
        if (items.length > 0) {
            totalResults += items.length;
            html += `<div class="sheet-category-header">${category} (${items.length})</div>`;
            items.forEach(it => {
                html += `
                    <div class="spec-item" data-value="${it.originalName}">
                        <div class="spec-code">${it.htmlCode}</div>
                        <div>${it.htmlName}</div>
                    </div>`;
            });
        }
    }
    
    if (totalResults === 0) {
        html = `<div class="empty-search-msg">Ничего не найдено по запросу «${query}»</div>`;
    }
    
    // Fade animation effect when updating list
    specList.style.opacity = '0';
    setTimeout(() => {
        specList.innerHTML = html;
        specList.style.opacity = '1';
        
        // Add click listeners to new items
        const specItems = specList.querySelectorAll('.spec-item');
        specItems.forEach(item => {
            item.addEventListener('click', () => {
                const specName = item.getAttribute('data-value');
                if(adSpecialtyInput) adSpecialtyInput.value = specName;
                toggleSpecSheet(false);
            });
        });
    }, 150);
}

// Search input listener
if(specSearch) {
    specSearch.addEventListener('input', (e) => {
        const val = e.target.value;
        if(val.length > 0) {
            specSearchClear.style.display = "flex";
        } else {
            specSearchClear.style.display = "none";
        }
        renderSpecialties(val);
    });
}

// =========================================
// INTERACTION LOGIC (Respond / Contact)
// =========================================

function handleRespond(adId) {
    const allAds = [...allFirebaseAds];
    const ad = allAds.find(a => a.id == adId);
    if (!ad) return;

    const currentUserEmail = localStorage.getItem('user_email') || 'test@test.com';
    // Own ad protection - do nothing silently
    if (ad.authorEmail === currentUserEmail) return;

    // Check if already responded
    const alreadyResponded = stuhelpResponses.find(r => r.adId == adId && r.responderEmail === currentUserEmail);
    if (alreadyResponded) {
        showToast('Вы уже откликнулись на это задание!');
        return;
    }

    const currentUserName = (userData.firstName || 'Имя') + ' ' + (userData.lastName || 'Фамилия');
    const currentUserUni = userData.uni || 'Университет не выбран';

    const newResponse = {
        id: Date.now(),
        adId: ad.id,
        adSpecialty: ad.specialty,
        responderName: currentUserName,
        responderUni: currentUserUni,
        responderEmail: currentUserEmail,
        authorEmail: ad.authorEmail,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + ', ' + new Date().toLocaleDateString()
    };

    stuhelpResponses.push(newResponse);
    localStorage.setItem('stuhelp_responses', JSON.stringify(stuhelpResponses));
    
    showToast('Вы откликнулись на задание!');
    renderMessages();
}

function handleContact(adId) {
    const allAds = [...allFirebaseAds];
    const ad = allAds.find(a => a.id == adId);
    if (!ad) return;

    const currentUserEmail = localStorage.getItem('user_email') || 'test@test.com';
    // Own ad protection - do nothing silently
    if (ad.authorEmail === currentUserEmail) return;

    // Check if chat already exists
    let chat = stuhelpChats.find(c => 
        (c.user1Email === currentUserEmail && c.user2Email === ad.authorEmail) ||
        (c.user1Email === ad.authorEmail && c.user2Email === currentUserEmail)
    );

    const currentUserName = (userData.firstName || 'Имя') + ' ' + (userData.lastName || 'Фамилия');
    const currentUserUni = userData.uni || 'Университет не выбран';

    if (!chat) {
        // Create new chat
        chat = {
            id: 'chat_' + Date.now(),
            user1Email: currentUserEmail,
            user1Name: currentUserName,
            user1Uni: currentUserUni,
            user2Email: ad.authorEmail,
            user2Name: ad.authorName,
            user2Uni: ad.authorUni,
            messages: []
        };
        stuhelpChats.push(chat);
        localStorage.setItem('stuhelp_chats', JSON.stringify(stuhelpChats));
        renderChats();
    }

    // Select the chat tab automatically
    const chatTabBtn = document.querySelector('.nav-item[data-target="tab-chat"]');
    if(chatTabBtn) chatTabBtn.click();

    // Go to chat room directly
    openChatRoom(chat.id);
}

// =========================================
// MESSAGES TAB (Почта)
// =========================================
function renderMessages() {
    const container = document.getElementById('messages-container');
    const emptyState = document.getElementById('messages-empty-state');
    if (!container) return;

    const currentUserEmail = localStorage.getItem('user_email') || 'test@test.com';
    const myIncomingResponses = stuhelpResponses.filter(r => r.authorEmail === currentUserEmail);

    // clear except empty state
    container.innerHTML = '';
    
    if (myIncomingResponses.length === 0) {
        if(emptyState) {
            emptyState.style.display = 'block';
            container.appendChild(emptyState);
        }
        return;
    }

    // reverse to show newest first
    [...myIncomingResponses].reverse().forEach(resp => {
        const card = document.createElement('div');
        card.className = 'response-card fade-slide-in';
        card.innerHTML = `
            <div class="response-header">
                <div class="response-name">${resp.responderName}</div>
                <div class="response-time">${resp.timestamp}</div>
            </div>
            <div class="response-uni">${resp.responderUni}</div>
            <div class="response-spec">${resp.adSpecialty}</div>
        `;
        container.appendChild(card);
    });
}

// =========================================
// CHAT TAB & CHAT ROOM (Общение)
// =========================================
function renderChats() {
    const container = document.getElementById('chat-list-container');
    const emptyState = document.getElementById('chat-empty-state');
    if (!container) return;

    const currentUserEmail = localStorage.getItem('user_email') || 'test@test.com';
    const myChats = stuhelpChats.filter(c => c.user1Email === currentUserEmail || c.user2Email === currentUserEmail);

    container.innerHTML = '';
    
    if (myChats.length === 0) {
        if(emptyState) {
            emptyState.style.display = 'block';
            container.appendChild(emptyState);
        }
        return;
    }

    [...myChats].reverse().forEach(chat => {
        // determine the "other" user
        const isUser1 = chat.user1Email === currentUserEmail;
        const otherName = isUser1 ? chat.user2Name : chat.user1Name;
        const avatarLetter = (otherName || 'U').charAt(0).toUpperCase();

        const lastMsgObj = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1] : null;
        let lastMsgText = "Нет сообщений";
        if (lastMsgObj) {
            const prefix = lastMsgObj.senderEmail === currentUserEmail ? "Вы: " : "";
            lastMsgText = prefix + lastMsgObj.text;
        }

        const item = document.createElement('div');
        item.className = 'chat-item fade-slide-in';
        item.onclick = () => openChatRoom(chat.id);
        item.innerHTML = `
            <div class="chat-avatar">${avatarLetter}</div>
            <div class="chat-info">
                <div class="chat-name">${otherName}</div>
                <div class="chat-last-msg">${lastMsgText}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

let currentChatId = null;

function openChatRoom(chatId) {
    currentChatId = chatId;
    const chat = stuhelpChats.find(c => c.id === chatId);
    if (!chat) return;

    const currentUserEmail = localStorage.getItem('user_email') || 'test@test.com';
    const isUser1 = chat.user1Email === currentUserEmail;
    const otherName = isUser1 ? chat.user2Name : chat.user1Name;
    const otherUni = isUser1 ? chat.user2Uni : chat.user1Uni;

    // Mark unread incoming messages as read
    let updated = false;
    chat.messages.forEach(m => {
        if (m.senderEmail !== currentUserEmail && !m.isRead) {
            m.isRead = true;
            updated = true;
        }
    });
    if (updated) {
        localStorage.setItem('stuhelp_chats', JSON.stringify(stuhelpChats));
        renderChats(); // to update read status in the main list if applicable
    }

    const chatRoomName = document.getElementById('chat-room-name');
    const chatRoomUni = document.getElementById('chat-room-uni');
    if(chatRoomName) chatRoomName.textContent = otherName;
    if(chatRoomUni) chatRoomUni.textContent = otherUni;

    renderChatMessages();

    // Transition to chat screen
    const chatScreen = document.getElementById('screen-chat-room');
    const mainScreen = document.getElementById('screen-main');
    
    if (chatScreen && mainScreen) {
        mainScreen.classList.remove('active');
        mainScreen.classList.add('slide-left');
        
        chatScreen.classList.remove('slide-right', 'slide-left');
        chatScreen.classList.add('active');
    }
}

function renderChatMessages() {
    const container = document.getElementById('chat-messages-container');
    if (!container) return;
    
    container.innerHTML = '';
    const chat = stuhelpChats.find(c => c.id === currentChatId);
    if (!chat) return;

    const currentUserEmail = localStorage.getItem('user_email') || 'test@test.com';

    chat.messages.forEach(m => {
        const isMine = m.senderEmail === currentUserEmail;
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${isMine ? 'sent' : 'received'} fade-slide-in`;
        
        let checkmarksHtml = '';
        if (isMine) {
            if (m.isRead) {
                checkmarksHtml = `<span class="checkmarks read">✓✓</span>`;
            } else {
                checkmarksHtml = `<span class="checkmarks unread">✓</span>`;
            }
        }
        
        bubble.innerHTML = `
            ${m.text}
            <div class="msg-meta">
                <span class="msg-time">${m.time}</span>
                ${checkmarksHtml}
            </div>
        `;
        container.appendChild(bubble);
    });

    // scroll to bottom
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);
}

const btnChatBack = document.getElementById('btn-chat-back');
if (btnChatBack) {
    btnChatBack.addEventListener('click', () => {
        currentChatId = null;
        renderChats(); // re-render to update last message
        const chatScreen = document.getElementById('screen-chat-room');
        const mainScreen = document.getElementById('screen-main');
        
        if (chatScreen && mainScreen) {
            chatScreen.classList.remove('active');
            chatScreen.classList.add('slide-right');
            
            mainScreen.classList.remove('slide-left');
            mainScreen.classList.add('active');
        }
    });
}

const btnSendMessage = document.getElementById('btn-send-message');
const chatInputField = document.getElementById('chat-input-field');

function sendMessage() {
    if (!currentChatId) return;
    const text = chatInputField.value.trim();
    if (!text) return;

    const chat = stuhelpChats.find(c => c.id === currentChatId);
    if (!chat) return;

    const currentUserEmail = localStorage.getItem('user_email') || 'test@test.com';
    
    const newMsg = {
        senderEmail: currentUserEmail,
        text: text,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        isRead: false
    };

    chat.messages.push(newMsg);
    localStorage.setItem('stuhelp_chats', JSON.stringify(stuhelpChats));
    
    chatInputField.value = '';
    renderChatMessages();
}

if (btnSendMessage) {
    btnSendMessage.addEventListener('click', sendMessage);
}

if (chatInputField) {
    chatInputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}
