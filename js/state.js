/**
 * State Management for Tic Tac Toe
 * Handles localStorage persistence and shared state across pages
 */
class GameState {
    constructor() {
        this.defaults = {
            theme: 'light',
            soundEnabled: true,
            gameMode: 'pvp', // pvp, ai, tournament
            difficulty: 'medium', // easy, medium, hard
            players: {
                x: { name: 'Player X', avatar: 'fa-times' },
                o: { name: 'Player O', avatar: 'fa-circle' }
            },
            scores: { x: 0, o: 0, draw: 0 },
            stats: {
                totalGames: 0,
                xWins: 0,
                oWins: 0, 
                draws: 0,
                currentStreak: 0,
                bestStreak: 0,
                fastestWin: null, // in seconds or moves? moves based on existing logic
                perfectGames: 0 // games won without opponent scoring? No, existing logic says "Win 50 games". Let's assume based on implementation.
            },
            achievements: [
                { id: 'first_win', name: 'First Win', desc: 'Win your first game', icon: 'fa-star', unlocked: false },
                { id: '10_wins', name: '10 Wins', desc: 'Win 10 games', icon: 'fa-trophy', unlocked: false },
                { id: 'draw_master', name: 'Draw Master', desc: 'Get 5 draws', icon: 'fa-handshake', unlocked: false },
                { id: 'unbeatable', name: 'Unbeatable', desc: 'Win against Hard AI', icon: 'fa-crown', unlocked: false },
                { id: 'speed_demon', name: 'Speed Demon', desc: 'Win in 3 moves', icon: 'fa-bolt', unlocked: false },
                { id: 'perfect_player', name: 'Perfect Player', desc: 'Win 50 games', icon: 'fa-medal', unlocked: false }
            ]
        };
        
        this.state = this.load();
    }

    load() {
        const stored = localStorage.getItem('ttt_state');
        if (stored) {
            return { ...this.defaults, ...JSON.parse(stored) };
        }
        return JSON.parse(JSON.stringify(this.defaults));
    }

    save() {
        localStorage.setItem('ttt_state', JSON.stringify(this.state));
    }

    get(key) {
        return this.state[key];
    }

    set(key, value) {
        this.state[key] = value;
        this.save();
    }

    updateStats(result) { // result: { winner: 'X' | 'O' | 'Draw', moves: number, difficulty: string, mode: string }
        this.state.stats.totalGames++;
        
        if (result.winner === 'Draw') {
            this.state.stats.draws++;
            this.state.stats.currentStreak = 0;
            this.state.scores.draw++;
        } else {
            if (result.winner === 'X') {
                this.state.stats.xWins++;
                this.state.scores.x++;
            } else {
                this.state.stats.oWins++;
                this.state.scores.o++;
            }

            // Streak logic (assuming Streak is for the human player or winning in general? The existing code tracks a single streak)
            // Let's assume Streak is for 'X' or the winner. 
            // Actually, in PvP, streak is ambiguous. In PvAI, it's usually the user (X).
            // Let's increment streak on any win for now, reset on loss (if playing as X against AI).
            // Original code didn't specify streak logic clearly in the snippet, but let's implement a general "Win Streak"
            this.state.stats.currentStreak++;
            if (this.state.stats.currentStreak > this.state.stats.bestStreak) {
                this.state.stats.bestStreak = this.state.stats.currentStreak;
            }

            // Fastest Win
            if (this.state.stats.fastestWin === null || result.moves < this.state.stats.fastestWin) {
                this.state.stats.fastestWin = result.moves;
            }
        }
        
        this.checkAchievements(result);
        this.save();
    }

    checkAchievements(result) {
        let newUnlock = false;
        const s = this.state.stats;
        const totalWins = s.xWins + s.oWins; // Simplified for "Wins"

        const checks = [
            { id: 'first_win', condition: () => totalWins >= 1 },
            { id: '10_wins', condition: () => totalWins >= 10 },
            { id: 'draw_master', condition: () => s.draws >= 5 },
            { id: 'unbeatable', condition: () => result.winner === 'X' && result.mode === 'ai' && result.difficulty === 'hard' },
            { id: 'speed_demon', condition: () => result.winner !== 'Draw' && result.moves <= 5 }, // 3 moves for one player implies 5 total moves (X O X O X) minimum to win? Actually 3 moves for X (1,2,3). Total moves on board = 5.
            { id: 'perfect_player', condition: () => totalWins >= 50 }
        ];

        checks.forEach(check => {
            const ach = this.state.achievements.find(a => a.id === check.id);
            if (ach && !ach.unlocked && check.condition()) {
                ach.unlocked = true;
                newUnlock = ach; // Return the last unlocked one for toast
            }
        });

        if (newUnlock) return newUnlock; // Return object to show toast
        return null;
    }

    resetScores() {
        this.state.scores = { x: 0, o: 0, draw: 0 };
        this.state.stats.currentStreak = 0;
        this.save();
    }
}

const gameState = new GameState();
