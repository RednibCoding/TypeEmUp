export class AudioManager {
    constructor() {
        // Load audio state from localStorage
        // States: 'all' (default), 'sfx' (sound effects only), 'off' (muted)
        this.audioState = localStorage.getItem('audioState') || 'all';
        
        // Initialize Web Audio API for sound effects
        this.audioContext = null;
        this.audioBuffers = {};
        this.initWebAudio();
        
        // Use HTML5 Audio only for background music (it's fine for that)
        this.music = new Audio('public/music.mp3');
        this.music.loop = false; // We'll handle looping with fade
        this.music.volume = 0;
        
        // Music fade settings
        this.targetVolume = 0.3; // Max volume for music
        this.fadeSpeed = 0.005; // How fast to fade
        this.isFading = false;
        this.fadeDirection = 'in'; // 'in' or 'out'
        this.musicPlaying = false;
        
        // Preload music
        this.music.load();
        
        // Handle music ended event for looping with fade
        this.music.addEventListener('ended', () => {
            if (this.musicPlaying && this.audioState === 'all') {
                // Restart music and fade in again
                this.music.currentTime = 0;
                this.music.volume = 0;
                this.fadeDirection = 'in';
                this.music.play().catch(err => console.log('Music play failed:', err));
            }
        });
        
        // Handle music time update for fade out before end
        this.music.addEventListener('timeupdate', () => {
            if (this.musicPlaying && this.audioState === 'all' && this.music.duration > 0) {
                const timeLeft = this.music.duration - this.music.currentTime;
                // Start fading out 3 seconds before the end
                if (timeLeft < 3 && this.fadeDirection !== 'out') {
                    this.fadeDirection = 'out';
                }
            }
        });
        
        // Start fade update loop
        this.updateFade();
    }
    
    async initWebAudio() {
        try {
            // Create AudioContext on user interaction (required by browsers)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Load sound effect files into buffers
            await this.loadSound('explosion', 'public/explosion.wav');
            await this.loadSound('click', 'public/click.wav');
            await this.loadSound('shoot', 'public/shoot.mp3');
        } catch (err) {
            console.log('Web Audio API initialization failed:', err);
        }
    }
    
    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioBuffers[name] = audioBuffer;
        } catch (err) {
            console.log(`Failed to load sound ${name}:`, err);
        }
    }
    
    playBuffer(bufferName, volume = 1.0) {
        if (this.audioState === 'off') return;
        if (!this.audioContext || !this.audioBuffers[bufferName]) return;
        
        // Resume AudioContext if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Create a new source for this playback
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffers[bufferName];
        
        // Create gain node for volume control
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;
        
        // Connect: source -> gain -> destination
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Play the sound
        source.start(0);
    }
    
    updateFade() {
        if (this.musicPlaying && this.audioState === 'all') {
            if (this.fadeDirection === 'in' && this.music.volume < this.targetVolume) {
                this.music.volume = Math.min(this.targetVolume, this.music.volume + this.fadeSpeed);
            } else if (this.fadeDirection === 'out' && this.music.volume > 0) {
                this.music.volume = Math.max(0, this.music.volume - this.fadeSpeed);
            }
        }
        
        requestAnimationFrame(() => this.updateFade());
    }
    
    playExplosion() {
        this.playBuffer('explosion', 0.3);
    }
    
    playClick() {
        this.playBuffer('click', 0.2);
    }
    
    playShoot() {
        this.playBuffer('shoot', 0.2);
    }
    
    startMusic() {
        if (this.audioState === 'off' || this.musicPlaying) return;
        
        this.musicPlaying = true;
        
        if (this.audioState === 'all') {
            this.music.volume = 0;
            this.fadeDirection = 'in';
            this.music.currentTime = 0;
            this.music.play().catch(err => console.log('Music play failed:', err));
        }
    }
    
    stopMusic() {
        this.musicPlaying = false;
        this.fadeDirection = 'out';
        
        // Gradually stop the music
        const fadeOut = setInterval(() => {
            if (this.music.volume > 0.01) {
                this.music.volume = Math.max(0, this.music.volume - 0.02);
            } else {
                this.music.pause();
                this.music.currentTime = 0;
                this.music.volume = 0;
                clearInterval(fadeOut);
            }
        }, 50);
    }
    
    toggle() {
        // Cycle through states: all -> sfx -> off -> all
        if (this.audioState === 'all') {
            this.audioState = 'sfx';
            // Stop music but keep sound effects
            if (this.musicPlaying) {
                this.music.pause();
                this.music.volume = 0;
            }
        } else if (this.audioState === 'sfx') {
            this.audioState = 'off';
            // Mute everything
            this.music.volume = 0;
            if (this.musicPlaying) {
                this.music.pause();
            }
        } else {
            this.audioState = 'all';
            // Resume everything
            if (this.musicPlaying) {
                this.fadeDirection = 'in';
                this.music.play().catch(err => console.log('Music play failed:', err));
            }
        }
        
        localStorage.setItem('audioState', this.audioState);
        return this.audioState;
    }
    
    getState() {
        return this.audioState;
    }
}
