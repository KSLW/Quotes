describe('QuotesApp', () => {
    let app;
    
    beforeEach(() => {
        // Mock localStorage
        const localStorageMock = {
            getItem: jest.fn(),
            setItem: jest.fn(),
            clear: jest.fn()
        };
        global.localStorage = localStorageMock;
        
        // Mock fetch
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({
                    content: "Test quote",
                    author: "Test Author",
                    tags: ["test"]
                })
            })
        );
        
        // Mock DOM elements
        document.body.innerHTML = `
            <div id="quoteText"></div>
            <div id="author"></div>
            <div id="tags"></div>
            <button id="newQuote"></button>
            <button id="favorite"></button>
            <button id="copy"></button>
            <button id="share"></button>
            <button id="changeBackground"></button>
        `;
        
        // Import and instantiate QuotesApp
        const QuotesApp = require('../app.js');
        app = new QuotesApp();
    });
    
    test('displays quote correctly', async () => {
        await app.showRandomQuote();
        
        expect(document.getElementById('quoteText').textContent).toBe('Test quote');
        expect(document.getElementById('author').textContent).toBe('- Test Author');
    });
    
    test('handles favorites correctly', () => {
        const quote = {
            content: "Test quote",
            author: "Test Author",
            tags: ["test"]
        };
        
        app.toggleFavorite(quote);
        expect(app.favorites).toContain(quote);
        
        app.toggleFavorite(quote);
        expect(app.favorites).not.toContain(quote);
    });
    
    test('changes background', () => {
        const initialBackground = app.currentBackgroundIndex;
        app.changeBackground();
        expect(app.currentBackgroundIndex).not.toBe(initialBackground);
    });
});
