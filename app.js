class QuotesApp {
    constructor() {
        this.quotableApiUrl = 'https://api.quotable.io/random';
        this.backgrounds = [
            'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
            'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
            'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
        ];
        this.currentBackgroundIndex = 0;
        this.favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        this.showingFavorites = false;
        this.currentQuote = null;
        this.init();
    }

    async init() {
        try {
            await this.setupEventListeners();
            await this.checkDailyQuote();
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    }

    async setupEventListeners() {
        document.getElementById('newQuote').addEventListener('click', () => this.showRandomQuote());
        document.getElementById('toggleFavorites').addEventListener('click', () => this.toggleFavorites());
        document.getElementById('favorite').addEventListener('click', () => this.toggleCurrentQuoteFavorite());
        document.getElementById('copy').addEventListener('click', () => this.copyCurrentQuote());
        document.getElementById('share').addEventListener('click', () => this.shareQuote());
        document.getElementById('changeBackground').addEventListener('click', () => this.changeBackground());
        
        await this.showRandomQuote();
    }

    async checkDailyQuote() {
        const today = new Date().toLocaleDateString();
        const storedDate = localStorage.getItem('lastQuoteDate');
        const dailyQuote = JSON.parse(localStorage.getItem('dailyQuote'));

        if (storedDate !== today || !dailyQuote) {
            try {
                const response = await fetch(this.quotableApiUrl);
                if (!response.ok) throw new Error('Failed to fetch quote');
                
                const quote = await response.json();
                localStorage.setItem('dailyQuote', JSON.stringify(quote));
                localStorage.setItem('lastQuoteDate', today);
                this.displayDailyQuote(quote);
            } catch (error) {
                console.error('Error fetching daily quote:', error);
            }
        } else {
            this.displayDailyQuote(dailyQuote);
        }
    }

    async showRandomQuote() {
        if (this.showingFavorites) {
            if (this.favorites.length === 0) {
                this.displayQuote({
                    content: "No favorites yet! Add some quotes to your favorites.",
                    author: "Anonymous",
                    tags: []
                });
                return;
            }
            const randomFavorite = this.favorites[Math.floor(Math.random() * this.favorites.length)];
            this.displayQuote(randomFavorite);
            return;
        }

        try {
            const response = await fetch(this.quotableApiUrl);
            if (!response.ok) throw new Error('Failed to fetch quote');
            const quote = await response.json();
            
            this.changeBackground();
            this.currentQuote = quote;
            this.displayQuote(quote);
        } catch (error) {
            console.error('Error fetching quote:', error);
            this.displayQuote({
                content: "Failed to fetch quote. Please try again.",
                author: "System",
                tags: []
            });
        }
    }

    changeBackground() {
        this.currentBackgroundIndex = (this.currentBackgroundIndex + 1) % this.backgrounds.length;
        const gradient = this.backgrounds[this.currentBackgroundIndex];
        document.documentElement.style.setProperty('--quote-gradient', gradient);
    }

    displayDailyQuote(quote) {
        const dailyQuoteElement = document.getElementById('dailyQuote');
        if (dailyQuoteElement) {
            dailyQuoteElement.innerHTML = `
                <div class="daily-badge">Quote of the Day</div>
                <div class="quote-text">${quote.content}</div>
                <div class="author">- ${quote.author}</div>
            `;
        }
    }

    displayQuote(quote) {
        const quoteText = document.getElementById('quoteText');
        const authorText = document.getElementById('author');
        const tagsContainer = document.getElementById('tags');
        const favoriteBtn = document.getElementById('favorite');
        const copyBtn = document.getElementById('copy');
        const shareBtn = document.getElementById('share');

        quoteText.textContent = quote.content;
        authorText.textContent = `- ${quote.author}`;
        
        // Update tags
        tagsContainer.innerHTML = '';
        if (quote.tags && quote.tags.length > 0) {
            quote.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag';
                tagSpan.textContent = tag;
                tagsContainer.appendChild(tagSpan);
            });
        }

        // Update favorite button
        const isFavorite = this.favorites.some(fav => fav.content === quote.content);
        favoriteBtn.textContent = isFavorite ? '♥' : '♡';
        favoriteBtn.classList.toggle('favorited', isFavorite);
        
        // Enable/disable action buttons
        const isValidQuote = quote.content && quote.content !== "No favorites yet! Add some quotes to your favorites.";
        copyBtn.disabled = !isValidQuote;
        shareBtn.disabled = !isValidQuote;
        
        this.currentQuote = quote;
    }

    async copyCurrentQuote() {
        if (!this.currentQuote) return;
        const text = `"${this.currentQuote.content}" - ${this.currentQuote.author}`;
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Quote copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy quote:', error);
            this.showToast('Failed to copy quote');
        }
    }

    async shareQuote() {
        if (!this.currentQuote) return;
        const text = `"${this.currentQuote.content}" - ${this.currentQuote.author}`;
        
        if (navigator.share) {
            try {
                await navigator.share({ text });
                this.showToast('Quote shared successfully!');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    this.fallbackShare(text);
                }
            }
        } else {
            this.fallbackShare(text);
        }
    }

    fallbackShare(text) {
        this.copyCurrentQuote();
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    toggleFavorites() {
        this.showingFavorites = !this.showingFavorites;
        const toggleBtn = document.getElementById('toggleFavorites');
        toggleBtn.textContent = this.showingFavorites ? 'Show All Quotes' : 'Show Favorites';
        this.showRandomQuote();
    }

    toggleCurrentQuoteFavorite() {
        if (!this.currentQuote || this.currentQuote.author === 'System') return;

        const index = this.favorites.findIndex(fav => fav.content === this.currentQuote.content);
        if (index === -1) {
            this.favorites.push(this.currentQuote);
            this.showToast('Added to favorites!');
        } else {
            this.favorites.splice(index, 1);
            this.showToast('Removed from favorites!');
        }

        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.displayQuote(this.currentQuote);
    }
}

// Initialize the app
new QuotesApp();
