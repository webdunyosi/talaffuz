const uzbekLetters = [
    'A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z',
    'O\'', 'G\'', 'Sh', 'Ch', 'Ng'
];

const letterToSound = {
    'A': 'а', 'B': 'бэ', 'D': 'дэ', 'E': 'э', 'F': 'эф', 'G': 'гэ',
    'H': 'ха', 'I': 'и', 'J': 'жи', 'K': 'ка', 'L': 'эл', 'M': 'эм',
    'N': 'эн', 'O': 'о', 'P': 'пэ', 'Q': 'ка', 'R': 'эр', 'S': 'эс',
    'T': 'тэ', 'U': 'у', 'V': 'вэ', 'X': 'ха', 'Y': 'йэ', 'Z': 'зэ',
    'O\'': 'ў', 'G\'': 'ға', 'Sh': 'ша', 'Ch': 'ча', 'Ng': 'нг'
};

const letterToAudioFile = {
    'A': 'A.mp3', 'B': 'B.mp3', 'D': 'D.mp3', 'E': 'E.mp3', 'F': 'F.mp3', 'G': 'G.mp3',
    'H': 'H.mp3', 'I': 'I.mp3', 'J': 'J.mp3', 'K': 'K.mp3', 'L': 'L.mp3', 'M': 'M.mp3',
    'N': 'N.mp3', 'O': 'O.mp3', 'P': 'P.mp3', 'Q': 'Q.mp3', 'R': 'R.mp3', 'S': 'S.mp3',
    'T': 'T.mp3', 'U': 'U.mp3', 'V': 'V.mp3', 'X': 'X.mp3', 'Y': 'Y.mp3', 'Z': 'Z.mp3',
    'O\'': 'O.mp3', 'G\'': 'G.mp3', 'Sh': 'Sh.mp3', 'Ch': 'Ch.mp3', 'Ng': 'Ng.mp3'
};

let selectedLetter = null;
let currentAudio = null;
let recognition = null;
let isListening = false;

const lettersGrid = document.getElementById('lettersGrid');
const listenBtn = document.getElementById('listenBtn');
const recordBtn = document.getElementById('recordBtn');
const statusText = document.getElementById('statusText');
const resultBox = document.getElementById('resultBox');
const resultContent = document.getElementById('resultContent');

uzbekLetters.forEach(letter => {
    const btn = document.createElement('button');
    btn.className = 'letter-btn';
    btn.textContent = letter;
    btn.onclick = () => selectLetter(letter, btn);
    lettersGrid.appendChild(btn);
});

function selectLetter(letter, btnElement) {
    document.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    selectedLetter = letter;
    listenBtn.disabled = false;
    recordBtn.disabled = true;
    statusText.textContent = `"${letter}" harfi tanlandi. Eshitish tugmasini bosing!`;
    resultBox.style.display = 'none';
}

listenBtn.onclick = () => {
    if (!selectedLetter) return;
    
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    
    const audioFileName = letterToAudioFile[selectedLetter];
    currentAudio = new Audio(`audio/${audioFileName}`);
    
    statusText.textContent = `🔊 "${selectedLetter}" harfini eshiting...`;
    listenBtn.disabled = true;
    
    currentAudio.onloadeddata = () => {
        console.log('Audio loaded successfully');
    };
    
    currentAudio.onplay = () => {
        console.log('Audio playing');
    };
    
    currentAudio.onended = () => {
        statusText.textContent = `Endi siz "${selectedLetter}" harfini aytib ko'ring!`;
        listenBtn.disabled = false;
        recordBtn.disabled = false;
        console.log('Audio ended');
    };
    
    currentAudio.onerror = (e) => {
        console.error('Audio error:', e);
        statusText.textContent = `⚠️ "${selectedLetter}" uchun audio fayl topilmadi. Speech synthesis ishlatilmoqda...`;
        
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(letterToSound[selectedLetter]);
        utterance.lang = 'ru-RU';
        utterance.rate = 0.5;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onend = () => {
            statusText.textContent = `Endi siz "${selectedLetter}" harfini aytib ko'ring!`;
            listenBtn.disabled = false;
            recordBtn.disabled = false;
        };
        
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 100);
    };
    
    currentAudio.play().catch(err => {
        console.error('Play error:', err);
        statusText.textContent = '❌ Ovoz xatosi! Qaytadan bosing.';
        listenBtn.disabled = false;
    });
};

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 10;

    let recognitionTimeout;
    let timeoutOccurred = false;

    recognition.onstart = () => {
        isListening = true;
        recordBtn.classList.add('recording');
        statusText.textContent = '🎤 Tinglayapman... Harfni ayting!';
        timeoutOccurred = false;
        
        recognitionTimeout = setTimeout(() => {
            console.log('Recognition timeout - stopping');
            timeoutOccurred = true;
            recognition.stop();
        }, 5000);
    };

    recognition.onspeechstart = () => {
        console.log('Speech detected!');
        statusText.textContent = '🎤 Eshitilyapti...';
    };

    recognition.onspeechend = () => {
        console.log('Speech ended');
        clearTimeout(recognitionTimeout);
    };

    recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const result = event.results[last];
        const isFinal = result.isFinal;
        
        console.log('Recognition results:', event.results, 'isFinal:', isFinal);
        
        let allTranscripts = [];
        for (let i = 0; i < result.length; i++) {
            allTranscripts.push(result[i].transcript);
            console.log(`Alternative ${i}: ${result[i].transcript} (${result[i].confidence})`);
        }
        
        const transcript = result[0].transcript.trim().toLowerCase();
        console.log('Primary heard:', transcript, 'isFinal:', isFinal);
        
        if (transcript.length > 0) {
            clearTimeout(recognitionTimeout);
            timeoutOccurred = false;
            recognition.stop();
            statusText.textContent = '🔍 Tekshirilmoqda...';
            setTimeout(() => {
                checkPronunciation(transcript, allTranscripts);
            }, 100);
        }
    };

    recognition.onerror = (event) => {
        clearTimeout(recognitionTimeout);
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            statusText.textContent = '❌ Ovoz eshitilmadi! Qayta bosing va balandroq gapiring.';
        } else if (event.error === 'not-allowed') {
            statusText.textContent = '⚠️ Mikrofon ruxsati berilmagan! Brauzer sozlamalarini tekshiring.';
        } else {
            statusText.textContent = '❌ Xatolik! Qayta urinib ko\'ring.';
        }
        recordBtn.classList.remove('recording');
        isListening = false;
    };

    recognition.onend = () => {
        clearTimeout(recognitionTimeout);
        recordBtn.classList.remove('recording');
        isListening = false;
        console.log('Recognition ended, timeout occurred:', timeoutOccurred);
        
        if (timeoutOccurred) {
            resultBox.className = 'result-box result-wrong';
            resultContent.innerHTML = `❌ Vaqt tugadi!<br>Siz hech narsa demaganingiz yoki juda sekin gapirdingiz`;
            resultBox.style.display = 'block';
            statusText.textContent = `Qayta urinib ko'ring! "${selectedLetter}" harfini aytishingiz kerak.`;
            timeoutOccurred = false;
        }
    };
} else {
    recordBtn.disabled = true;
    statusText.textContent = '⚠️ Brauzeringiz ovozni taniy olmaydi. Chrome yoki Edge ishlatib ko\'ring.';
}

recordBtn.onclick = async () => {
    if (!selectedLetter || !recognition) return;
    
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted');
    } catch (err) {
        console.error('Microphone access denied:', err);
        statusText.textContent = '⚠️ Mikrofon ruxsati kerak! Brauzer sozlamalarini tekshiring.';
        return;
    }
    
    if (!isListening) {
        try {
            recognition.start();
            console.log('Recognition started');
        } catch (err) {
            console.error('Recognition start error:', err);
        }
    }
};

function checkPronunciation(spokenText, alternatives = []) {
    console.log('Checking pronunciation for:', selectedLetter);
    console.log('Spoken:', spokenText);
    console.log('Alternatives:', alternatives);
    
    const correctSound = letterToSound[selectedLetter].toLowerCase();
    const spokenLower = spokenText.toLowerCase().trim();
    
    let detectedLetter = null;
    
    const allPossible = [spokenText, ...alternatives];
    for (const text of allPossible) {
        const textLower = text.toLowerCase().trim();
        const firstChar = textLower.charAt(0);
        
        console.log('Checking first char:', firstChar);
        
        for (const [letter, sound] of Object.entries(letterToSound)) {
            const soundLower = sound.toLowerCase();
            if (firstChar === soundLower.charAt(0) || textLower.includes(soundLower)) {
                detectedLetter = letter;
                console.log('Detected letter:', letter);
                break;
            }
        }
        if (detectedLetter) break;
    }
    
    if (!detectedLetter) {
        detectedLetter = spokenLower.charAt(0).toUpperCase();
    }
    
    console.log('Final detected:', detectedLetter, 'Expected:', selectedLetter);
    
    if (detectedLetter === selectedLetter) {
        resultBox.className = 'result-box result-correct';
        resultContent.innerHTML = `✅ Juda yaxshi!<br>"${selectedLetter}" to'g'ri!`;
        resultBox.style.display = 'block';
        statusText.textContent = '🎉 To\'g\'ri! Boshqa harfni tanlang.';
        
        setTimeout(() => {
            document.querySelectorAll('.letter-btn').forEach(b => b.classList.remove('active'));
            selectedLetter = null;
            listenBtn.disabled = true;
            recordBtn.disabled = true;
            resultBox.style.display = 'none';
            statusText.textContent = 'Harfni tanlang va eshiting!';
        }, 3000);
    } else {
        resultBox.className = 'result-box result-wrong';
        resultContent.innerHTML = `❌ Xato!<br>Siz "${detectedLetter}" deb aytdingiz<br>Kerak: "${selectedLetter}"`;
        resultBox.style.display = 'block';
        statusText.textContent = `Qayta urinib ko'ring! "${selectedLetter}" harfini aytishingiz kerak.`;
    }
}

function findClosestLetter(spokenText) {
    let closest = null;
    let maxMatch = 0;
    
    for (const [letter, sound] of Object.entries(letterToSound)) {
        const normalizedSound = sound.toLowerCase().replace(/[^\wа-яўғқҳ]/gi, '');
        
        if (spokenText.includes(normalizedSound) || normalizedSound.includes(spokenText)) {
            const matchLength = Math.min(spokenText.length, normalizedSound.length);
            if (matchLength > maxMatch) {
                maxMatch = matchLength;
                closest = letter;
            }
        }
    }
    
    return closest || '?';
}
