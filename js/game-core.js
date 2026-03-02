/**
 * Core Game Logic (Pure JS)
 */
class GameCore {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
        this.winPatterns = [
            [0,1,2], [3,4,5], [6,7,8],
            [0,3,6], [1,4,7], [2,5,8],
            [0,4,8], [2,4,6]
        ];
    }

    reset() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.gameActive = true;
    }

    makeMove(index) {
        if (this.board[index] !== '' || !this.gameActive) return false;
        this.board[index] = this.currentPlayer;
        return true;
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }

    checkWin(board = this.board) { // Allow checking a specific board state
        for (const pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && 
                board[a] === board[b] && 
                board[a] === board[c]) {
                return { won: true, pattern, winner: board[a] };
            }
        }
        if (board.every(c => c !== '')) {
            return { won: false, draw: true };
        }
        return { won: false, draw: false };
    }

    // AI Logic
    getBestMove(difficulty) {
        if (difficulty === 'easy') return this.getEasyMove();
        if (difficulty === 'medium') return this.getMediumMove();
        return this.getHardMove(); // Hard
    }

    getEasyMove() {
        const empty = this.board.map((c, i) => c === '' ? i : -1).filter(i => i >= 0);
        if (empty.length === 0) return null;
        return empty[Math.floor(Math.random() * empty.length)];
    }

    getMediumMove() {
        // Win if possible
        const winMove = this.findWinningMove('O');
        if (winMove !== null) return winMove;
        
        // Block if necessary
        const blockMove = this.findWinningMove('X');
        if (blockMove !== null) return blockMove;
        
        // Take center
        if (this.board[4] === '') return 4;
        
        // Random
        return this.getEasyMove();
    }

    getHardMove() {
        // Win if possible
        const winMove = this.findWinningMove('O');
        if (winMove !== null) return winMove;
        
        // Block if necessary
        const blockMove = this.findWinningMove('X');
        if (blockMove !== null) return blockMove;
        
        // Minimax
        return this.minimaxRoot();
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
        return null; // Implicit null
    }

    minimaxRoot() {
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
            return result.winner === 'O' ? 10 - depth : depth - 10;
        }
        if (result.draw) return 0;

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
}
