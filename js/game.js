/**
 * Game Controller
 * Connects Core Logic, State, and UI
 */
class GameController {
    constructor() {
        this.core = new GameCore();
        this.gameState = new GameState();
        this.ui = new UIManager();
        
        // Load settings from state
        this.mode = this.gameState.get('gameMode');
        this.difficulty = this.gameState.get('difficulty');
        this.players = this.gameState.get('players');
        
        this.cells = document.querySelectorAll('.cell');
        this.statusDisplay = document.getElementById('gameStatus');
        this.currentPlayerDisplay = {
            icon: document.getElementById('currentPlayerIcon'),
            text: document.getElementById('currentPlayerText')
        };
        
        this.moveHistory = [];
        this.historyIndex = -1;
        
        this.init();
    }

    init() {
        this.updatePlayerInfo();
        this.updateScoreBoard();
        this.setupListeners();
        this.core.reset();
        this.updateStatus();
        this.setupTournament();
    }

    setupTournament() {
        if (this.mode === 'tournament') {
            const t = this.gameState.state.tournament;
            if (!t) return; // Should not happen
            
            document.getElementById('tournamentInfo').style.display = 'block';
            document.getElementById('tournamentRound').textContent = `Round ${t.round}`;
            document.getElementById('tourneyScoreX').textContent = `X: ${t.wins.x}`;
            document.getElementById('tourneyScoreO').textContent = `O: ${t.wins.o}`;
            document.getElementById('bestOfVal').textContent = t.bestOf;
        }
    }

    updatePlayerInfo() {
        document.getElementById('scoreLabelX').textContent = this.players.x.name;
        document.getElementById('scoreLabelO').textContent = this.players.o.name;
        
        document.getElementById('scoreIconX').innerHTML = `<i class="fas ${this.players.x.avatar}"></i>`;
        document.getElementById('scoreIconO').innerHTML = `<i class="fas ${this.players.o.avatar}"></i>`;
        
        // Coloring
        document.querySelector('.x-score .player-icon').style.color = 'var(--accent-x)';
        document.querySelector('.o-score .player-icon').style.color = 'var(--accent-o)';
    }

    setupListeners() {
        this.cells.forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });

        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        
        // Custom Confirmation Modal Logic
        const resetBtn = document.getElementById('resetBtn');
        const confirmModal = document.getElementById('confirmModal');
        const confirmYes = document.getElementById('confirmYesBtn');
        const confirmCancel = document.getElementById('confirmCancelBtn');

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirmModal) confirmModal.classList.add('show');
            });
        }

        if (confirmYes) {
            confirmYes.addEventListener('click', () => {
                this.gameState.resetScores();
                this.updateScoreBoard();
                this.restart();
                if (confirmModal) confirmModal.classList.remove('show');
            });
        }

        if (confirmCancel) {
            confirmCancel.addEventListener('click', () => {
                if (confirmModal) confirmModal.classList.remove('show');
            });
        }
        document.getElementById('shareBtn').addEventListener('click', () => {
            const scores = this.gameState.state.scores;
            // Generate a more descriptive and engaging share text
            // Using window.location.origin to point to the root of the site (assuming index.html is there)
            // or just window.location.href. Let's use origin + path to index if possible, or just current href.
            // Since play.html is part of the flow, maybe we want to share the game link. 
            // Let's use window.location.href for now as it's simple dynamic URL.
            const url = window.location.href;
            
            const baseText = `🎮 Tic Tac Toe Showdown!\n\n` +
                         `🏆 ${this.players.x.name} (X): ${scores.x}\n` +
                         `🏆 ${this.players.o.name} (O): ${scores.o}\n` +
                         `🤝 Draws: ${scores.draw}\n\n` +
                         `Can you beat my score? Play now:`;

            if (navigator.share) {
                navigator.share({
                    title: 'Tic Tac Toe Results',
                    text: baseText,
                    url: url
                }).catch(console.error);
            } else {
                navigator.clipboard.writeText(`${baseText} ${url}`).then(() => {
                    this.ui.showToast('Score & Link copied to clipboard!', 'fa-clipboard-check');
                }).catch(() => {
                    this.ui.showToast('Failed to copy to clipboard', 'fa-exclamation-circle');
                });
            }
        });

        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            // ... (implement keyboard if needed, skipping for brevity but good to have)
        });
    }

    handleCellClick(cell) {
        const index = parseInt(cell.dataset.index);
        
        if (!this.core.gameActive || this.core.board[index] !== '') return;

        if (this.mode === 'ai' && this.core.currentPlayer === 'O') return; // Wait for AI

        this.executeMove(index);

        if (this.core.gameActive && this.mode === 'ai' && this.core.currentPlayer === 'O') {
            this.handleAIMove();
        }
    }

    executeMove(index) {
        if (this.core.makeMove(index)) {
            // Update UI
            this.updateCell(index);
            this.ui.playSound('click');
            
            // History
            this.moveHistory = this.moveHistory.slice(0, this.historyIndex + 1);
            this.moveHistory.push({ index, player: this.core.currentPlayer === 'X' ? 'X' : 'O' }); // Previous player made the move? No, current player just moved.
            // Wait, core.currentPlayer is switched AFTER move?
            // current makeMove uses this.currentPlayer to mark board.
            // So we capture CURRENT player.
            // But verify core.currentPlayer hasn't switched yet?
            // My GameCore stores state.
            
            // In GameCore: makeMove sets board[index] = currentPlayer.
            // So we record who moved.
            this.historyIndex++;

            const result = this.core.checkWin();
            if (result.won) {
                this.handleWin(result);
            } else if (result.draw) {
                this.handleDraw();
            } else {
                this.core.switchPlayer();
                this.updateStatus();
            }
        }
    }

    handleAIMove() {
        const loading = document.getElementById('aiLoading');
        loading.classList.add('show');
        
        // Small delay for realism
        setTimeout(() => {
            const move = this.core.getBestMove(this.difficulty);
            if (move !== null) {
                this.executeMove(move);
            }
            loading.classList.remove('show');
        }, 600);
    }

    updateCell(index) {
        const cell = this.cells[index];
        const player = this.core.board[index];
        const avatar = player === 'X' ? this.players.x.avatar : this.players.o.avatar;
        
        cell.innerHTML = `<i class="fas ${avatar}"></i>`;
        cell.className = `cell ${player.toLowerCase()}`;
    }

    updateStatus() {
        const p = this.core.currentPlayer;
        const name = p === 'X' ? this.players.x.name : this.players.o.name;
        const avatar = p === 'X' ? this.players.x.avatar : this.players.o.avatar;
        
        this.statusDisplay.innerHTML = `<i class="fas fa-gamepad"></i> ${name}'s Turn`;
        this.statusDisplay.className = 'game-status';
        
        this.currentPlayerDisplay.icon.innerHTML = `<i class="fas ${avatar}"></i>`;
        this.currentPlayerDisplay.icon.style.color = p === 'X' ? 'var(--accent-x)' : 'var(--accent-o)';
        this.currentPlayerDisplay.text.textContent = `${name}'s Turn`;
    }

    handleWin(result) {
        this.core.gameActive = false;
        result.pattern.forEach(idx => this.cells[idx].classList.add('winner-cell'));
        
        const winner = result.winner; // 'X' or 'O'
        const winnerName = winner === 'X' ? this.players.x.name : this.players.o.name;
        
        this.statusDisplay.innerHTML = `<i class="fas fa-trophy"></i> ${winnerName} Wins!`;
        this.statusDisplay.classList.add('winner');
        
        this.ui.playSound('win');
        
        // Update Stats
        const gameResult = {
            winner: winner,
            moves: this.moveHistory.length, // total moves
            difficulty: this.difficulty,
            mode: this.mode
        };
        
        const achievement = this.gameState.updateStats(gameResult); // Returns unlocked achievement if any
        if (achievement) {
            this.ui.showToast(`Achievement Unlocked: ${achievement.name}`, achievement.icon);
        }
        
        this.updateScoreBoard();
        
        let modalTitle = `<i class="fas fa-trophy"></i> Winner!`;
        let modalMsg = `${winnerName} has won the game!`;

        if (this.mode === 'tournament') {
            const t = this.gameState.state.tournament;
            if (winner === 'X') t.wins.x++;
            else t.wins.o++;
            
            // Check overall winner
            const needed = Math.ceil(t.bestOf / 2);
            let tourneyOver = false;
            
            if (t.wins.x >= needed) {
                modalTitle = `<i class="fas fa-crown"></i> Tournament Champion!`;
                modalMsg = `${this.players.x.name} wins the tournament! (${t.wins.x}-${t.wins.o})`;
                tourneyOver = true;
            } else if (t.wins.o >= needed) {
                modalTitle = `<i class="fas fa-crown"></i> Tournament Champion!`;
                modalMsg = `${this.players.o.name} wins the tournament! (${t.wins.o}-${t.wins.x})`;
                tourneyOver = true;
            } else {
                modalMsg = `${winnerName} takes this round! Score: ${t.wins.x}-${t.wins.o}`;
                t.round++;
            }
            
            this.gameState.save();
            this.setupTournament(); // Update UI
            
            if (tourneyOver) {
                // Reset tournament state or navigate home?
                // Just keep state for now so user can see result.
                // Reset on "Play Again".
            }
        }
        
        setTimeout(() => {
            document.getElementById('modalTitle').innerHTML = modalTitle;
            document.getElementById('modalMessage').textContent = modalMsg;
            this.ui.showModal('gameModal');
        }, 1000);
    }

    handleDraw() {
        this.core.gameActive = false;
        this.statusDisplay.innerHTML = `<i class="fas fa-handshake"></i> It's a Draw!`;
        this.statusDisplay.classList.add('draw');
        
        this.ui.playSound('draw');
        
        this.gameState.updateStats({ winner: 'Draw', moves: 9, mode: this.mode });
        this.updateScoreBoard();
        
        setTimeout(() => {
            document.getElementById('modalTitle').innerHTML = `<i class="fas fa-handshake"></i> Draw!`;
            document.getElementById('modalMessage').textContent = `Good game! It's a tie.`;
            this.ui.showModal('gameModal');
        }, 1000);
    }

    updateScoreBoard() {
        const scores = this.gameState.state.scores;
        document.getElementById('xScore').textContent = scores.x;
        document.getElementById('oScore').textContent = scores.o;
        document.getElementById('drawScore').textContent = scores.draw;
    }

    restart() {
        // Reset check
        if (this.mode === 'tournament') {
            const t = this.gameState.state.tournament;
            const needed = Math.ceil(t.bestOf / 2);
            if (t.wins.x >= needed || t.wins.o >= needed) {
                // Determine if we should navigate away or restart completely
                if (confirm('Tournament finished! Start a new one?')) {
                    window.location.href = 'setup.html'; // Go back to setup
                    return;
                } else {
                     // Reset local tournament state
                     this.gameState.state.tournament = { bestOf: t.bestOf, round: 1, wins: { x: 0, o: 0 } };
                     this.gameState.save();
                     this.setupTournament();
                }
            }
        }
        
        this.core.reset();
        this.cells.forEach(c => {
            c.innerHTML = '';
            c.className = 'cell';
        });
        this.moveHistory = [];
        this.historyIndex = -1;
        this.updateStatus();
        this.ui.closeModal('gameModal');
    }

    undo() {
        // Core doesn't support undo directly, need to rebuild state or implement undo in core
        // Since we have moveHistory, we can rebuild.
        if (this.historyIndex < 0 || !this.core.gameActive) return;

        // Remove last move
        const lastMove = this.moveHistory[this.historyIndex];
        this.historyIndex--;
        
        // Revert board
        this.core.board[lastMove.index] = '';
        this.core.currentPlayer = lastMove.player === 'X' ? 'X' : 'O'; // Set back to who made the move, effectively undoing the switch
        // Wait, if X moved, player became O. Undo -> player becomes X.
        
        this.updateCellClear(lastMove.index);
        this.updateStatus();

        // If AI mode, likely need to undo TWO moves (User + AI)
        if (this.mode === 'ai' && this.historyIndex >= 0) {
            // Undo AI move too
            const aiMove = this.moveHistory[this.historyIndex]; // logic error? 
            // no, if we undo once, it's AI's move that gets undone (if AI moved last).
            // But usually user wants to undo THEIR move.
            // If it's user turn, last move was AI. Undo AI -> User turn? No, AI moves immediately.
            // So if it's User turn, AI and User checked.
            // Let's implement single step undo for now, simpler. User can undo twice.
        }
    }
    
    redo() {
        if (this.historyIndex >= this.moveHistory.length - 1 || !this.core.gameActive) return;
        
        this.historyIndex++;
        const move = this.moveHistory[this.historyIndex];
        
        this.core.board[move.index] = move.player === 'X' ? 'X' : 'O'; // Use 'X' or 'O' chars
        // But players use arbitrary chars? No, core uses X/O.
        
        this.core.currentPlayer = move.player === 'X' ? 'O' : 'X';
        this.updateCell(move.index); // Use updateCell to render avatar
        this.updateStatus();
    }

    updateCellClear(index) {
        this.cells[index].innerHTML = '';
        this.cells[index].className = 'cell';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new GameController();
    
    document.getElementById('modalBtn').addEventListener('click', () => window.game.restart());
});
