const uzbekLetters = [
    'A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'X', 'Y', 'Z',
    'O\'', 'G\'', 'Sh', 'Ch', 'Ng'
];

const letterToSound = {
    'A': 'а', 'B': 'бе', 'D': 'де', 'E': 'е', 'F': 'эф', 'G': 'ге',
    'H': 'ҳа', 'I': 'и', 'J': 'жи', 'K': 'ка', 'L': 'эл', 'M': 'эм',
    'N': 'эн', 'O': 'о', 'P': 'пе', 'Q': 'қа', 'R': 'эр', 'S': 'эс',
    'T': 'те', 'U': 'у', 'V': 'ве', 'X': 'ха', 'Y': 'йе', 'Z': 'зе',
    'O\'': 'ў', 'G\'': 'ғ', 'Sh': 'ша', 'Ch': 'че', 'Ng': 'нг'
};

let selectedLetter = null;
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
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(letterToSound[selectedLetter]);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.6;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;
    
    utterance.onstart = () => {
        statusText.textContent = `🔊 "${selectedLetter}" harfini eshiting...`;
        listenBtn.disabled = true;
    };
    
    utterance.onend = () => {
        statusText.textContent = `Endi siz "${selectedLetter}" harfini aytib ko'ring!`;
        listenBtn.disabled = false;
        recordBtn.disabled = false;
    };
    
    utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        statusText.textContent = '❌ Ovoz xatosi! Qaytadan bosing.';
        listenBtn.disabled = false;
    };
    
    setTimeout(() => {
        window.speechSynthesis.speak(utterance);
    }, 100);
};

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 10;

    let recognitionTimeout;

    recognition.onstart = () => {
        isListening = true;
        recordBtn.classList.add('recording');
        statusText.textContent = '🎤 Tinglayapman... Harfni ayting!';
        
        recognitionTimeout = setTimeout(() => {
            console.log('Recognition timeout - stopping');
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
        clearTimeout(recognitionTimeout);
        console.log('Recognition results:', event.results);
        
        let allTranscripts = [];
        for (let i = 0; i < event.results[0].length; i++) {
            allTranscripts.push(event.results[0][i].transcript);
            console.log(`Alternative ${i}: ${event.results[0][i].transcript} (${event.results[0][i].confidence})`);
        }
        
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        console.log('Primary heard:', transcript);
        checkPronunciation(transcript, allTranscripts);
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
        console.log('Recognition ended');
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
