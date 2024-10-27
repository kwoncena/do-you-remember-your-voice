let mediaRecorder;
let recordedChunks = [];
let audioBlob;
let audioElements = []; // Array to store multiple audio elements
let isRecording = false;
let stream = null; // To store the microphone stream
let distortLayerCount = 0;
const maxDistortions = 5; // Number of distorted layers to play

// Set up D3 SVG container
const visualContainer = d3.select("#visualContainer")
  .append("svg")
  .attr("width", 800)
  .attr("height", 400);

document.addEventListener("DOMContentLoaded", function () {
  const recordButton = document.getElementById("recordButton");
  const stopButton = document.getElementById("stopButton");
  const distortButton = document.getElementById("distortButton");
  const stopPlaybackButton = document.getElementById("stopPlaybackButton");
  const statusText = document.getElementById("statusText");

  // Initialize state variables for visuals
  let staticInterval = null;
  let isPlayingDistorted = false;

  // Button event listeners
  recordButton.addEventListener("click", () => toggleRecording());
  stopButton.addEventListener("click", () => stopAll());
  distortButton.addEventListener("click", () => playDistortedPlayback());
  stopPlaybackButton.addEventListener("click", () => stopDistortedPlayback());

  function toggleRecording() {
    if (!isRecording) {
      // Start recording
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(userStream => {
          stream = userStream; // Store the microphone stream
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.start();

          mediaRecorder.ondataavailable = function (e) {
            recordedChunks.push(e.data);
          };

          mediaRecorder.onstop = function () {
            audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
            
            // Prepare 5 separate audio elements for distortion playback
            audioElements = [];
            for (let i = 0; i < maxDistortions; i++) {
              const audioElement = new Audio(URL.createObjectURL(audioBlob));
              audioElements.push(audioElement);
            }
          };

          statusText.textContent = "Recording in progress... Speak!";
          stopButton.disabled = false;
          distortButton.disabled = true;
          stopPlaybackButton.disabled = true;

          // Clear any existing visuals when starting a new recording
          visualContainer.selectAll("*").remove();
        })
        .catch(error => {
          console.error("Error accessing microphone:", error);
        });

      isRecording = true;
    }
  }

  function stopAll() {
    // Stop recording if in progress
    if (isRecording) {
      mediaRecorder.stop();
      isRecording = false;
      statusText.textContent = "Recording stopped. Ready for playback.";
      stopButton.disabled = true;
      distortButton.disabled = false;
      
      // Stop microphone access
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }

      // Draw initial sound wave visual (simple line)
      drawSoundWave();
    }

    // Stop all audio playback
    stopDistortedPlayback();
  }

  function playDistortedPlayback() {
    if (audioElements.length > 0 && !isPlayingDistorted) {
      statusText.textContent = "Playing distorted audio...";
      isPlayingDistorted = true;
      distortButton.disabled = true;
      stopPlaybackButton.disabled = false;

      // Clear any previous visuals and start static visuals
      visualContainer.selectAll("*").remove();
      staticInterval = setInterval(generateRandomStatic, 500);

      // Play all 5 distorted variations at once
      audioElements.forEach((audio, index) => {
        const randomSpeed = Math.random() * 1.5 + 0.5; // Random speed between 0.5x and 2.0x
        audio.playbackRate = randomSpeed;
        audio.play();

        // Generate a new distorted sound wave visual for each layer
        drawSoundWave(true);
      });
    }
  }

  function stopDistortedPlayback() {
    // Clear intervals, visuals, and stop playback
    clearInterval(staticInterval);

    visualContainer.selectAll("*").remove();
    statusText.textContent = "Playback stopped. Ready for next action.";
    isPlayingDistorted = false;
    distortButton.disabled = false;
    stopPlaybackButton.disabled = true;

    // Stop all audio elements if they're playing
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  // Function to draw the sound wave, optionally distorted
  function drawSoundWave(isDistorted = false) {
    const waveData = Array.from({ length: 50 }, (_, i) => ({
      x: i * 16,
      y: 200 + (Math.sin(i * 0.4) * (isDistorted ? Math.random() * 50 : 30))
    }));

    const line = d3.line()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveBasis);

    visualContainer.append("path")
      .datum(waveData)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", isDistorted ? `rgb(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255})` : "white")
      .attr("stroke-width", 2);
  }

  // Function to generate random static visuals
  function generateRandomStatic() {
    const numRects = 50;
    visualContainer.selectAll("*").remove(); // Clear existing visuals

    // Generate random rectangles for static
    for (let i = 0; i < numRects; i++) {
      visualContainer.append("rect")
        .attr("x", Math.random() * 800)
        .attr("y", Math.random() * 400)
        .attr("width", Math.random() * 20)
        .attr("height", Math.random() * 20)
        .attr("fill", `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.6)`);
    }
  }
});
