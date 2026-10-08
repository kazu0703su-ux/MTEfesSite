let audioContext;
let oscillator;
let gainNode;

const gameSettings = {
    "easy-game": { minFrequency: 320, maxFrequency: 560, threshold: 10, label: "易" },
    "normal-game": { minFrequency: 320, maxFrequency: 560, threshold: 8, label: "普" },
    "hard-game": { minFrequency: 320, maxFrequency: 560, threshold: 5, label: "厳" },
    "expert-game": { minFrequency: 320, maxFrequency: 560, threshold: 0.5, label: "絶対音感" }
};
const targetFrequencies = {};

function getRandomInteger(minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function setTargetFrequency(gameId) {
    const settings = gameSettings[gameId];
    if (!settings) {
        return;
    }

    targetFrequencies[gameId] = getRandomInteger(
        settings.minFrequency,
        settings.maxFrequency
    );
    console.log(`Target frequency for ${gameId}: ${targetFrequencies[gameId]} Hz`);
}

function getTargetFrequencyForElement(element) {
    const gameSection = element.closest("div[id]");
    if (!gameSection) {
        return null;
    }

    return targetFrequencies[gameSection.id] ?? null;
}

function startGame() {
    document.getElementById("start-page").style.display = "none";
    document.getElementById("difficulty-selection").style.display = "flex";
}

function showIntroduction() {
    document.getElementById("start-page").style.display = "none";
    document.getElementById("introduction").style.display = "flex";
}

function returnToTitle() {
    document.getElementById("introduction").style.display = "none";
    document.getElementById("start-page").style.display = "flex";

    const resultPage = document.getElementById("result-page");
    if (resultPage) {
        resultPage.style.display = "none";
    }

    document.querySelectorAll(".frequency-slider").forEach((slider) => {
        slider.value = 440;
        const output = slider.closest(".answer-control")?.querySelector(".frequency-value");
        if (output) {
            output.textContent = "440";
        }
    });
}

function retryGame() {
    document.getElementById("introduction").style.display = "none";
    document.getElementById("difficulty-selection").style.display = "flex";

    const resultPage = document.getElementById("result-page");
    if (resultPage) {
        resultPage.style.display = "none";
    }

    document.querySelectorAll(".frequency-slider").forEach((slider) => {
        slider.value = 440;
        const output = slider.closest(".answer-control")?.querySelector(".frequency-value");
        if (output) {
            output.textContent = "440";
        }
    });
}


function startDifficultyGame(gameId) {
    document.getElementById("difficulty-selection").style.display = "none";
    document.getElementById(gameId).style.display = "flex";
    setTargetFrequency(gameId);
}

function startEasyGame() {
    startDifficultyGame("easy-game");
}

function startNormalGame() {
    startDifficultyGame("normal-game");
}

function startHardGame() {
    startDifficultyGame("hard-game");
}

function startExpertGame() {
    startDifficultyGame("expert-game");
}

function playTone(frequency = 440) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
}

function stopTone() {
    if (oscillator) {
        oscillator.stop();
        oscillator.disconnect();
        gainNode.disconnect();
        oscillator = null;
        gainNode = null;
    }
}

document.querySelectorAll(".frequency-slider").forEach((slider) => {
    slider.addEventListener("input", (event) => {
        const currentValue = Number(event.target.value);
        const output = event.target
            .closest(".answer-control")
            ?.querySelector(".frequency-value");

        if (!output) {
            return;
        }

        if (Number.isNaN(currentValue)) {
            output.textContent = "エラー: 数値ではありません";
            return;
        }

        output.textContent = currentValue;
    });
});

function submitAnswer() {
    const gameIds = Object.keys(gameSettings);
    const activeGameId = gameIds.find(
        (gameId) => document.getElementById(gameId).style.display === "flex"
    );

    if (!activeGameId) {
        return;
    }

    const gameSection = document.getElementById(activeGameId);
    const answer = getTargetFrequencyForElement(gameSection);
    const currentValue = Number(gameSection.querySelector(".frequency-slider").value);

    if (answer == null || Number.isNaN(currentValue)) {
        return;
    }

    const errorPercent = (Math.abs(answer - currentValue) / 240) * 100;
    const accuracy = 100 - errorPercent;
    const passed = errorPercent <= gameSettings[activeGameId].threshold;

    gameIds.forEach((gameId) => {
        document.getElementById(gameId).style.display = "none";
    });
    showResult(activeGameId, passed, accuracy, answer, currentValue);
}

document.querySelectorAll("button.play-tone-button").forEach((button) => {
    button.addEventListener("mousedown", (event) => {
        const frequency = getTargetFrequencyForElement(event.target);
        playTone(frequency || 1000);
    });

    button.addEventListener("mouseup", stopTone);
    button.addEventListener("mouseleave", stopTone);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        submitAnswer();
    }
});

function showResult(gameId, passed, accuracy, answer, currentValue) {
    const resultPage = document.getElementById("result-page");
    if (!resultPage) {
        return;
    }

    resultPage.style.display = "flex";
    resultPage.innerHTML = "";

    const resultCard = document.createElement("div");
    resultCard.className = "result-card";

    const title = document.createElement("h1");
    title.textContent = `判定: ${passed ? "合格" : "不合格"}`;
    resultCard.appendChild(title);

    const difficulty = document.createElement("h2");
    difficulty.textContent = `難易度: ${gameSettings[gameId].label}`;
    resultCard.appendChild(difficulty);

    const answerSummary = document.createElement("p");
    answerSummary.textContent =
        `精度: ${accuracy.toFixed(2)}% （正答: ${answer}Hz / あなたの回答: ${currentValue}Hz）`;
    answerSummary.className = "result-answer";
    resultCard.appendChild(answerSummary);

    const turnbackButton = document.createElement("button");
    turnbackButton.textContent = "タイトルへ戻る";
    turnbackButton.onclick = () => {
        resultPage.style.display = "none";
        returnToTitle();
    };
    resultCard.appendChild(turnbackButton);
    
    const retryButton = document.createElement("button");
    retryButton.textContent = "もう一回遊ぶ";
    retryButton.onclick = () => {
        resultPage.style.display = "none";
        retryGame();
    };
    resultCard.appendChild(retryButton);

    resultPage.appendChild(resultCard);
}

function showCredits() {
    alert("Thank you for playing! This game was created by a student who my classmate has an absolute pitch . Enjoy the challenge and improve your skills!");
}
