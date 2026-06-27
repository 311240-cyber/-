// ⚠️ 請將下方的網址替換成你在 Google Apps Script 部署後得到的「網頁應用程式 URL」
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzisBnw2jYQUp2VWKvo4dTvHkB0w-7RTx4zGwREKpdsX3Gd-OOLwiJhWe2KqsiGPFZP/exec";

// 取得 HTML 元素
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const statusLabel = document.getElementById('status-label');
const workModeBtn = document.getElementById('work-mode');
const breakModeBtn = document.getElementById('break-mode');

// 初始化變數
let countdown;
let timeLeft = 25 * 60; // 預設 25 分鐘
let isRunning = false;
let currentMode = 'work'; // 'work' 或 'break'

// 更新時間畫面顯示
function updateDisplay(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 將資料發送到 Google 試算表
function logToGoogleSheets(modeName) {
    // 如果忘記填網址，在主控台噴出警告，不執行發送
    if (GOOGLE_SCRIPT_URL.includes("請在此處貼上")) {
        console.warn("提示：尚未設定 Google 試算表的 API 網址，跳過雲端記錄。");
        return;
    }

    const data = {
        mode: modeName === 'work' ? '工作專注' : '休息放鬆',
        status: '完成一個番茄鐘 🍅'
    };

    // 使用 fetch 發送 POST 請求到 Google Apps Script
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // 規避瀏覽器的跨網域阻擋
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(() => console.log("成功將專注紀錄同步至 Google 試算表！"))
    .catch(err => console.error("雲端紀錄發送失敗：", err));
}

// 開始倒數
function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    startBtn.disabled = true;
    pauseBtn.disabled = false;

    countdown = setInterval(() => {
        timeLeft--;
        updateDisplay(timeLeft);

        // 時間到
        if (timeLeft <= 0) {
            clearInterval(countdown);
            isRunning = false;
            
            playAlarm(); // 播放聲音
            logToGoogleSheets(currentMode); // 【核心】自動記錄到雲端
            
            // 跳出通知
            alert(currentMode === 'work' ? '工作結束！該休息一下囉 ☕' : '休息結束！準備專注工作 💪');
            resetTimer();
        }
    }, 1000);
}

// 暫停倒數
function pauseTimer() {
    clearInterval(countdown);
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// 重設時間
function resetTimer() {
    clearInterval(countdown);
    isRunning = false;
    timeLeft = currentMode === 'work' ? 25 * 60 : 5 * 60;
    updateDisplay(timeLeft);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// 切換工作或休息模式
function switchMode(mode) {
    currentMode = mode;
    if (mode === 'work') {
        workModeBtn.classList.add('active');
        breakModeBtn.classList.remove('active');
        statusLabel.textContent = '工作時間 🍅';
    } else {
        breakModeBtn.classList.add('active');
        workModeBtn.classList.remove('active');
        statusLabel.textContent = '休息時間 ☕';
    }
    resetTimer();
}

// 播放瀏覽器內建音效
function playAlarm() {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOsc
