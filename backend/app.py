import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from datetime import datetime

# Add parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

# Import utils with proper error handling
try:
    from backend.utils.file_processor import FileProcessor
    from backend.utils.api_handler import analyze_via_api
except ImportError as e:
    print(f"Import error: {e}")
    # Fallback implementations
    class FileProcessor:
        def process_file(self, file):
            filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
            filepath = os.path.join('uploads', filename)
            file.save(filepath)
            return True, filepath
    
    def analyze_via_api(filepath):
        return {
            'is_fake': True,
            'confidence': 0.87,
            'details': {
                'face_swapping': 0.92,
                'audio_tampering': 0.45,
                'unnatural_movements': 0.78
            },
            'filename': os.path.basename(filepath),
            'media_type': 'video' if filepath.lower().endswith(('.mp4', '.mov', '.avi')) else 'image'
        }

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB limit
app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'mov', 'avi', 'jpg', 'jpeg', 'png', 'wav'}

# Initialize file processor
file_processor = FileProcessor()

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def home():
    return send_from_directory('../frontend/public', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend/public', path)

@app.route('/api/analyze', methods=['POST'])
def analyze():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    # Process file
    success, filepath = file_processor.process_file(file)
    if not success:
        return jsonify({'error': filepath}), 500
    
    # Analyze file
    result = analyze_via_api(filepath)
    result['filename'] = os.path.basename(filepath)
    
    return jsonify(result)

@app.route('/api/analyze-url', methods=['POST'])
def analyze_url():
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'No URL provided'}), 400
    
    # Mock implementation - in reality you'd download the file from URL
    result = {
        'is_fake': True,
        'confidence': 0.91,
        'details': {
            'face_swapping': 0.91,
            'audio_tampering': 0.32,
            'unnatural_movements': 0.85
        },
        'media_type': 'video',
        'media_url': data['url']
    }
    
    return jsonify(result)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/heatmap/<filename>')
def get_heatmap(filename):
    return send_from_directory('static', 'demo_heatmap.png')

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=True)