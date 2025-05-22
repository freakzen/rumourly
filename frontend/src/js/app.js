document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const selectFilesBtn = document.getElementById('selectFiles');
    const loadingOverlay = document.querySelector('.loading-overlay');
    const progressBar = document.querySelector('.progress');
    const resultsContainer = document.querySelector('.results-container');
    const originalMedia = document.getElementById('originalMedia');
    const analysisMedia = document.getElementById('analysisMedia');
    const confidenceBadge = document.getElementById('confidenceBadge');
    const analyzeUrlBtn = document.getElementById('analyzeUrl');
    const mediaUrl = document.getElementById('mediaUrl');
    
    // Event Listeners
    selectFilesBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFiles);
    
    // Drag and Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    analyzeUrlBtn.addEventListener('click', analyzeFromUrl);
    
    // Functions
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropZone.classList.add('drag-over');
    }
    
    function unhighlight() {
        dropZone.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files } });
    }
    
    function handleFiles(e) {
        const files = e.target.files;
        if (files.length > 0) {
            analyzeFile(files[0]);
        }
    }
    
    function analyzeFromUrl() {
        const url = mediaUrl.value.trim();
        if (!url) return;
        
        showLoading();
        
        fetch('/api/analyze-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url })
        })
        .then(response => response.json())
        .then(data => {
            showResults(data);
        })
        .catch(error => {
            console.error('Error:', error);
            hideLoading();
        });
    }
    
    function analyzeFile(file) {
        showLoading();
        
        const formData = new FormData();
        formData.append('file', file);
        
        // Show upload progress
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 90; // 90% for upload
                progressBar.style.width = `${percentComplete}%`;
            }
        });
        
        xhr.open('POST', '/api/analyze', true);
        xhr.onload = function() {
            if (xhr.status === 200) {
                progressBar.style.width = '100%';
                setTimeout(() => {
                    const response = JSON.parse(xhr.responseText);
                    showResults(response);
                }, 500);
            } else {
                hideLoading();
                alert('Upload failed: ' + xhr.statusText);
            }
        };
        xhr.send(formData);
    }
    
    function showLoading() {
        loadingOverlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        progressBar.style.width = '0%';
    }
    
    function hideLoading() {
        loadingOverlay.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    function showResults(data) {
        // Update UI with results
        const isFake = data.is_fake;
        const confidence = Math.round(data.confidence * 100);
        
        confidenceBadge.textContent = `${confidence}% ${isFake ? 'Fake' : 'Authentic'}`;
        confidenceBadge.style.backgroundColor = isFake ? '#ff4757' : '#2ed573';
        
        // Display media
        originalMedia.innerHTML = '';
        analysisMedia.innerHTML = '';
        
        if (data.media_type === 'video') {
            originalMedia.innerHTML = `
                <video controls>
                    <source src="${data.media_url || '/uploads/' + data.filename}" type="video/mp4">
                </video>
            `;
            
            analysisMedia.innerHTML = `
                <div style="position: relative; width: 100%; height: 100%;">
                    <video controls>
                        <source src="${data.media_url || '/uploads/' + data.filename}" type="video/mp4">
                    </video>
                    ${data.heatmap ? `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                        background: url('${data.heatmap}') center/cover; 
                        opacity: 0.5; pointer-events: none;"></div>` : ''}
                </div>
            `;
        } else {
            originalMedia.innerHTML = `
                <img src="${data.media_url || '/uploads/' + data.filename}" alt="Original">
            `;
            
            analysisMedia.innerHTML = `
                <div style="position: relative; width: 100%; height: 100%;">
                    <img src="${data.media_url || '/uploads/' + data.filename}" alt="Analysis">
                    ${data.heatmap ? `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; 
                        background: url('${data.heatmap}') center/cover; 
                        opacity: 0.5; pointer-events: none;"></div>` : ''}
                </div>
            `;
        }
        
        // Initialize video player if needed
        if (data.media_type === 'video') {
            setTimeout(() => {
                const players = Plyr.setup('video', {
                    controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen']
                });
            }, 100);
        }
        
        // Show results section
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }
});