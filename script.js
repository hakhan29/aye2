const video = document.getElementById('video');
const expressionDiv = document.getElementById('expression');
const colorBox = document.getElementById('colorBox'); 
const clickText = document.getElementById('clickText');
const title = document.querySelector('h1');
const subtitle = document.querySelector('p');

// 초기 상태: 클릭 텍스트를 필요할 때만 표시
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        clickText.style.display = 'block'; // 화면 초기 표시
    }, 3000); // 페이드인 후 나타나도록 지연
});

// 클릭 시 이벤트: 감정 인식 준비
clickText.addEventListener('click', () => {
    clickText.style.display = 'none'; // 클릭 후 텍스트 숨김
    title.style.display = 'none';
    subtitle.textContent = "잠시 후 카메라가 켜집니다. 카메라를 보며 담고 싶은 감정을 표정으로 드러내주세요.";
    setTimeout(() => {
        subtitle.style.display = 'none';
        startVideo();
        video.style.display = 'block';
        colorBox.style.display = 'block';
        expressionDiv.style.display = 'block';
    }, 3000); // 안내 문구 후 3초 대기
});

// 모델 파일 로드
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.faceExpressionNet.loadFromUri('./models')
]);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => video.srcObject = stream)
        .catch(err => console.error(err));
}

video.addEventListener('play', () => {
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions();

        if (detections.length > 0) {
            const expressions = detections[0].expressions;

            const anger = expressions.anger || 0;
            const happy = expressions.happy || 0;
            const sad = expressions.sad || 0;
            const neutral = expressions.neutral || 0;
            const surprised = expressions.surprised || 0;
            const fear = expressions.fear || 0;

            // 색상 계산
            const red = Math.round(
                anger * 255 +
                happy * 255 +
                surprised * 255 +
                fear * 128
            );
            const green = Math.round(
                happy * 255 +
                neutral * 255 +
                surprised * 165
            );
            const blue = Math.round(
                sad * 255 +
                neutral * 255 +
                fear * 255
            );

            const textColor = `rgb(${red}, ${green}, ${blue})`;

            // 가장 비율이 높은 감정 찾기
            const highestExpression = Object.keys(expressions).reduce((a, b) =>
                expressions[a] > expressions[b] ? a : b
            );

            // 감정별 색상 지정
            const emotionColors = {
                anger: 'rgb(255, 0, 0)',
                happy: 'rgb(255, 255, 0)',
                sad: 'rgb(0, 0, 255)',
                neutral: 'rgb(128, 128, 128)',
                surprised: 'rgb(255, 165, 0)',
                fear: 'rgb(128, 0, 128)',
            };

            const dominantColor = emotionColors[highestExpression] || 'white';

            // 색상 적용
            colorBox.style.background = `linear-gradient(to bottom, ${textColor}, ${dominantColor})`;

            // 텍스트 업데이트
            if (expressionDiv.textContent !== `Detected Expression: ${highestExpression}`) {
                expressionDiv.style.opacity = 0;
                setTimeout(() => {
                    expressionDiv.textContent = `Detected Expression: ${highestExpression}`;
                    expressionDiv.style.opacity = 1;
                }, 500);
            }
        } else {
            // 얼굴이 감지되지 않을 때 기본 설정
            if (expressionDiv.textContent !== 'No face detected') {
                expressionDiv.style.opacity = 0;
                setTimeout(() => {
                    expressionDiv.textContent = 'No face detected';
                    expressionDiv.style.opacity = 1;
                }, 500);
            }
            colorBox.style.background = 'white';
        }
    }, 100);
});
ㅍ