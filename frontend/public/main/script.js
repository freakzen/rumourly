document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const GEMINI_API_KEY = 'AIzaSyCyV_ceVO17M7xo2jotd6PKEI1h0vA8yC4';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    // DOM Elements
    const loadingScreen = document.getElementById('loadingScreen');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileMenu = document.getElementById('mobileMenu');
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const resultsSection = document.getElementById('resultsSection');
    const generatingResponse = document.getElementById('generatingResponse');
    const resultsContent = document.getElementById('resultsContent');
    const articlesGrid = document.getElementById('articlesGrid');
    const truePercentageElement = document.getElementById('truePercentage');
    const relatedResultsContent = document.getElementById('relatedResultsContent');
    const trueSegment = document.querySelector('.true-segment');
    const falseSegment = document.querySelector('.false-segment');
    const legendTexts = document.querySelectorAll('.legend-text');
    
    // Initialize loading screen
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 2000);
    
    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.add('active');
    });
    
    mobileMenuClose.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
    });
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            this.classList.add('active');
            mobileMenu.classList.remove('active');
        });
    });
    
    // Search functionality
    searchBtn.addEventListener('click', analyzeClaim);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            analyzeClaim();
        }
    });
    
    // Trending tags click event
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', function(e) {
            e.preventDefault();
            searchInput.value = this.textContent;
            analyzeClaim();
        });
    });
    
    // Main function to analyze a claim using Gemini API
    async function analyzeClaim() {
        const claim = searchInput.value.trim();
        
        if (claim === '') {
            alert('Please enter a claim to analyze');
            return;
        }
        
        // Show loading states
        resultsSection.style.display = 'block';
        generatingResponse.classList.add('active');
        resultsContent.style.opacity = '0';
        resultsContent.style.transform = 'translateY(20px)';
        relatedResultsContent.innerHTML = `
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        `;
        
        try {
            // Step 1: Get truth percentage estimation
            const truthPercentage = await getTruthPercentage(claim);
            const falsePercentage = 100 - truthPercentage;
            
            // Update pie chart
            updatePieChart(truthPercentage, falsePercentage);
            
            // Step 2: Get related results from Gemini
            const relatedResults = await getRelatedResults(claim);
            updateRelatedResults(relatedResults);
            
            // Step 3: Get related articles
            const articles = await getRelatedArticles(claim);
            displayArticles(articles);
            
        } catch (error) {
            console.error('Error analyzing claim:', error);
            relatedResultsContent.innerHTML = 
                '<p>Could not fetch related results. Please try again later.</p>';
        } finally {
            generatingResponse.classList.remove('active');
            resultsContent.style.opacity = '1';
            resultsContent.style.transform = 'translateY(0)';
            resultsContent.classList.add('show');
        }
    }
    
    // Function to get related results from Gemini
    async function getRelatedResults(claim) {
        const prompt = `Provide detailed information about: "${claim}". 
                       Include relevant facts, context, and sources if available. 
                       Format the response in clear paragraphs with proper spacing.
                       Focus on factual information and verifiable details.`;
        
        try {
            const response = await callGeminiAPI(prompt);
            return response;
        } catch (error) {
            console.error('Error getting related results:', error);
            return "We couldn't retrieve additional details at this time. Please try again later.";
        }
    }
    
    // Function to estimate truth percentage using Gemini
    async function getTruthPercentage(claim) {
        const prompt = `Estimate the percentage likelihood that the following claim is true based on available evidence:
        Claim: "${claim}"
        
        Respond ONLY with a number between 0 and 100 representing the percentage likelihood of truth.
        Do not include any other text or explanation.`;
        
        try {
            const response = await callGeminiAPI(prompt);
            const percentage = parseInt(response.trim());
            return isNaN(percentage) ? 50 : Math.min(100, Math.max(0, percentage));
        } catch (error) {
            console.error('Error getting truth percentage:', error);
            return 50; // Default value if API fails
        }
    }
    
    // Function to get related articles using Gemini
    async function getRelatedArticles(claim) {
        const prompt = `Generate 3 related news article suggestions for the following claim:
        Claim: "${claim}"
        
        For each article, provide:
        - A plausible news source
        - A headline
        - A 2-sentence excerpt
        - A URL slug (fake but realistic)
        
        Format your response as JSON with an array of articles like this:
        [
            {
                "source": "The New York Times",
                "logo": "NYT",
                "headline": "",
                "excerpt": "",
                "url": "/article-slug"
            },
            ...
        ]`;
        
        try {
            const response = await callGeminiAPI(prompt);
            return JSON.parse(response);
        } catch (error) {
            console.error('Error getting related articles:', error);
            // Return default articles if API fails
            return [
                {
                    "source": "FactCheck.org",
                    "logo": "FC",
                    "headline": "Examining claims about " + claim.split(' ').slice(0, 3).join(' '),
                    "excerpt": "Our investigation looks at the evidence behind these claims. Multiple experts have weighed in on the validity.",
                    "url": "/fact-check"
                },
                {
                    "source": "Reuters",
                    "logo": "RT",
                    "headline": "What's true and false about " + claim.split(' ').slice(0, 3).join(' '),
                    "excerpt": "We verify the claims circulating online. The evidence presents a mixed picture that requires careful analysis.",
                    "url": "/news-verify"
                }
            ];
        }
    }
    
    // Generic function to call Gemini API
    async function callGeminiAPI(prompt) {
        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0].content.parts[0].text) {
                throw new Error('Invalid response format from API');
            }
            
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            throw error;
        }
    }
    
    // Update pie chart with actual data
    function updatePieChart(truePercentage, falsePercentage) {
        truePercentageElement.textContent = `${truePercentage}%`;
        trueSegment.style.transform = `rotate(${truePercentage/100}turn)`;
        falseSegment.style.transform = `rotate(${falsePercentage/100}turn) rotate(${truePercentage/100}turn)`;
        
        legendTexts[0].textContent = `${truePercentage}% Claims to be true`;
        if (legendTexts[1]) {
            legendTexts[1].textContent = `${falsePercentage}% Claims it to be false`;
        }
    }
    
    // Update related results section
    function updateRelatedResults(content) {
        relatedResultsContent.innerHTML = `<p>${content}</p>`;
    }
    
    // Display generated articles
    function displayArticles(articles) {
        articlesGrid.innerHTML = '';
        
        if (!articles || !Array.isArray(articles)) {
            articles = [];
        }
        
        articles.slice(0, 3).forEach(article => {
            const articleCard = document.createElement('div');
            articleCard.className = 'article-card';
            articleCard.innerHTML = `
                <div class="article-source">
                    <div class="source-logo">${article.logo || 'NEW'}</div>
                    <span class="source-name">${article.source || 'News Source'}</span>
                </div>
                <div class="article-content">
                    <h3 class="article-title">${article.headline || 'Article about this topic'}</h3>
                    <p class="article-excerpt">${article.excerpt || 'More information about this topic is being investigated.'}</p>
                    <a href="${article.url || '#'}" class="read-more">Read more <i class="fas fa-arrow-right"></i></a>
                </div>
            `;
            
            articlesGrid.appendChild(articleCard);
        });
    }
    
    // Login/Signup button functionality
    document.querySelectorAll('.btn-login, .btn-signup').forEach(btn => {
        btn.addEventListener('click', function() {
            alert(`${this.textContent.trim()} functionality would be implemented here`);
        });
    });
    
    // Newsletter subscription
    const subscribeBtn = document.querySelector('.btn-subscribe');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', function() {
            const emailInput = document.querySelector('.newsletter-form input');
            if (emailInput && emailInput.value.includes('@')) {
                alert('Thank you for subscribing to our newsletter!');
                emailInput.value = '';
            } else {
                alert('Please enter a valid email address');
            }
        });
    }
});