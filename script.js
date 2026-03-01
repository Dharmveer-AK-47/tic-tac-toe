// Tic Tac Toe - Advanced Game Logic

class TicTacToe {
    constructor() {
        // Game state
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.gameMode = 'pvp';
        this.difficulty = 'medium';
        
        // Move history for undo/redo
        this.moveHistory = [];
        this.currentMoveIndex = -1;
        
        // Scores
        this.scores = { x: 0, o: 0, draw: 0 };
        
        // Audio
        this.audioContext = null;
        this.soundEnabled = true;
        
        // Avatar state - all using fas (solid) for consistent coloring
        this.avatarX = 'fa-times';
        this.avatarO = 'fa-circle';
        
        // Win patterns
        this.winPatterns = [
            [0,1,2], [3,4,5], [6,7,8],
            [0,3,6], [1,4,7], [2,5,8],
            [0,4,8], [2,4,6]
        ];
        
        // DOM Elements
        this.cells = document.querySelectorAll('.cell');
        this.statusDisplay = document.getElementById('gameStatus');
        this.xScoreEl = document.getElementById('xScore');
        this.oScoreEl = document.getElementById('oScore');
        this.drawScoreEl = document.getElementById('drawScore');
        
        // Get all button elements
        this.pvpBtn = document.getElementById('pvpBtn');
        this.aiBtn = document.getElementById('aiBtn');
        this.tournamentBtn = document.getElementById('tournamentBtn');
        this.difficultySection = document.getElementById('difficultySection');
        this.restartBtn = document.getElementById('restartBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.soundToggle = document.getElementById('soundToggle');
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');
        this.replayBtn = document.getElementById('replayBtn');
        this.statsBtn = document.getElementById('statsBtn');
        this.achievementsBtn = document.getElementById('achievementsBtn');
        this.avatarXBtn = document.getElementById('avatarXBtn');
        this.avatarOBtn = document.getElementById('avatarOBtn');
        this.modal = document.getElementById('gameModal');
        this.modalBtn = document.getElementById('modalBtn');
        this.statsModal = document.getElementById('statsModal');
        this.achievementsModal = document.getElementById('achievementsModal');
        this.aiLoading = document.getElementById('aiLoading');
        
        this.init();
    }
    
    init() {
        this.loadScores();
        this.setupEventListeners();
        this.setupTheme();
        this.updateDisplay();
        this.updateAvatarDisplays();
    }
    
    initAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        switch(type) {
            case 'click':
                osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
                osc.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.1);
                break;
            case 'win':
                [523, 659, 784, 1046].forEach((freq, i) => {
                    const o = this.audioContext.createOscillator();
                    const g = this.audioContext.createGain();
                    o.connect(g);
                    g.connect(this.audioContext.destination);
                    o.frequency.setValueAtTime(freq, this.audioContext.currentTime + i*0.15);
                    g.gain.setValueAtTime(0.1, this.audioContext.currentTime + i*0.15);
                    g.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i*0.15 + 0.15);
                    o.start(this.audioContext.currentTime + i*0.15);
                    o.stop(this.audioContext.currentTime + i*0.15 + 0.15);
                });
                break;
            case 'draw':
                [300, 250, 200].forEach((freq, i) => {
                    const o = this.audioContext.createOscillator();
                    const g = this.audioContext.createGain();
                    o.connect(g);
                    g.connect(this.audioContext.destination);
                    o.frequency.setValueAtTime(freq, this.audioContext.currentTime + i*0.2);
                    g.gain.setValueAtTime(0.1, this.audioContext.currentTime + i*0.2);
                    g.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i*0.2 + 0.2);
                    o.start(this.audioContext.currentTime + i*0.2);
                    o.stop(this.audioContext.currentTime + i*0.2 + 0.2);
                });
                break;
        }
    }
    
    setupEventListeners() {
        // Game board cells
        this.cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleClick(e));
        });
        
        // Game mode buttons
        if (this.pvpBtn) this.pvpBtn.addEventListener('click', () => this.setMode('pvp'));
        if (this.aiBtn) this.aiBtn.addEventListener('click', () => this.setMode('ai'));
        if (this.tournamentBtn) this.tournamentBtn.addEventListener('click', () => this.setMode('tournament'));
        
        // Difficulty buttons
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.closest('.diff-btn');
                if (target) this.setDifficulty(target.dataset.difficulty);
            });
        });
        
        // Control buttons
        if (this.restartBtn) this.restartBtn.addEventListener('click', () => this.restart());
        if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.resetScores());
        if (this.shareBtn) this.shareBtn.addEventListener('click', () => this.shareScore());
        
        // Theme and sound
        if (this.themeToggle) this.themeToggle.addEventListener('click', () => this.toggleTheme());
        if (this.soundToggle) this.soundToggle.addEventListener('click', () => this.toggleSound());
        
        // Undo button
        if (this.undoBtn) {
            this.undoBtn.addEventListener('click', () => this.undo());
        }
        
        // Redo button
        if (this.redoBtn) {
            this.redoBtn.addEventListener('click', () => this.redo());
        }
        
        // Replay button
        if (this.replayBtn) {
            this.replayBtn.addEventListener('click', () => this.startReplay());
        }
        
        // Stats button
        if (this.statsBtn) {
            this.statsBtn.addEventListener('click', () => this.showStats());
        }
        
        // Achievements button
        if (this.achievementsBtn) {
            this.achievementsBtn.addEventListener('click', () => this.showAchievements());
        }
        
        // Avatar buttons
        if (this.avatarXBtn) {
            this.avatarXBtn.addEventListener('click', () => this.showAvatarPicker('X'));
        }
        if (this.avatarOBtn) {
            this.avatarOBtn.addEventListener('click', () => this.showAvatarPicker('O'));
        }
        
        // Player name inputs
        const playerXName = document.getElementById('playerXName');
        const playerOName = document.getElementById('playerOName');
        if (playerXName) {
            playerXName.addEventListener('input', (e) => this.updatePlayerName('X', e.target.value));
        }
        if (playerOName) {
            playerOName.addEventListener('input', (e) => this.updatePlayerName('O', e.target.value));
        }
        
        // Modals
        if (this.modalBtn) this.modalBtn.addEventListener('click', () => this.closeModal());
        const closeStatsBtn = document.getElementById('closeStatsModal');
        if (closeStatsBtn) closeStatsBtn.addEventListener('click', () => this.closeStatsModal());
        const closeAchieveBtn = document.getElementById('closeAchievementsModal');
        if (closeAchieveBtn) closeAchieveBtn.addEventListener('click', () => this.closeAchievementsModal());
        const closeAvatarBtn = document.getElementById('closeAvatarModal');
        if (closeAvatarBtn) closeAvatarBtn.addEventListener('click', () => this.closeAvatarModal());
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') {
                const idx = parseInt(e.key) - 1;
                if (this.board[idx] === '' && this.gameActive) {
                    this.makeMove(idx);
                }
            }
            if (e.key === 'r' || e.key === 'R') this.restart();
            if (e.key === 't' || e.key === 'T') this.toggleTheme();
            if (e.key === 'm' || e.key === 'M') this.toggleSound();
            if (e.key === 'z' || e.key === 'Z') this.undo();
            if (e.key === 'y' || e.key === 'Y') this.redo();
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeStatsModal();
                this.closeAchievementsModal();
                this.closeAvatarModal();
            }
        });
        
        document.addEventListener('click', () => this.initAudio(), { once: true });
    }
    
    // Undo functionality
    undo() {
        if (this.currentMoveIndex < 0 || !this.gameActive) return;
        
        const move = this.moveHistory[this.currentMoveIndex];
        this.board[move.index] = '';
        this.cells[move.index].innerHTML = '';
        this.cells[move.index].classList.remove('x', 'o', 'winner-cell');
        
        this.currentMoveIndex--;
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.updateDisplay();
    }
    
    // Redo functionality
    redo() {
        if (this.currentMoveIndex >= this.moveHistory.length - 1 || !this.gameActive) return;
        
        this.currentMoveIndex++;
        const move = this.moveHistory[this.currentMoveIndex];
        
        this.board[move.index] = move.player;
        // Using fas for all icons for consistent color
        this.cells[move.index].innerHTML = '<i class="fas ' + (move.player === 'X' ? this.avatarX : this.avatarO) + '"></i>';
        this.cells[move.index].classList.add(move.player.toLowerCase());
        
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        
        this.updateDisplay();
    }
    
    // Start replay mode
    startReplay() {
        if (this.moveHistory.length === 0) {
            this.showMessage('No moves to replay!');
            return;
        }
        
        this.gameActive = false;
        this.board = Array(9).fill('');
        
        this.cells.forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('x', 'o', 'winner-cell');
        });
        
        this.currentMoveIndex = -1;
        this.showMessage('Replay mode - use Undo/Redo to navigate');
        
        // Show replay controls
        const replayControls = document.getElementById('replayControls');
        if (replayControls) {
            replayControls.style.display = 'flex';
        }
    }
    
    // Show avatar picker
    showAvatarPicker(player) {
        const modal = document.getElementById('avatarModal');
        const grid = document.getElementById('avatarGrid');
        if (!modal || !grid) return;
        
        const avatars = [
            'fa-times', 'fa-circle', 'fa-star', 'fa-heart', 'fa-bolt', 'fa-fire',
            'fa-gem', 'fa-crown', 'fa-diamond', 'fa-dragon', 'fa-ghost', 'fa-robot'
        ];
        
        grid.innerHTML = avatars.map(avatar => 
            `<button class="avatar-option" data-avatar="${avatar}" data-player="${player}">
                <i class="fas ${avatar}"></i>
            </button>`
        ).join('');
        
        // Add click handlers
        grid.querySelectorAll('.avatar-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const avatar = btn.dataset.avatar;
                const player = btn.dataset.player;
                if (player === 'X') {
                    this.avatarX = avatar;
                } else {
                    this.avatarO = avatar;
                }
                this.updateAvatarDisplays();
                this.closeAvatarModal();
            });
        });
        
        modal.classList.add('show');
    }
    
    closeAvatarModal() {
        const modal = document.getElementById('avatarModal');
        if (modal) modal.classList.remove('show');
    }
    
    updateAvatarDisplays() {
        const avatarX = document.getElementById('avatarX');
        const avatarO = document.getElementById('avatarO');
        
        if (avatarX) avatarX.innerHTML = `<i class="fas ${this.avatarX}"></i>`;
        if (avatarO) avatarO.innerHTML = `<i class="fas ${this.avatarO}"></i>`;
        
        // Update score icons - using fas for all
        const scoreIconX = document.getElementById('scoreIconX');
        const scoreIconO = document.getElementById('scoreIconO');
        
        if (scoreIconX) scoreIconX.innerHTML = `<i class="fas ${this.avatarX}"></i>`;
        if (scoreIconO) scoreIconO.innerHTML = `<i class="fas ${this.avatarO}"></i>`;
    }
    
    updatePlayerName(player, name) {
        const label = document.getElementById(player === 'X' ? 'scoreLabelX' : 'scoreLabelO');
        if (label) {
            label.textContent = name || (player === 'X' ? 'Player X' : 'Player O');
        }
    }
    
    showMessage(msg) {
        this.statusDisplay.innerHTML = '<i class="fas fa-info-circle"></i> ' + msg;
        this.statusDisplay.className = 'game-status';
    }
    
    showStats() {
        const statsModal = document.getElementById('statsModal');
        if (statsModal) {
            const total = this.scores.x + this.scores.o + this.scores.draw;
            const wins = this.scores.x;
            const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
            
            const statTotal = document.getElementById('statTotal');
            const statWinRate = document.getElementById('statWinRate');
            
            if (statTotal) statTotal.textContent = total;
            if (statWinRate) statWinRate.textContent = winRate + '%';
            
            statsModal.classList.add('show');
        }
    }
    
    closeStatsModal() {
        const statsModal = document.getElementById('statsModal');
        if (statsModal) statsModal.classList.remove('show');
    }
    
    showAchievements() {
        const achieveModal = document.getElementById('achievementsModal');
        const achieveList = document.getElementById('achievementsList');
        if (achieveModal && achieveList) {
            const achievements = [
                { name: 'First Win', desc: 'Win your first game', icon: 'fa-star', unlocked: this.scores.x > 0 },
                { name: '10 Wins', desc: 'Win 10 games', icon: 'fa-trophy', unlocked: this.scores.x >= 10 },
                { name: 'Draw Master', desc: 'Get 5 draws', icon: 'fa-handshake', unlocked: this.scores.draw >= 5 },
                { name: 'Unbeatable', desc: 'Win against Hard AI', icon: 'fa-crown', unlocked: false },
                { name: 'Speed Demon', desc: 'Win in 3 moves', icon: 'fa-bolt', unlocked: false },
                { name: 'Perfect Player', desc: 'Win 50 games', icon: 'fa-medal', unlocked: this.scores.x >= 50 }
            ];
            
            achieveList.innerHTML = achievements.map(a => `
                <div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}">
                    <i class="fas ${a.icon}"></i>
                    <div class="achievement-info">
                        <span class="achievement-name">${a.name}</span>
                        <span class="achievement-desc">${a.desc}</span>
                    </div>
                </div>
            `).join('');
            
            achieveModal.classList.add('show');
        }
    }
    
    closeAchievementsModal() {
        const achieveModal = document.getElementById('achievementsModal');
        if (achieveModal) achieveModal.classList.remove('show');
    }
    
    shareScore() {
        const text = `Tic Tac Toe Score - X: ${this.scores.x}, O: ${this.scores.o}, Draws: ${this.scores.draw}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Tic Tac Toe',
                text: text
            });
        } else {
            navigator.clipboard.writeText(text).then(() => {
                this.showMessage('Score copied to clipboard!');
            });
        }
    }
    
    handleClick(e) {
        const cell = e.target.closest('.cell');
        if (!cell) return;
        
        const index = parseInt(cell.dataset.index);
        
        if (this.board[index] !== '' || !this.gameActive) return;
        
        this.makeMove(index);
        
        if (this.gameActive && this.gameMode === 'ai' && this.currentPlayer === 'O') {
            this.aiLoading.classList.add('show');
            setTimeout(() => {
                this.aiLoading.classList.remove('show');
                this.makeAIMove();
            }, 600);
        }
    }
    
    makeMove(index) {
        this.board[index] = this.currentPlayer;
        
        // Use custom avatar with fas for consistent coloring
        const avatarClass = this.currentPlayer === 'X' ? this.avatarX : this.avatarO;
        this.cells[index].innerHTML = `<i class="fas ${avatarClass}"></i>`;
        this.cells[index].classList.add(this.currentPlayer.toLowerCase());
        
        // Add to history
        this.moveHistory = this.moveHistory.slice(0, this.currentMoveIndex + 1);
        this.moveHistory.push({ index, player: this.currentPlayer });
        this.currentMoveIndex = this.moveHistory.length - 1;
        
        this.playSound('click');
        
        const result = this.checkWin();
        if (result.won) {
            this.handleWin(result);
        } else if (this.board.every(c => c !== '')) {
            this.handleDraw();
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateDisplay();
        }
    }
    
    checkWin() {
        for (const pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            if (this.board[a] && 
                this.board[a] === this.board[b] && 
                this.board[a] === this.board[c]) {
                return { won: true, pattern };
            }
        }
        return { won: false };
    }
    
    handleWin(result) {
        this.gameActive = false;
        
        result.pattern.forEach(i => {
            this.cells[i].classList.add('winner-cell');
        });
        
        if (this.currentPlayer === 'X') {
            this.scores.x++;
        } else {
            this.scores.o++;
        }
        
        this.saveScores();
        this.updateScoreDisplay();
        this.playSound('win');
        
        const winnerText = this.gameMode === 'ai' 
            ? (this.currentPlayer === 'X' ? 'You Win!' : 'AI Wins!')
            : `Player ${this.currentPlayer} Wins!`;
        
        this.statusDisplay.innerHTML = '<i class="fas fa-trophy"></i> ' + winnerText;
        this.statusDisplay.className = 'game-status winner';
        
        setTimeout(() => {
            this.showModal(winnerText);
        }, 800);
    }
    
    handleDraw() {
        this.gameActive = false;
        this.scores.draw++;
        
        this.saveScores();
        this.updateScoreDisplay();
        this.playSound('draw');
        
        this.statusDisplay.innerHTML = '<i class="fas fa-handshake"></i> It\'s a Draw!';
        this.statusDisplay.className = 'game-status draw';
        
        setTimeout(() => {
            this.showModal("It's a Draw!");
        }, 800);
    }
    
    makeAIMove() {
        let move;
        
        switch(this.difficulty) {
            case 'easy':
                move = this.getEasyMove();
                break;
            case 'medium':
                move = this.getMediumMove();
                break;
            case 'hard':
                move = this.getHardMove();
                break;
        }
        
        if (move !== null) {
            this.makeMove(move);
        }
    }
    
    getEasyMove() {
        const empty = this.board.map((c, i) => c === '' ? i : -1).filter(i => i >= 0);
        if (empty.length === 0) return null;
        return empty[Math.floor(Math.random() * empty.length)];
    }
    
    getMediumMove() {
        const winMove = this.findWinningMove('O');
        if (winMove !== null) return winMove;
        
        const blockMove = this.findWinningMove('X');
        if (blockMove !== null) return blockMove;
        
        if (this.board[4] === '') return 4;
        
        const empty = this.board.map((c, i) => c === '' ? i : -1).filter(i => i >= 0);
        return empty[Math.floor(Math.random() * empty.length)];
    }
    
    getHardMove() {
        const winMove = this.findWinningMove('O');
        if (winMove !== null) return winMove;
        
        const blockMove = this.findWinningMove('X');
        if (blockMove !== null) return blockMove;
        
        return this.getBestMove();
    }
    
    findWinningMove(player) {
        for (const pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            const cells = [this.board[a], this.board[b], this.board[c]];
            const playerCount = cells.filter(v => v === player).length;
            const emptyCount = cells.filter(v => v === '').length;
            
            if (playerCount === 2 && emptyCount === 1) {
                if (this.board[a] === '') return a;
                if (this.board[b] === '') return b;
                if (this.board[c] === '') return c;
            }
        }
        return null;
    }
    
    getBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        
        for (let i = 0; i < 9; i++) {
            if (this.board[i] === '') {
                this.board[i] = 'O';
                const score = this.minimax(this.board, 0, false);
                this.board[i] = '';
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        
        return bestMove;
    }
    
    minimax(board, depth, isMaximizing) {
        const result = this.checkWin();
        
        if (result.won) {
            const winner = board[result.pattern[0]];
            if (winner === 'O') return 10 - depth;
            if (winner === 'X') return depth - 10;
        }
        
        if (board.every(c => c !== '')) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    const score = this.minimax(board, depth + 1, false);
                    board[i] = '';
                    bestScore = Math.max(score, bestScore);
                }
            }
            return bestScore;
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    const score = this.minimax(board, depth + 1, true);
                    board[i] = '';
                    bestScore = Math.min(score, bestScore);
                }
            }
            return bestScore;
        }
    }
    
    setMode(mode) {
        this.gameMode = mode;
        
        if (this.pvpBtn) this.pvpBtn.classList.toggle('active', mode === 'pvp');
        if (this.aiBtn) this.aiBtn.classList.toggle('active', mode === 'ai');
        if (this.tournamentBtn) this.tournamentBtn.classList.toggle('active', mode === 'tournament');
        
        if (this.difficultySection) {
            this.difficultySection.style.display = mode === 'ai' ? 'block' : 'none';
        }
        
        this.restart();
    }
    
    setDifficulty(diff) {
        this.difficulty = diff;
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === diff);
        });
        this.restart();
    }
    
    restart() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.moveHistory = [];
        this.currentMoveIndex = -1;
        
        // Hide replay controls
        const replayControls = document.getElementById('replayControls');
        if (replayControls) {
            replayControls.style.display = 'none';
        }
        
        this.cells.forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('x', 'o', 'winner-cell');
        });
        
        this.updateDisplay();
    }
    
    resetScores() {
        if (confirm('Reset all scores?')) {
            this.scores = { x: 0, o: 0, draw: 0 };
            this.saveScores();
            this.updateScoreDisplay();
            this.restart();
        }
    }
    
    updateDisplay() {
        const playerText = this.gameMode === 'ai' && this.currentPlayer === 'O' 
            ? 'AI Thinking...' 
            : (this.gameMode === 'ai' ? 'Your Turn' : `Player ${this.currentPlayer}'s Turn`);
        
        this.statusDisplay.innerHTML = '<i class="fas fa-gamepad"></i> ' + playerText;
        this.statusDisplay.className = 'game-status';
        
        // Using fas for all icons for consistent color
        const avatarClass = this.currentPlayer === 'X' ? this.avatarX : this.avatarO;
        document.getElementById('currentPlayerIcon').innerHTML = `<i class="fas ${avatarClass}"></i>`;
        document.getElementById('currentPlayerText').textContent = playerText;
    }
    
    updateScoreDisplay() {
        this.xScoreEl.textContent = this.scores.x;
        this.oScoreEl.textContent = this.scores.o;
        this.drawScoreEl.textContent = this.scores.draw;
    }
    
    saveScores() {
        localStorage.setItem('ttt_scores', JSON.stringify(this.scores));
    }
    
    loadScores() {
        const saved = localStorage.getItem('ttt_scores');
        if (saved) {
            this.scores = JSON.parse(saved);
            this.updateScoreDisplay();
        }
    }
    
    showModal(message) {
        document.getElementById('modalMessage').textContent = message;
        this.modal.classList.add('show');
    }
    
    closeModal() {
        this.modal.classList.remove('show');
        this.restart();
    }
    
    toggleTheme() {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const themes = ['light', 'dark', 'high-contrast'];
        let idx = themes.indexOf(current);
        if (idx === -1) idx = 0;
        const next = themes[(idx + 1) % themes.length];
        
        html.setAttribute('data-theme', next);
        localStorage.setItem('ttt_theme', next);
        
        const icons = { light: 'fa-moon', dark: 'fa-sun', 'high-contrast': 'fa-adjust' };
        this.themeToggle.innerHTML = '<i class="fas ' + icons[next] + '"></i>';
    }
    
    setupTheme() {
        const saved = localStorage.getItem('ttt_theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        
        const icons = { light: 'fa-moon', dark: 'fa-sun', 'high-contrast': 'fa-adjust' };
        this.themeToggle.innerHTML = '<i class="fas ' + icons[saved] + '"></i>';
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.getElementById('soundIcon');
        
        if (this.soundEnabled) {
            icon.classList.remove('fa-volume-muted');
            icon.classList.add('fa-volume-up');
            this.soundToggle.classList.remove('muted');
        } else {
            icon.classList.remove('fa-volume-up');
            icon.classList.add('fa-volume-muted');
            this.soundToggle.classList.add('muted');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
