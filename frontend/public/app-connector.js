class NeoGuardAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = "https://api.neoguard.ai/v1";
        this.endpoints = {
            analyze: "/analyze",
            analyzeUrl: "/analyze-url",
            batchAnalyze: "/batch-analyze",
            getHistory: "/history",
            getReport: "/report"
        };
    }

    async analyzeFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await this._sendRequest(this.endpoints.analyze, 'POST', formData);
            return this._processResponse(response);
        } catch (error) {
            this._handleError(error);
            throw error;
        }
    }

    async analyzeUrl(url) {
        try {
            const response = await this._sendRequest(
                this.endpoints.analyzeUrl, 
                'POST', 
                { url },
                true
            );
            return this._processResponse(response);
        } catch (error) {
            this._handleError(error);
            throw error;
        }
    }

    async batchAnalyze(files) {
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append(`file_${index}`, file);
        });
        
        try {
            const response = await this._sendRequest(this.endpoints.batchAnalyze, 'POST', formData);
            return this._processResponse(response);
        } catch (error) {
            this._handleError(error);
            throw error;
        }
    }

    async getHistory() {
        try {
            const response = await this._sendRequest(this.endpoints.getHistory, 'GET');
            return this._processResponse(response);
        } catch (error) {
            this._handleError(error);
            throw error;
        }
    }

    async getReport(analysisId) {
        try {
            const response = await this._sendRequest(
                `${this.endpoints.getReport}/${analysisId}`, 
                'GET'
            );
            return this._processResponse(response);
        } catch (error) {
            this._handleError(error);
            throw error;
        }
    }

    async _sendRequest(endpoint, method, data = null, isJson = false) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.apiKey}`
        };

        let body;
        if (data) {
            if (isJson) {
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify(data);
            } else {
                // For FormData, let the browser set Content-Type with boundary
                body = data;
            }
        }

        const options = {
            method,
            headers,
            body
        };

        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API request failed');
        }

        return response;
    }

    _processResponse(response) {
        return response.json();
    }

    _handleError(error) {
        console.error('API Error:', error);
        // Here you would add your error handling logic
        // For example, show a notification to the user
        showNotification(`API Error: ${error.message}`, 'error');
    }
}

// UI Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `cyber-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            ${type === 'error' ? '<i class="fas fa-exclamation-triangle"></i>' : ''}
            ${type === 'success' ? '<i class="fas fa-check-circle"></i>' : ''}
            ${type === 'info' ? '<i class="fas fa-info-circle"></i>' : ''}
        </div>
        <div class="notification-message">${message}</div>
        <div class="notification-close"><i class="fas fa-times"></i></div>
    `;

    document.body.appendChild(notification);

    // Animate in
    anime({
        targets: notification,
        opacity: [0, 1],
        translateX: ['100%', '0%'],
        duration: 500,
        easing: 'easeOutExpo',
        complete: () => {
            // Auto-remove after delay
            setTimeout(() => {
                anime({
                    targets: notification,
                    opacity: 0,
                    translateX: '100%',
                    duration: 500,
                    easing: 'easeInExpo',
                    complete: () => notification.remove()
                });
            }, 5000);
        }
    });

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        anime({
            targets: notification,
            opacity: 0,
            translateX: '100%',
            duration: 300,
            easing: 'easeInExpo',
            complete: () => notification.remove()
        });
    });
}

// Initialize API with your key
const api = new NeoGuardAPI("YOUR_API_KEY_HERE");

// Example usage:
// api.analyzeFile(file)
//   .then(results => displayResults(results))
//   .catch(error => console.error(error));