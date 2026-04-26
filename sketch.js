let mic;
let filter;
let delay;
let toggleButton;
let delaySlider;
let feedbackSlider;
let autoButton;
let autoDelayButton;
let startButton;
let harmonyButton; // Added Harmony Button
let autoSpeedSlider; // Added Auto Speed Slider
let isAudioOn = false;
let autoMode = false;
let autoDelayMode = false;
let harmonyEnabled = false; // Harmony toggle state
let harmonyDelays = []; // Array to hold harmony delays
let autoX, autoY;
let pAutoX, pAutoY;
let font;
let particles = [];
let autoTime = 0;
let autoSpeed = 0.05;
let lastAutoDelayChange = 0;
let feedbackThreshold = 0.3; // Threshold for detecting feedback
let stayDuration = 0; // How long cursor has been in current spot
let targetStayTime = 2000; // How long to stay in one spot (milliseconds)
let lastMoveTime = 0;
let isStaying = true;
let feedbackDetected = false;
let maxVolHistory = [];
let volumeHistorySize = 30;
let isSetupComplete = false;
let randomEffectsButton; // New button for random effects
let randomEffectsEnabled = false; // State for random effects
let effectsTime = 0; // Time variable for effects modulation
let intelligentButton; // New button for intelligent mode
let intelligentEnabled = false; // State for intelligent mode
let grainBuffer = []; // Buffer for granular synthesis
let grainSize = 1024; // Size of each grain
let grainPosition = 0; // Current position in grain buffer
let pitchShift = 1.0; // Pitch shift factor
let timeStretch = 1.0; // Time stretch factor
let dnaSequence = []; // DNA sequence for sound splicing
let reverseBuffer = []; // Buffer for reverse effects
let reversePosition = 0; // Position in reverse buffer
let warpIntensity = 0; // Current warp intensity
let lastWarpTime = 0; // Last warp effect time
let intelligentEffectMode = 0; // Current effect mode (0-7)
let modeChangeTime = 0; // Time when mode last changed
let filterFreq = 1000; // Global filter frequency variable
let resonance = 10; // Global resonance variable

function preload() {
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(font);

  startButton = createButton('ACTIVATE SYSTEM');
  startButton.position(width / 2 - 75, height / 2);
  startButton.class('hacker-button');
  startButton.mousePressed(initializeAudio);
}

function initializeAudio() {
  // Enter fullscreen mode
  let fs = fullscreen();
  if (!fs) {
    fullscreen(true);
  }
  
  userStartAudio().then(() => {
    // Create an audio input and start it
    mic = new p5.AudioIn();
    mic.start();

    // Create a low-pass filter
    filter = new p5.LowPass();

    // Create a delay
    delay = new p5.Delay();

    // Connect the mic to the filter
    mic.connect(filter);

    // Disconnect filter to prevent feedback and connect to delay
    filter.disconnect();
    delay.process(filter, 0.12, 0.7, 2300);

    // Remove start button and create UI elements
    startButton.remove();
    createUIElements();

    // Initialize auto cursor position
    autoX = width / 2;
    autoY = height / 2;
    pAutoX = autoX;
    pAutoY = autoY;

    isSetupComplete = true;
    isAudioOn = true;
  });
}

function createUIElements() {
  toggleButton = createButton('PANIC BUTTON!');
  toggleButton.position(20, 20);
  toggleButton.mousePressed(toggleAudio);
  toggleButton.class('hacker-button');

  delaySlider = createSlider(0, 1, 0.5, 0.01);
  delaySlider.position(20, 60);
  delaySlider.class('hacker-slider');

  feedbackSlider = createSlider(0, 0.9, 0.6, 0.01);
  feedbackSlider.position(20, 80);
  feedbackSlider.class('hacker-slider');

  autoButton = createButton('XHABARABOT');
  autoButton.position(180, 60);
  autoButton.mousePressed(toggleAutoMode);
  autoButton.class('hacker-button');

  autoDelayButton = createButton('AUTO DELAY');
  autoDelayButton.position(150, 20);
  autoDelayButton.mousePressed(toggleAutoDelay);
  autoDelayButton.class('hacker-button');

  // Added Harmony Button
  harmonyButton = createButton('HARMONIES');
  harmonyButton.position(250, 20);
  harmonyButton.mousePressed(toggleHarmonies);
  harmonyButton.class('hacker-button');

  // New button for random effects
  randomEffectsButton = createButton('RANDOM FX');
  randomEffectsButton.position(340, 20);
  randomEffectsButton.mousePressed(toggleRandomEffects);
  randomEffectsButton.class('hacker-button');

  // New button for intelligent mode
  intelligentButton = createButton('INTELLIGENT');
  intelligentButton.position(420, 20);
  intelligentButton.mousePressed(toggleIntelligentMode);
  intelligentButton.class('hacker-button');

  // Added Auto Speed Slider
  autoSpeedSlider = createSlider(0.01, 1, 0.05, 0.01);
  autoSpeedSlider.position(270, 70);
  autoSpeedSlider.class('hacker-slider');
}

function toggleHarmonies() {
  if (!harmonyEnabled) {
    // Create two additional delay lines for harmonies
    let harmonyDelay1 = new p5.Delay();
    harmonyDelay1.process(filter, 0.15, 0.5, 2000); // Slightly longer delay time
    harmonyDelays.push(harmonyDelay1);

    let harmonyDelay2 = new p5.Delay();
    harmonyDelay2.process(filter, 0.18, 0.5, 4200); // Different delay time
    harmonyDelays.push(harmonyDelay2);

    harmonyEnabled = true;
    harmonyButton.addClass('active');
    console.log('Harmonies generated.');
  } else {
    // Disconnect and remove harmony delays
    for (let delay of harmonyDelays) {
      delay.disconnect();
      delay = null;
    }
    harmonyDelays = [];
    harmonyEnabled = false;
    harmonyButton.removeClass('active');
    console.log('Harmonies removed.');
  }
}

function toggleRandomEffects() {
  randomEffectsEnabled = !randomEffectsEnabled;
  if (randomEffectsEnabled) {
    randomEffectsButton.addClass('active');
  } else {
    randomEffectsButton.removeClass('active');
  }
  console.log(randomEffectsEnabled ? "Random effects ACTIVE." : "Random effects DEACTIVATED.");
}

function toggleIntelligentMode() {
  intelligentEnabled = !intelligentEnabled;
  if (intelligentEnabled) {
    intelligentButton.addClass('active');
    initializeIntelligentMode();
  } else {
    intelligentButton.removeClass('active');
  }
  console.log(intelligentEnabled ? "INTELLIGENT MODE ENGAGED. DNA sequencing initiated..." : "INTELLIGENT MODE DISENGAGED. Standard processing restored.");
}

function initializeIntelligentMode() {
  // Initialize grain buffer for granular synthesis
  grainBuffer = new Array(grainSize * 4).fill(0);
  grainPosition = 0;
  
  // Initialize reverse buffer for reverse effects
  reverseBuffer = new Array(2048).fill(0);
  reversePosition = 0;
  
  // Generate initial DNA sequence for sound splicing with safer ranges
  dnaSequence = [];
  for (let i = 0; i < 64; i++) {
    dnaSequence.push({
      pitch: random(0.7, 1.4), // Much safer pitch range
      stretch: random(0.6, 1.8), // Reduced stretch range
      grain: random(256, 1024), // Smaller grain range for stability
      splice: random(0, 1) > 0.8, // Reduced splice frequency to 20%
      reverse: random(0, 1) > 0.85, // 15% chance of reverse effect
      warp: random(0.2, 0.8), // Warp intensity factor
      echo: random(0, 1) > 0.75, // 25% chance of echo multiplication
      flutter: random(0.1, 0.5) // Flutter/vibrato intensity
    });
  }
  
  // Initialize effect mode
  intelligentEffectMode = 0;
  modeChangeTime = millis();
  
  console.log("Intelligent algorithms initialized. Advanced sound DNA ready for manipulation.");
}

function draw() {
  if (!isSetupComplete) {
    background(0);
    fill(0, 255, 0);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("XHABARABOT THE PARROT v2.0", width / 2, height / 2 - 50);
    return;
  }

  background(0, 20);

  // Update autoSpeed from slider
  autoSpeed = autoSpeedSlider.value();

  let currentX, currentY;

  if (autoMode) {
    pAutoX = autoX;
    pAutoY = autoY;
    updateAutoPosition();
    currentX = autoX;
    currentY = autoY;
  } else {
    currentX = mouseX;
    currentY = mouseY;
  }

  // Get the overall volume (between 0 and 1.0)
  let vol = mic.getLevel();

  // Change the frequency of the filter based on current X position
  filterFreq = map(currentX, 0, width, 40, 15000);

  // Change the resonance of the filter based on current Y position
  resonance = map(currentY, 0, height, 4, 80);

  // Apply random effects if enabled
  if (randomEffectsEnabled) {
    effectsTime += 0.03;

    // More aggressive frequency modulation
    let frequencyModulation = sin(effectsTime * 4.2) * 1500 + cos(effectsTime * 2.8) * 800;
    filterFreq += frequencyModulation;

    // Stronger distortion via resonance modulation
    let distortionAmount = abs(sin(effectsTime * 6.1)) * 40 + abs(cos(effectsTime * 3.5)) * 25;
    resonance += distortionAmount;

    // More frequent and dramatic frequency jumps
    if (random(1) < 0.008) { // 0.8% chance per frame
      filterFreq += random(-4000, 4000);
    }

    // Random delay time modulation for more dramatic effects
    if (random(1) < 0.005) { // 0.5% chance per frame
      let currentSliderValue = delaySlider.value() + random(-0.3, 0.3);
      delaySlider.value(constrain(currentSliderValue, 0, 1));
    }

    // Constrain to reasonable ranges
    filterFreq = constrain(filterFreq, 20, 20000);
    resonance = constrain(resonance, 1, 120);
  }

  // Apply intelligent mode processing
  if (intelligentEnabled) {
    processIntelligentMode();
    
    // Update reverse buffer
    reverseBuffer[reversePosition] = vol;
    reversePosition = (reversePosition + 1) % reverseBuffer.length;
    
    // Change effect mode every 8-15 seconds
    if (millis() - modeChangeTime > random(8000, 15000)) {
      intelligentEffectMode = (intelligentEffectMode + 1) % 8;
      modeChangeTime = millis();
      console.log(`Intelligent mode switched to pattern ${intelligentEffectMode}`);
    }
    
    // Apply granular synthesis effects to frequency
    let grainIndex = floor(frameCount / 60) % dnaSequence.length;
    let currentDNA = dnaSequence[grainIndex];
    
    // Different effect modes for variety
    switch(intelligentEffectMode) {
      case 0: // Classic DNA mode
        applyClassicDNAEffects(currentDNA, vol);
        break;
      case 1: // Reverse mode
        applyReverseEffects(currentDNA, vol);
        break;
      case 2: // Warp mode
        applyWarpEffects(currentDNA, vol);
        break;
      case 3: // Flutter mode
        applyFlutterEffects(currentDNA, vol);
        break;
      case 4: // Echo multiplication mode
        applyEchoEffects(currentDNA, vol);
        break;
      case 5: // Harmonic sweep mode
        applyHarmonicSweep(currentDNA, vol);
        break;
      case 6: // Stutter mode
        applyStutterEffects(currentDNA, vol);
        break;
      case 7: // Morphing mode
        applyMorphingEffects(currentDNA, vol);
        break;
    }
    
    // More aggressive audio processing - only limit when extremely loud
    if (vol > 0.85) {
      feedbackSlider.value(constrain(feedbackSlider.value() * 0.8, 0, 0.8)); // Less aggressive reduction
      resonance *= 0.7; // Less resonance reduction
    }
    
    // Much wider ranges for more dramatic effects
    filterFreq = constrain(filterFreq, 30, 18000); // Much wider frequency range
    resonance = constrain(resonance, 1, 100); // Higher max resonance for more dramatic effects
  }

  // Set the filter parameters
  filter.set(filterFreq, resonance);

  // Update the delay time and feedback based on the slider values
  let currentDelayValue = delaySlider.value();
  let delayFeedbackAmount = feedbackSlider.value();

  if (autoDelayMode) {
    currentDelayValue = updateAutoDelay();
  }

  delay.delayTime(currentDelayValue);
  delay.amp(delayFeedbackAmount);

  // Visualize sound
  drawWaveform(vol);
  createParticles(currentX, currentY, vol);
  updateAndDrawParticles();

  // Draw UI text
  drawUIText(vol, filterFreq, resonance, currentDelayValue, delayFeedbackAmount);

  // Draw auto-hack cursor
  if (autoMode) {
    drawAutoCursor();
  }
}

function updateAutoPosition() {
  let currentTime = millis();
  let vol = mic.getLevel();
  
  // Track volume history for feedback detection
  maxVolHistory.push(vol);
  if (maxVolHistory.length > volumeHistorySize) {
    maxVolHistory.shift();
  }
  
  // Calculate average recent volume
  let avgVolume = maxVolHistory.reduce((a, b) => a + b, 0) / maxVolHistory.length;
  
  // Detect if volume is increasing rapidly (potential feedback)
  feedbackDetected = vol > feedbackThreshold && vol > avgVolume * 1.5;
  
  if (isStaying) {
    // Stay in current position, allowing feedback to build
    stayDuration = currentTime - lastMoveTime;
    
    // More dynamic breathing motion with varying patterns
    let breathingIntensity = map(vol, 0, 1, 5, 35);
    let breathingSpeed = map(autoSpeed, 0.01, 1, 0.05, 0.3);
    let breathingPattern = sin(autoTime * breathingSpeed) * breathingIntensity;
    let breathingPatternY = cos(autoTime * breathingSpeed * 1.3) * breathingIntensity * 0.8;
    
    // Add subtle randomness to breathing
    if (random(1) < 0.1) {
      breathingPattern += random(-10, 10);
      breathingPatternY += random(-10, 10);
    }
    
    autoX += breathingPattern * 0.3;
    autoY += breathingPatternY * 0.3;
    
    // Ensure breathing motion doesn't go outside canvas
    autoX = constrain(autoX, 50, width - 50);
    autoY = constrain(autoY, 50, height - 50);
    
    // If feedback detected or stay time exceeded, start moving
    if (feedbackDetected || stayDuration > targetStayTime) {
      isStaying = false;
      lastMoveTime = currentTime;
      console.log(feedbackDetected ? "Feedback detected! Moving to shape the sound..." : "Stay time complete, exploring new sonic territory...");
    }
  } else {
    // Dynamic movement phase with multiple unpredictable patterns
    let speedMultiplier = map(vol, 0, 1, 0.5, 4);
    autoTime += autoSpeed * speedMultiplier;
    
    // Choose random movement pattern
    let movementPattern = floor(autoTime / 100) % 5; // Changes pattern every ~10 seconds
    
    if (feedbackDetected) {
      // Aggressive, chaotic movement when feedback is present
      let intensity = map(vol, 0, 1, 2, 8);
      
      switch(movementPattern) {
        case 0: // Chaotic spiral
          let spiralRadius = 30 + vol * 150;
          let spiralSpeed = autoTime * intensity * 0.5;
          autoX += cos(spiralSpeed) * spiralRadius * 0.08;
          autoY += sin(spiralSpeed * 1.3) * spiralRadius * 0.08;
          break;
          
        case 1: // Figure-8 patterns
          let figure8Size = 80 + vol * 100;
          autoX += sin(autoTime * intensity * 0.3) * figure8Size * 0.05;
          autoY += sin(autoTime * intensity * 0.6) * figure8Size * 0.05;
          break;
          
        case 2: // Zigzag chaos
          if (frameCount % 5 === 0) {
            autoX += random(-80, 80) * vol;
            autoY += random(-80, 80) * vol;
          }
          break;
          
        case 3: // Triangular orbits
          let triSize = 60 + vol * 120;
          let triSpeed = autoTime * intensity * 0.4;
          autoX += cos(triSpeed) * triSize * 0.06;
          autoY += sin(triSpeed * 0.7) * triSize * 0.06;
          break;
          
        case 4: // Erratic jumps
          if (random(1) < 0.05) {
            autoX = random(100, width - 100);
            autoY = random(100, height - 100);
          }
          autoX += sin(autoTime * 15) * 40 * vol;
          autoY += cos(autoTime * 18) * 40 * vol;
          break;
      }
      
      // Add random jolts during high feedback
      if (vol > 0.7 && random(1) < 0.03) {
        autoX += random(-100, 100);
        autoY += random(-100, 100);
      }
    } else {
      // More varied exploration patterns when no feedback
      let explorationIntensity = map(autoSpeed, 0.01, 1, 0.8, 3);
      
      switch(movementPattern) {
        case 0: // Smooth sine waves
          let waveSpeed = autoTime * 0.02 * explorationIntensity;
          autoX += sin(waveSpeed) * 2;
          autoY += cos(waveSpeed * 1.3) * 2;
          break;
          
        case 1: // Perlin noise wandering
          let noiseScale = 0.01 * explorationIntensity;
          let noiseX = noise(autoTime * noiseScale, 0);
          let noiseY = noise(autoTime * noiseScale, 1000);
          autoX = lerp(autoX, map(noiseX, 0, 1, 100, width - 100), 0.05);
          autoY = lerp(autoY, map(noiseY, 0, 1, 100, height - 100), 0.05);
          break;
          
        case 2: // Circular sweeps
          let sweepRadius = 150;
          let sweepSpeed = autoTime * 0.03 * explorationIntensity;
          let centerX = width * 0.3 + sin(sweepSpeed * 0.1) * width * 0.2;
          let centerY = height * 0.3 + cos(sweepSpeed * 0.1) * height * 0.2;
          autoX = centerX + cos(sweepSpeed) * sweepRadius;
          autoY = centerY + sin(sweepSpeed) * sweepRadius;
          break;
          
        case 3: // Random grid positions
          if (frameCount % 120 === 0) { // Change position every ~2 seconds
            let gridX = floor(random(3, 8));
            let gridY = floor(random(3, 6));
            autoX = map(gridX, 0, 8, 100, width - 100);
            autoY = map(gridY, 0, 6, 100, height - 100);
          }
          // Smooth transition to target
          autoX = lerp(autoX, autoX, 0.95);
          autoY = lerp(autoY, autoY, 0.95);
          break;
          
        case 4: // Diagonal sweeps
          let diagSpeed = autoTime * 0.025 * explorationIntensity;
          autoX = map(sin(diagSpeed), -1, 1, 80, width - 80);
          autoY = map(cos(diagSpeed * 0.7), -1, 1, 80, height - 80);
          break;
      }
    }
    
    // Ensure position always stays within canvas boundaries with margin
    autoX = constrain(autoX, 50, width - 50);
    autoY = constrain(autoY, 50, height - 50);
    
    // More dynamic stopping decisions
    let movementDuration = currentTime - lastMoveTime;
    let shouldStop = false;
    
    if (feedbackDetected) {
      // Stop when feedback calms down, but with some randomness
      shouldStop = (vol < feedbackThreshold * 0.6 && movementDuration > random(800, 2000)) || movementDuration > 8000;
    } else {
      // Vary exploration time more dramatically
      let minExploreTime = map(autoSpeed, 0.01, 1, 3000, 1000);
      let maxExploreTime = map(autoSpeed, 0.01, 1, 8000, 3000);
      shouldStop = movementDuration > random(minExploreTime, maxExploreTime);
    }
    
    if (shouldStop) {
      isStaying = true;
      lastMoveTime = currentTime;
      
      // Choose more varied cultivation spots - avoid edges and add interesting zones
      let zoneChoice = random();
      if (zoneChoice < 0.2) {
        // Center zones
        autoX = random(width * 0.3, width * 0.7);
        autoY = random(height * 0.3, height * 0.7);
      } else if (zoneChoice < 0.4) {
        // Golden ratio positions
        autoX = width * (random() < 0.5 ? 0.382 : 0.618);
        autoY = height * (random() < 0.5 ? 0.382 : 0.618);
      } else if (zoneChoice < 0.6) {
        // Quarter positions with offset
        autoX = random(width * 0.2, width * 0.8);
        autoY = random(height * 0.2, height * 0.8);
      } else {
        // Completely random but not at edges
        autoX = random(width * 0.15, width * 0.85);
        autoY = random(height * 0.15, height * 0.85);
      }
      
      // Vary stay duration more dramatically based on speed and volume
      let baseStayTime = map(autoSpeed, 0.01, 1, 4000, 1500);
      let volumeModifier = map(vol, 0, 1, 0.5, 2);
      targetStayTime = baseStayTime * volumeModifier + random(-1000, 1000);
      targetStayTime = constrain(targetStayTime, 1000, 6000);
      
      console.log("Finding new position to cultivate sound...");
    }
  }
}

function drawAutoCursor() {
  push();
  stroke(0, 255, 0);
  noFill();
  ellipse(autoX, autoY, 20, 20);
  line(autoX - 15, autoY, autoX + 15, autoY);
  line(autoX, autoY - 15, autoX, autoY + 15);

  // Add a trailing effect
  for (let i = 0; i < 5; i++) {
    let trailX = lerp(autoX, pAutoX, (i + 1) / 5);
    let trailY = lerp(autoY, pAutoY, (i + 1) / 5);
    stroke(0, 255, 0, 150 - i * 30);
    ellipse(trailX, trailY, 20 - i * 3);
  }
  pop();
}

function drawWaveform(vol) {
  stroke(0, 255, 0);
  noFill();
  beginShape();
  for (let i = 0; i < width; i++) {
    let x = i;
    let y = height / 2 + sin(i * 0.01 + frameCount * 0.1) * height / 4 * vol;
    vertex(x, y);
  }
  endShape();
}

function createParticles(x, y, vol) {
  if (frameCount % 3 === 0) {  // Increased particle creation rate
    let angle = random(TWO_PI);
    let radius = random(20, 50);  // Particles appear within 20-50 pixels of the cursor
    let px = x + cos(angle) * radius;
    let py = y + sin(angle) * radius;
    particles.push(new Particle(px, py, vol));
  }
}

function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
}

function drawUIText(vol, filterFreq, resonance, currentDelayValue, feedback) {
  fill(0, 255, 0);
  textSize(14);
  textAlign(RIGHT);

  let rightMargin = width - 20;
  let topMargin = 30;
  let lineHeight = 20;

  text(`Volume: ${nf(vol, 1, 2)}`, rightMargin, topMargin);
  text(`Frequency: ${nf(filterFreq, 0, 0)} Hz`, rightMargin, topMargin + lineHeight);
  text(`Resonance: ${nf(resonance, 1, 1)}`, rightMargin, topMargin + 2 * lineHeight);
  text(`Delay: ${nf(currentDelayValue, 1, 2)}`, rightMargin, topMargin + 3 * lineHeight);
  text(`Feedback: ${nf(feedback, 1, 2)}`, rightMargin, topMargin + 4 * lineHeight);
  text(`Auto Speed: ${nf(autoSpeed, 1, 2)}`, rightMargin, topMargin + 5 * lineHeight); // Display Auto Speed

  if (autoMode) {
    let botStatus = isStaying ? "CULTIVATING SOUND" : (feedbackDetected ? "SHAPING FEEDBACK" : "EXPLORING");
    text(`XHABARABOT: ${botStatus}`, rightMargin, topMargin + 6 * lineHeight);
  }
  if (autoDelayMode) {
    text("AUTO DELAY ACTIVE", rightMargin, topMargin + 7 * lineHeight);
  }
  if (harmonyEnabled) { // Display Harmony Status
    text("HARMONIES ACTIVE", rightMargin, topMargin + 8 * lineHeight);
  }
   if (randomEffectsEnabled) { // Display Random Effects Status
    text("RANDOM EFFECTS ACTIVE", rightMargin, topMargin + 9 * lineHeight);
  }
  if (intelligentEnabled) { // Display Intelligent Mode Status
    text("INTELLIGENT MODE ACTIVE", rightMargin, topMargin + 10 * lineHeight);
    let grainIndex = floor(frameCount / 60) % dnaSequence.length;
    text(`DNA SEQUENCE: ${grainIndex}/${dnaSequence.length}`, rightMargin, topMargin + 11 * lineHeight);
    text(`PITCH SHIFT: ${nf(pitchShift, 1, 2)}`, rightMargin, topMargin + 12 * lineHeight);
    text(`TIME STRETCH: ${nf(timeStretch, 1, 2)}`, rightMargin, topMargin + 13 * lineHeight);
    
    // Display current effect mode
    let modeNames = ["CLASSIC", "REVERSE", "WARP", "FLUTTER", "ECHO", "HARMONIC", "STUTTER", "MORPH"];
    text(`MODE: ${modeNames[intelligentEffectMode]}`, rightMargin, topMargin + 14 * lineHeight);
    text(`WARP: ${nf(warpIntensity, 1, 2)}`, rightMargin, topMargin + 15 * lineHeight);
  }

  textAlign(LEFT);  // Reset text alignment to default
}

function toggleAudio() {
  if (isAudioOn) {
    mic.stop();
    filter.disconnect();
    delay.disconnect();

    // Disconnect harmony delays if active
    if (harmonyEnabled) {
      toggleHarmonies();
    }

    console.log('System terminated. Silence reigns.');
  } else {
    mic.start();
    mic.connect(filter);
    filter.disconnect();
    delay.process(filter, 0.12, 0.7, 2300);
    console.log('System initiated. Prepare for sonic assault.');
  }
  isAudioOn = !isAudioOn;
}

function toggleAutoMode() {
  autoMode = !autoMode;
  if (autoMode) {
    // Initialize XHABARABOT state
    isStaying = true;
    lastMoveTime = millis();
    targetStayTime = random(2000, 3000);
    maxVolHistory = [];
    stayDuration = 0;
    autoButton.addClass('active');
    console.log("XHABARABOT ENGAGED. Beginning sonic exploration...");
  } else {
    autoButton.removeClass('active');
    console.log("XHABARABOT DISENGAGED. Manual override activated.");
  }
}

function toggleAutoDelay() {
  autoDelayMode = !autoDelayMode;
  if (autoDelayMode) {
    autoDelayButton.addClass('active');
  } else {
    autoDelayButton.removeClass('active');
  }
  console.log(autoDelayMode ? "AUTO DELAY ACTIVE. Temporal flux initiated." : "AUTO DELAY DEACTIVATED. Temporal stability restored.");
}

function updateAutoDelay() {
  if (millis() - lastAutoDelayChange > 500) {  // Change every 500ms
    delaySlider.value(random(0, 1));
    lastAutoDelayChange = millis();
  }
  return delaySlider.value();
}

function processIntelligentMode() {
  let vol = mic.getLevel();
  
  // Update grain buffer with current audio level
  grainBuffer[grainPosition] = vol;
  grainPosition = (grainPosition + 1) % grainBuffer.length;
  
  // Evolve DNA sequence based on audio input
  if (frameCount % 180 === 0) { // Every 3 seconds
    let evolutionIndex = floor(random(dnaSequence.length));
    let avgVolume = grainBuffer.reduce((a, b) => a + b, 0) / grainBuffer.length;
    
    // Mutate DNA based on audio characteristics with safer ranges
    dnaSequence[evolutionIndex] = {
      pitch: constrain(dnaSequence[evolutionIndex].pitch + random(-0.1, 0.1), 0.6, 1.6), // Safer mutation range
      stretch: constrain(dnaSequence[evolutionIndex].stretch + random(-0.2, 0.2), 0.5, 2.0), // Reduced mutation
      grain: constrain(dnaSequence[evolutionIndex].grain + random(-100, 100), 128, 1536), // Smaller grain range
      splice: avgVolume > 0.4 ? random(0, 1) > 0.6 : random(0, 1) > 0.9, // Less aggressive splicing
      reverse: avgVolume > 0.3 ? random(0, 1) > 0.7 : random(0, 1) > 0.9, // Adaptive reverse probability
      warp: constrain(dnaSequence[evolutionIndex].warp + random(-0.1, 0.1), 0.1, 0.9), // Evolving warp intensity
      echo: avgVolume > 0.2 ? random(0, 1) > 0.6 : random(0, 1) > 0.8, // Volume-based echo
      flutter: constrain(dnaSequence[evolutionIndex].flutter + random(-0.05, 0.05), 0.05, 0.6) // Evolving flutter
    };
    
    console.log(`DNA mutation at index ${evolutionIndex}: Adapting to sound environment...`);
  }
  
  // Granular synthesis buffer analysis
  if (frameCount % 60 === 0) { // Every second
    let grainAnalysis = analyzeGrainBuffer();
    applyGranularEffects(grainAnalysis);
  }
}

function analyzeGrainBuffer() {
  let peaks = 0;
  let valleys = 0;
  let totalEnergy = 0;
  
  for (let i = 1; i < grainBuffer.length - 1; i++) {
    totalEnergy += grainBuffer[i];
    
    // Detect peaks and valleys
    if (grainBuffer[i] > grainBuffer[i-1] && grainBuffer[i] > grainBuffer[i+1]) {
      peaks++;
    } else if (grainBuffer[i] < grainBuffer[i-1] && grainBuffer[i] < grainBuffer[i+1]) {
      valleys++;
    }
  }
  
  return {
    peaks: peaks,
    valleys: valleys,
    energy: totalEnergy / grainBuffer.length,
    complexity: peaks + valleys
  };
}

function applyGranularEffects(analysis) {
  // Much more aggressive effects with lower thresholds
  if (analysis.complexity > 20) { // Much lower threshold for complexity effects
    // High complexity - create dramatic splicing
    for (let i = 0; i < 5; i++) { // More splicing events
      let targetIndex = floor(random(dnaSequence.length));
      dnaSequence[targetIndex].splice = true;
      dnaSequence[targetIndex].pitch = random(0.4, 2.2); // Much wider pitch range
    }
  }
  
  if (analysis.energy > 0.01) { // Much lower threshold for energy effects
    // High energy - dramatic granulation increase
    let energyBoost = map(analysis.energy, 0.01, 0.1, 1.5, 3.0); // Much higher boost range
    for (let i = 0; i < dnaSequence.length; i += 3) { // More frequent application
      dnaSequence[i].grain *= energyBoost;
      dnaSequence[i].grain = constrain(dnaSequence[i].grain, 64, 3072); // Wider grain range
    }
  }
  
  // Force some effects even with low energy
  if (frameCount % 300 === 0) { // Every 5 seconds, force some action
    let forceIndex = floor(random(dnaSequence.length));
    dnaSequence[forceIndex].pitch = random(0.3, 2.5);
    dnaSequence[forceIndex].splice = true;
    console.log("Forcing intelligent effect activation");
  }
  
  console.log(`Granular analysis: ${analysis.peaks} peaks, ${analysis.valleys} valleys, energy: ${analysis.energy.toFixed(3)}`);
}

// Different intelligent effect modes for variety
function applyClassicDNAEffects(currentDNA, vol) {
  // Much more dramatic DNA-based pitch shifting
  pitchShift = map(currentDNA.pitch, 0.3, 2.5, 0.4, 2.8);
  filterFreq *= pitchShift;
  
  // More aggressive time stretching effects
  timeStretch = map(currentDNA.stretch, 0.2, 4.0, 0.3, 3.5);
  if (frameCount % 60 === 0) { // More frequent changes
    let stretchedDelay = delaySlider.value() * timeStretch;
    delaySlider.value(constrain(stretchedDelay, 0, 0.95));
    
    // Also modulate feedback more dramatically
    let feedbackMod = map(currentDNA.stretch, 0.2, 4.0, 0.2, 0.9);
    feedbackSlider.value(constrain(feedbackMod, 0, 0.9));
  }
  
  // Much stronger granular synthesis frequency modulation
  let grainModulation = sin(frameCount * 0.2 / currentDNA.grain) * 2500 + cos(frameCount * 0.15 / currentDNA.grain) * 1800;
  filterFreq += grainModulation;
  
  // More frequent and dramatic DNA splicing
  if (currentDNA.splice && frameCount % 15 === 0) { // More frequent
    filterFreq = random(80, 12000); // Wider range
    resonance = random(10, 80); // Higher resonance
  }
  
  // Add constant background modulation for more activity
  let backgroundMod = sin(frameCount * 0.08) * 600 + cos(frameCount * 0.12) * 400;
  filterFreq += backgroundMod;
  resonance += abs(sin(frameCount * 0.05)) * 20;
}

function applyReverseEffects(currentDNA, vol) {
  if (currentDNA.reverse && frameCount % 45 === 0) {
    // Create reverse delay effect by modulating delay time backwards
    let reverseDelay = map(vol, 0, 1, 0.1, 0.6);
    delaySlider.value(reverseDelay);
    
    // Reverse frequency sweep
    let reverseIndex = reverseBuffer.length - 1 - (frameCount % reverseBuffer.length);
    let reverseVol = reverseBuffer[reverseIndex];
    filterFreq = map(reverseVol, 0, 1, 2000, 500); // Reverse frequency mapping
    
    console.log("Reverse effect activated - temporal inversion engaged");
  }
  
  // Subtle pitch bending based on reverse buffer analysis
  let reversePitch = map(sin(frameCount * 0.05), -1, 1, 0.8, 1.2);
  filterFreq *= reversePitch;
}

function applyWarpEffects(currentDNA, vol) {
  // Much more intense warp effects
  warpIntensity = map(vol * currentDNA.warp, 0, 1, 2, 8); // Higher base intensity
  
  // More dramatic frequency warping
  let warpFreq = sin(frameCount * 0.15) * warpIntensity * 2500;
  let warpFreq2 = cos(frameCount * 0.22) * warpIntensity * 1800;
  let warpFreq3 = sin(frameCount * 0.09) * warpIntensity * 1200; // Additional layer
  filterFreq += warpFreq + warpFreq2 + warpFreq3;
  
  // More frequent and dramatic time warp
  if (frameCount % 40 === 0) { // More frequent
    let warpDelay = delaySlider.value() + sin(millis() * 0.008) * currentDNA.warp * 0.7; // Stronger effect
    delaySlider.value(constrain(warpDelay, 0, 0.95));
    
    // Also warp feedback
    let feedbackWarp = feedbackSlider.value() + cos(millis() * 0.006) * currentDNA.warp * 0.4;
    feedbackSlider.value(constrain(feedbackWarp, 0, 0.9));
  }
  
  // Much stronger resonance warping
  let warpResonance = abs(sin(frameCount * 0.12)) * warpIntensity * 35;
  resonance += warpResonance;
  
  // Add sudden warp jumps
  if (random(1) < 0.01) { // 1% chance per frame
    filterFreq += random(-4000, 4000);
    resonance += random(-20, 40);
  }
}

function applyFlutterEffects(currentDNA, vol) {
  // Much more dramatic flutter/vibrato effect
  let flutterSpeed = map(vol, 0, 1, 5, 20); // Faster flutter
  let flutterAmount = currentDNA.flutter * 1500; // Much stronger effect
  let flutter = sin(frameCount * flutterSpeed * 0.4) * flutterAmount;
  let flutter2 = cos(frameCount * flutterSpeed * 0.6) * flutterAmount * 0.7; // Additional layer
  filterFreq += flutter + flutter2;
  
  // Much stronger resonance flutter
  let resonanceFlutter = cos(frameCount * flutterSpeed * 0.3) * currentDNA.flutter * 30;
  resonance += resonanceFlutter;
  
  // More frequent and dramatic flutter bursts
  if (random(1) < 0.02) { // More frequent bursts
    filterFreq += random(-2500, 2500) * currentDNA.flutter;
    resonance += random(-15, 30) * currentDNA.flutter;
    console.log("Flutter burst activated");
  }
  
  // Constant background flutter for more activity
  let backgroundFlutter = sin(frameCount * 0.25) * 800 + cos(frameCount * 0.35) * 600;
  filterFreq += backgroundFlutter;
}

function applyEchoEffects(currentDNA, vol) {
  if (currentDNA.echo) {
    // Multiple echo layers with different timing
    if (frameCount % 90 === 0) {
      let echoDelay1 = constrain(delaySlider.value() * 1.3, 0, 0.8);
      delaySlider.value(echoDelay1);
    }
    
    if (frameCount % 120 === 30) {
      let echoDelay2 = constrain(delaySlider.value() * 0.7, 0, 0.8);
      delaySlider.value(echoDelay2);
    }
    
    // Echo frequency multiplication
    let echoFreq = filterFreq * (1 + sin(frameCount * 0.04) * 0.3);
    filterFreq = echoFreq;
  }
}

function applyHarmonicSweep(currentDNA, vol) {
  // Sweep through harmonic frequencies
  let harmonicBase = map(vol, 0, 1, 200, 1000);
  let harmonicMultiplier = 1 + floor(sin(frameCount * 0.03) * 4); // 1-5 harmonics
  let harmonicFreq = harmonicBase * harmonicMultiplier;
  
  filterFreq = lerp(filterFreq, harmonicFreq, 0.3);
  
  // Sweep resonance in opposite direction
  let harmonicResonance = map(sin(frameCount * 0.02), -1, 1, 3, 20);
  resonance = lerp(resonance, harmonicResonance, 0.2);
}

function applyStutterEffects(currentDNA, vol) {
  // Much more aggressive stutter effect
  let stutterRate = floor(map(vol, 0, 1, 4, 12)); // Faster stutter
  
  if (frameCount % stutterRate < stutterRate / 2) {
    // Stutter ON - much more dramatic effects
    filterFreq *= 2.5; // Much stronger multiplication
    resonance *= 2.2;
    
    // More frequent and dramatic delay changes
    if (frameCount % (stutterRate / 2) === 0) {
      let stutterDelay = random(0.05, 0.8); // Wider delay range
      delaySlider.value(stutterDelay);
      
      // Also stutter the feedback
      let stutterFeedback = random(0.3, 0.9);
      feedbackSlider.value(stutterFeedback);
    }
    
    // Add random frequency jumps during stutter
    if (random(1) < 0.3) { // 30% chance
      filterFreq += random(-3000, 3000);
    }
  } else {
    // Stutter OFF - more dramatic reduction
    filterFreq *= 0.4; // Stronger reduction for contrast
    resonance *= 0.5;
  }
  
  // More frequent stutter breaks with dramatic effects
  if (random(1) < 0.015) { // More frequent
    console.log("Stutter break - dramatic silence gap");
    feedbackSlider.value(0.05); // More dramatic feedback reduction
    filterFreq *= 0.2; // Temporary frequency drop
  }
  
  // Add chaotic stutter bursts
  if (random(1) < 0.008) {
    filterFreq = random(200, 8000);
    resonance = random(20, 60);
    console.log("Chaotic stutter burst");
  }
}

function applyMorphingEffects(currentDNA, vol) {
  // Morph between different effect combinations
  let morphPhase = sin(frameCount * 0.01);
  
  if (morphPhase > 0.5) {
    // Morph into high-frequency sparkles
    let sparkleFreq = random(2000, 5000);
    filterFreq = lerp(filterFreq, sparkleFreq, 0.1);
    resonance = lerp(resonance, 8, 0.1);
  } else if (morphPhase > 0) {
    // Morph into low rumbles
    let rumbleFreq = random(80, 300);
    filterFreq = lerp(filterFreq, rumbleFreq, 0.1);
    resonance = lerp(resonance, 20, 0.1);
  } else if (morphPhase > -0.5) {
    // Morph into sweeping middle frequencies
    let sweepFreq = 500 + sin(frameCount * 0.05) * 1500;
    filterFreq = lerp(filterFreq, sweepFreq, 0.15);
  } else {
    // Morph into wild modulation
    let wildFreq = filterFreq + random(-1000, 1000);
    filterFreq = constrain(wildFreq, 100, 6000);
    resonance += random(-5, 5);
  }
}

class Particle {
  constructor(x, y, vol) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 3));  // Reduced velocity for more localized effect
    this.acc = createVector(0, 0);
    this.life = 255;
    this.size = map(vol, 0, 1, 2, 8);  // Slightly reduced max size
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.life -= 8;  // Faster fade out
  }

  display() {
    noStroke();
    fill(0, 255, 0, this.life);
    ellipse(this.pos.x, this.pos.y, this.size);
  }

  isDead() {
    return this.life < 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (!isSetupComplete) {
    startButton.position(width / 2 - 75, height / 2);
  }
}