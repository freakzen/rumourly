import os
from pathlib import Path
from werkzeug.utils import secure_filename
from typing import Tuple, Dict
import mimetypes
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class FileProcessor:
    """Handles all file operations for deepfake detection"""
    
    def __init__(self, upload_folder: str = "uploads"):
        self.upload_folder = Path(__file__).resolve().parent.parent / upload_folder
        self._create_upload_folder()
        
    def _create_upload_folder(self) -> None:
        """Ensure upload directory exists"""
        try:
            self.upload_folder.mkdir(exist_ok=True)
            logger.info(f"Upload folder ready at {self.upload_folder}")
        except Exception as e:
            logger.error(f"Failed to create upload folder: {str(e)}")
            raise

    def validate_file(self, file) -> Tuple[bool, str]:
        """Validate file type and size"""
        allowed_types = {
            'image/jpeg', 'image/png', 'image/jpg',
            'video/mp4', 'video/quicktime', 'video/x-msvideo'
        }
        
        try:
            # Check file type
            mime_type, _ = mimetypes.guess_type(file.filename)
            if mime_type not in allowed_types:
                return False, "Unsupported file type"
            
            # Check file size (max 100MB)
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            if file_size > 100 * 1024 * 1024:  # 100MB
                return False, "File too large (max 100MB)"
            
            return True, ""
            
        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            return False, str(e)

    def process_file(self, file) -> Tuple[bool, str]:
        """Main method to validate and save files"""
        is_valid, message = self.validate_file(file)
        if not is_valid:
            return False, message
        return self.save_file(file)

    def save_file(self, file) -> Tuple[bool, str]:
        """Securely save uploaded file"""
        try:
            filename = secure_filename(file.filename)
            save_path = self.upload_folder / filename
            
            # Handle duplicate filenames
            counter = 1
            while save_path.exists():
                stem = save_path.stem
                suffix = save_path.suffix
                save_path = save_path.with_name(f"{stem}_{counter}{suffix}")
                counter += 1
            
            file.save(str(save_path))
            logger.info(f"File saved to {save_path}")
            return True, str(save_path)
            
        except Exception as e:
            logger.error(f"Failed to save file: {str(e)}")
            return False, str(e)

    def cleanup_file(self, filepath: str) -> bool:
        """Delete processed files"""
        try:
            path = Path(filepath)
            if path.exists():
                path.unlink()
                logger.info(f"Deleted file: {filepath}")
                return True
            return False
        except Exception as e:
            logger.error(f"Cleanup failed for {filepath}: {str(e)}")
            return False

    def get_file_metadata(self, filepath: str) -> Dict:
        """Extract basic file metadata"""
        path = Path(filepath)
        return {
            'filename': path.name,
            'extension': path.suffix.lower(),
            'size': path.stat().st_size,
            'created': path.stat().st_ctime,
            'modified': path.stat().st_mtime
        }