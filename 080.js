// session-recorder.js
class SessionRecorder {
  constructor() {
    this.recordings = [];
    this.currentSession = [];
    this.recording = false;
    this.playbackSpeed = 1;
    this.playbackIndex = 0;

    this.init();
  }

  init() {
    // Record mouse events
    document.addEventListener('click', (e) => this.recordEvent('click', e));
    document.addEventListener('mousemove', (e) => this.recordEvent('mousemove', e));
    document.addEventListener('scroll', () => this.recordEvent('scroll', window.scrollY));

    // Record keyboard events
    document.addEventListener('keydown', (e) => this.recordEvent('keydown', e));
    document.addEventListener('input', (e) => this.recordEvent('input', e));

    // Initialize playback controls
    this.setupPlaybackControls();
  }

  startRecording() {
    this.recording = true;
    this.currentSession = [];
    console.log('Recording started');
  }

  stopRecording() {
    this.recording = false;
    this.recordings.push(this.currentSession);
    console.log('Recording stopped');
  }

  recordEvent(type, data) {
    if (this.recording) {
      const event = {
        type,
        timestamp: Date.now(),
        data: this.serializeData(data)
      };
      this.currentSession.push(event);
    }
  }

  serializeData(data) {
    if (data instanceof MouseEvent) {
      return {
        x: data.clientX,
        y: data.clientY,
        target: data.target.outerHTML
      };
    } else if (data === document) {
      return {
        scrollY: window.scrollY
      };
    } else if (data instanceof KeyboardEvent) {
      return {
        key: data.key,
        target: data.target.outerHTML
      };
    } else if (data instanceof InputEvent) {
      return {
        value: data.target.value,
        target: data.target.outerHTML
      };
    }
    return data;
  }

  setupPlaybackControls() {
    const controls = document.createElement('div');
    controls.innerHTML = `
      <button id="play">Play</button>
      <button id="pause">Pause</button>
      <button id="stop">Stop</button>
      <input type="range" id="speed" min="0.5" max="4" step="0.5" value="1">
    `;
    document.body.appendChild(controls);

    const playBtn = controls.querySelector('#play');
    const pauseBtn = controls.querySelector('#pause');
    const stopBtn = controls.querySelector('#stop');
    const speedControl = controls.querySelector('#speed');

    playBtn.addEventListener('click', () => this.playRecording());
    pauseBtn.addEventListener('click', () => this.pausePlayback());
    stopBtn.addEventListener('click', () => this.stopPlayback());
    speedControl.addEventListener('input', (e) => {
      this.playbackSpeed = parseFloat(e.target.value);
    });
  }

  playRecording() {
    if (this.playbackIndex >= this.currentSession.length) {
      this.playbackIndex = 0;
    }
    this.playbackLoop();
  }

  pausePlayback() {
    this.playing = false;
  }

  stopPlayback() {
    this.playing = false;
    this.playbackIndex = 0;
  }

  playbackLoop() {
    if (!this.playing) return;
    if (this.playbackIndex >= this.currentSession.length) {
      this.playbackIndex = 0;
    }

    const event = this.currentSession[this.playbackIndex];
    this.playEvent(event);

    setTimeout(() => {
      this.playbackIndex++;
      this.playbackLoop();
    }, 1000 / this.playbackSpeed);
  }

  playEvent(event) {
    switch (event.type) {
      case 'click':
        const coords = event.data;
        const target = document.createElement('div');
        target.style.position = 'absolute';
        target.style.left = `${coords.x}px`;
        target.style.top = `${coords.y}px`;
        target.style.width = '10px';
        target.style.height = '10px';
        target.style.backgroundColor = 'red';
        target.style.borderRadius = '50%';
        document.body.appendChild(target);
        setTimeout(() => {
          document.body.removeChild(target);
        }, 100);
        break;
      case 'mousemove':
        const { x, y } = event.data;
        document.scrollingElement.scrollTo(x, y);
        break;
      case 'scroll':
        document.scrollingElement.scrollTo(0, event.data.scrollY);
        break;
      case 'keydown':
        const { key, target } = event.data;
        const element = document.createElement('div');
        element.innerHTML = target;
        const input = element.querySelector('input, select, textarea');
        if (input) {
          input.value = key;
          input.dispatchEvent(new Event('input'));
        }
        break;
      case 'input':
        const { value, target } = event.data;
        const elem = document.createElement('div');
        elem.innerHTML = target;
        const inputElem = elem.querySelector('input, select, textarea');
        if (inputElem) {
          inputElem.value = value;
          inputElem.dispatchEvent(new Event('input'));
        }
        break;
    }
  }

  destroy() {
    document.removeEventListener('click', this.recordEvent);
    document.removeEventListener('mousemove', this.recordEvent);
    document.removeEventListener('scroll', this.recordEvent);
    document.removeEventListener('keydown', this.recordEvent);
    document.removeEventListener('input', this.recordEvent);
  }
}

// Example usage
document.addEventListener('DOMContentLoaded', () => {
  const recorder = new SessionRecorder();
  
  // Start recording when user clicks the record button
  document.querySelector('#start-recording').addEventListener('click', () => {
    recorder.startRecording();
  });

  // Stop recording when user clicks the stop button
  document.querySelector('#stop-recording').addEventListener('click', () => {
    recorder.stopRecording();
  });
});