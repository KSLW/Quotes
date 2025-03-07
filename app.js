class QuotesApp {
    constructor() {
        this.quotableApiUrl = '/.netlify/functions/quotable';
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
        
        // Load initial quote
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
            
            // Try to get a background image from Netlify function
            try {
                const imgResponse = await fetch('/.netlify/functions/unsplash');
                if (imgResponse.ok) {
                    const imgData = await imgResponse.json();
                    this.updateBackgroundImage(imgData.urls.regular);
                } else {
                    // Fallback to gradient if image fetch fails
                    this.changeBackground();
                }
            } catch (error) {
                console.error('Error fetching background image:', error);
                // Fallback to gradient
                this.changeBackground();
            }

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

    updateBackgroundImage(imageUrl) {
        const quoteContainer = document.querySelector('.quote-container');
        if (quoteContainer) {
            quoteContainer.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${imageUrl})`;
            quoteContainer.style.backgroundSize = 'cover';
            quoteContainer.style.backgroundPosition = 'center';
        }
    }

    changeBackground() {
        this.currentBackgroundIndex = (this.currentBackgroundIndex + 1) % this.backgrounds.length;
        this.updateBackgrounds();
    }

    updateBackgrounds() {
        const gradient = this.backgrounds[this.currentBackgroundIndex];
        document.documentElement.style.setProperty('--quote-gradient', gradient);
        
        // Update daily quote background with a darker version
        const dailyQuote = document.querySelector('.daily-quote');
        if (dailyQuote) {
            dailyQuote.style.background = gradient;
        }
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
        copyBtn.disabled = !quote.content || quote.content === "No favorites yet! Add some quotes to your favorites.";
        shareBtn.disabled = copyBtn.disabled;
        
        this.currentQuote = quote;
    }

    async copyCurrentQuote() {
        if (!this.currentQuote) return;
        
        const textToCopy = `"${this.currentQuote.content}" - ${this.currentQuote.author}`;
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            this.showToast('Quote copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            this.showToast('Failed to copy quote');
        }
    }

    async shareQuote() {
        if (!this.currentQuote) return;
        
        const shareText = `"${this.currentQuote.content}" - ${this.currentQuote.author}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Share Quote',
                    text: shareText,
                });
                this.showToast('Quote shared successfully!');
            } catch (err) {
                console.error('Error sharing: ', err);
                this.fallbackShare(shareText);
            }
        } else {
            this.fallbackShare(shareText);
        }
    }

    fallbackShare(text) {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank');
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Trigger reflow
        toast.offsetHeight;
        
        // Add visible class for animation
        toast.classList.add('visible');
        
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    toggleFavorites() {
        this.showingFavorites = !this.showingFavorites;
        const toggleBtn = document.getElementById('toggleFavorites');
        toggleBtn.textContent = this.showingFavorites ? 'Show All Quotes' : 'Show Favorites';
        this.showRandomQuote();
    }

    toggleCurrentQuoteFavorite() {
        if (!this.currentQuote || this.currentQuote.content === "No favorites yet! Add some quotes to your favorites.") {
            return;
        }

        const quoteIndex = this.favorites.findIndex(fav => fav.content === this.currentQuote.content);
        
        if (quoteIndex === -1) {
            this.favorites.push(this.currentQuote);
            this.showToast('Added to favorites!');
        } else {
            this.favorites.splice(quoteIndex, 1);
            this.showToast('Removed from favorites!');
        }

        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        this.displayQuote(this.currentQuote);
    }
}

// Initialize the app
window.onload = () => {
    window.quotesApp = new QuotesApp();
};
