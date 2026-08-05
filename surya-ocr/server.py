"""
Surya OCR Server - Flask API for Indonesian receipt OCR
Provides better multilingual OCR than Tesseract, especially for thermal receipts
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from surya import OCRModel
from PIL import Image
import io
import base64
import os
import sys
import logging
from typing import Dict, List, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global model instance
ocr_model = None


def init_model():
    """Initialize Surya OCR model on startup"""
    global ocr_model
    try:
        logger.info("Loading Surya OCR model...")
        ocr_model = OCRModel()
        logger.info("✓ Surya OCR model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load Surya model: {e}")
        sys.exit(1)


def decode_base64_image(base64_str: str) -> Image.Image:
    """
    Decode base64 string to PIL Image
    
    Args:
        base64_str: Base64 encoded image (with or without data URI prefix)
        
    Returns:
        PIL Image object
        
    Raises:
        ValueError: If base64 string is invalid
    """
    try:
        # Remove data URI prefix if present
        if ',' in base64_str:
            base64_str = base64_str.split(',', 1)[1]
        
        # Decode base64
        image_data = base64.b64decode(base64_str)
        
        # Load as PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if needed (Surya expects RGB)
        if image.mode != 'RGB':
            image = image.convert('RGB')
            
        return image
        
    except Exception as e:
        raise ValueError(f"Failed to decode image: {str(e)}")


def format_ocr_result(result: Any) -> Dict[str, Any]:
    """
    Format Surya OCR result into a clean structure
    
    Args:
        result: Raw Surya OCR result
        
    Returns:
        Formatted dict with text and metadata
    """
    try:
        # Extract text from Surya result
        # Surya returns list of text lines with bounding boxes
        lines = []
        full_text = []
        
        if hasattr(result, 'text_lines'):
            for line in result.text_lines:
                text = line.text.strip()
                if text:
                    lines.append({
                        'text': text,
                        'confidence': getattr(line, 'confidence', 1.0),
                        'bbox': getattr(line, 'bbox', None)
                    })
                    full_text.append(text)
        
        # Combine all lines into single text
        combined_text = '\n'.join(full_text)
        
        return {
            'text': combined_text,
            'lines': lines,
            'line_count': len(lines),
            'engine': 'surya'
        }
        
    except Exception as e:
        logger.error(f"Error formatting OCR result: {e}")
        return {
            'text': str(result) if result else '',
            'lines': [],
            'line_count': 0,
            'engine': 'surya'
        }


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'surya-ocr',
        'model_loaded': ocr_model is not None
    })


@app.route('/ocr', methods=['POST'])
def ocr_endpoint():
    """
    OCR endpoint - accepts base64 image and returns extracted text
    
    Request body:
        {
            "image": "base64_encoded_image_string"
        }
        
    Response:
        {
            "text": "extracted text",
            "lines": [...],
            "line_count": 10,
            "engine": "surya"
        }
    """
    try:
        # Validate request
        if not request.is_json:
            return jsonify({
                'error': 'Request must be JSON',
                'success': False
            }), 400
        
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'error': 'Missing required field: image',
                'success': False
            }), 400
        
        base64_image = data['image']
        
        if not base64_image or not isinstance(base64_image, str):
            return jsonify({
                'error': 'Invalid image data - must be base64 string',
                'success': False
            }), 400
        
        # Decode image
        try:
            image = decode_base64_image(base64_image)
            logger.info(f"Image decoded: {image.size} {image.mode}")
        except ValueError as e:
            return jsonify({
                'error': str(e),
                'success': False
            }), 400
        
        # Check model is loaded
        if ocr_model is None:
            return jsonify({
                'error': 'OCR model not loaded',
                'success': False
            }), 503
        
        # Run Surya OCR
        logger.info("Running Surya OCR...")
        try:
            result = ocr_model.predict([image])[0]  # Surya expects list of images
        except Exception as e:
            logger.error(f"Surya OCR failed: {e}")
            return jsonify({
                'error': f'OCR processing failed: {str(e)}',
                'success': False
            }), 500
        
        # Format result
        formatted = format_ocr_result(result)
        
        if not formatted['text'].strip():
            return jsonify({
                'error': 'No text detected in image',
                'success': False,
                'text': '',
                'engine': 'surya'
            }), 200
        
        logger.info(f"OCR complete: {formatted['line_count']} lines, {len(formatted['text'])} chars")
        
        return jsonify({
            'success': True,
            **formatted
        })
        
    except Exception as e:
        logger.error(f"Unexpected error in OCR endpoint: {e}", exc_info=True)
        return jsonify({
            'error': f'Internal server error: {str(e)}',
            'success': False
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint not found',
        'success': False
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        'error': 'Internal server error',
        'success': False
    }), 500


if __name__ == '__main__':
    # Initialize model before starting server
    init_model()
    
    # Get port from environment or default to 5000
    port = int(os.getenv('SURYA_PORT', 5000))
    
    logger.info(f"Starting Surya OCR server on port {port}...")
    
    # Run server
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False,
        threaded=True
    )
