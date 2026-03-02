/**
 * UI Utilities
 * Sound manager, Modals, Toasts
 */
class UIManager {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = localStorage.getItem('ttt_sound') === 'true';
        this.initSoundToggle();
    }

    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    initSoundToggle() {
        const toggle = document.getElementById('soundToggle');
        if (toggle) {
            this.updateSoundIcon(toggle);
            toggle.addEventListener('click', () => {
                this.soundEnabled = !this.soundEnabled;
                localStorage.setItem('ttt_sound', this.soundEnabled);
                this.updateSoundIcon(toggle);
            });
        }
    }

    updateSoundIcon(el) {
        const icon = el.querySelector('i');
        if (this.soundEnabled) {
            el.classList.remove('muted');
            if (icon) icon.className = 'fas fa-volume-up';
        } else {
            el.classList.add('muted');
            if (icon) icon.className = 'fas fa-volume-mute';
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;
        if (!this.audioContext) this.initAudio();

        const ctx = this.audioContext;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        switch(type) {
            case 'click':
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
                break;
            case 'win':
                [523, 659, 784, 1046].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.frequency.setValueAtTime(freq, ctx.currentTime + i*0.15);
                    g.gain.setValueAtTime(0.1, ctx.currentTime + i*0.15);
                    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i*0.15 + 0.15);
                    o.start(ctx.currentTime + i*0.15);
                    o.stop(ctx.currentTime + i*0.15 + 0.15);
                });
                break;
            case 'draw':
                [300, 250, 200].forEach((freq, i) => {
                    const o = ctx.createOscillator();
                    const g = ctx.createGain();
                    o.connect(g);
                    g.connect(ctx.destination);
                    o.frequency.setValueAtTime(freq, ctx.currentTime + i*0.2);
                    g.gain.setValueAtTime(0.1, ctx.currentTime + i*0.2);
                    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i*0.2 + 0.2);
                    o.start(ctx.currentTime + i*0.2);
                    o.stop(ctx.currentTime + i*0.2 + 0.2);
                });
                break;
        }
    }

    showModal(id, message = '') {
        const modal = document.getElementById(id);
        if (modal) {
            if (message) {
                const msgEl = modal.querySelector('.modal-message');
                if (msgEl) msgEl.textContent = message;
            }
            modal.classList.add('show');
        }
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('show');
    }

    showToast(message, iconClass = 'fa-info-circle') {
        const toast = document.getElementById('achievementToast');
        if (toast) {
            toast.querySelector('i').className = `fas ${iconClass}`;
            toast.querySelector('#achievementText').textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    }
}

const uiManager = new UIManager();
