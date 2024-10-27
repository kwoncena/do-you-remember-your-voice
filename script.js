let mediaRecorder;
let recordedChunks = [];
let audioBlob;
let audioElement;
let isRecording = false;
let playbackIntervals = [];
let distortLayerCount = 0;

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
  stopButton.addEventListener("click", () => stopRecording());
  distortButton.addEventListener("click", () => playDistortedPlayback());
  stopPlaybackButton.addEventListener("click", () => stopDistortedPlayback());

  function toggleRecording() {
    if (!isRecording) {
      // Start recording
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.start();

          mediaRecorder.ondataavailable = function (e) {
            recordedChunks.push(e.data);
          };

          mediaRecorder.onstop = function () {
            audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
            audioElement = new Audio(URL.createObjectURL(audioBlob));
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

  function stopRecording() {
    if (isRecording) {
      // Stop recording
      mediaRecorder.stop();
      isRecording = false;
      statusText.textContent = "Recording stopped. Ready for playback.";
      stopButton.disabled = true;
      distortButton.disabled = false;

      // Draw initial sound wave visual (simple line)
      drawSoundWave();
    }
  }

  function playDistortedPlayback() {
    if (audioElement && !isPlayingDistorted) {
      statusText.textContent = "Playing distorted audio...";
      isPlayingDistorted = true;
      distortButton.disabled = true;
      stopPlaybackButton.disabled = false;

      // Clear any previous visuals and start static visuals
      visualContainer.selectAll("*").remove();
      staticInterval = setInterval(generateRandomStatic, 500);

      // Play distorted audio layers
      playDistortedLayer();

      // Every 10 seconds, add a new layer
      playbackIntervals.push(setInterval(playDistortedLayer, 10000));
    }
  }

  function stopDistortedPlayback() {
    // Clear intervals, visuals, and stop playback
    playbackIntervals.forEach(clearInterval);
    playbackIntervals = [];
    clearInterval(staticInterval);

    visualContainer.selectAll("*").remove();
    statusText.textContent = "Playback stopped. Ready for next action.";
    isPlayingDistorted = false;
    distortButton.disabled = false;
    stopPlaybackButton.disabled = true;

    // Stop the audio if it's playing
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
  }

  function playDistortedLayer() {
    if (audioElement) {
      distortLayerCount++;

      // Adjust playback speed randomly to create distortion
      audioElement.playbackRate = Math.random() * 1.5 + 0.5;
      audioElement.play();

      // Generate random wave distortion for each layer
      drawSoundWave(true);
    }
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
