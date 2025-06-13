from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
import cv2
import math
import uuid
from cryptography.hazmat.primitives.asymmetric import rsa, padding as rsa_padding
from cryptography.hazmat.primitives import serialization, hashes
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Configure upload settings
UPLOAD_FOLDER = './uploads'
TEMP_FOLDER = './tmp'
KEYS_FOLDER = './keys'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMP_FOLDER, exist_ok=True)
os.makedirs(KEYS_FOLDER, exist_ok=True)

# RSA encryption functions (same as before)
def generate_keys(key_size=2048):
    """Generate RSA key pair if they don't exist"""
    private_keys_path = os.path.join(KEYS_FOLDER, f'private_key_{key_size}.pem')
    public_keys_path = os.path.join(KEYS_FOLDER, f'public_key_{key_size}.pem')
    
    if os.path.isfile(private_keys_path) and os.path.isfile(public_keys_path):
        print("Public and private keys already exist")
        return
    
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=key_size)
    public_key = private_key.public_key()
    
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    with open(private_keys_path, "wb") as file_obj:
        file_obj.write(private_pem)
    
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    with open(public_keys_path, "wb") as file_obj:
        file_obj.write(public_pem)
    
    print(f"Public and Private keys created with size {key_size}")

def encrypt_rsa(message):
    """Encrypt message using RSA"""
    key_size = 2048
    generate_keys(key_size)
    
    public_key_path = os.path.join(KEYS_FOLDER, f'public_key_{key_size}.pem')
    with open(public_key_path, 'rb') as key_file:
        public_key = serialization.load_pem_public_key(key_file.read())
    
    message_bytes = message.encode('utf-8') if isinstance(message, str) else message
    ciphertext = public_key.encrypt(
        message_bytes,
        rsa_padding.OAEP(
            mgf=rsa_padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    
    return base64.b64encode(ciphertext)

def decrypt_rsa(encoded_message):
    """Decrypt message using RSA"""
    key_size = 2048
    generate_keys(key_size)
    
    private_key_path = os.path.join(KEYS_FOLDER, f'private_key_{key_size}.pem')
    
    with open(private_key_path, 'rb') as key_file:
        private_key = serialization.load_pem_private_key(key_file.read(), password=None)
    
    if isinstance(encoded_message, str):
        encoded_message = encoded_message.encode('utf-8')
    
    cipher_text = base64.b64decode(encoded_message)
    plain_text = private_key.decrypt(
        cipher_text,
        rsa_padding.OAEP(
            mgf=rsa_padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    
    return plain_text

# Video processing functions
def split_string(s_str, count=10):
    """Split string into parts"""
    per_c = math.ceil(len(s_str)/count)
    c_cout = 0
    out_str = ''
    split_list = []
    for s in s_str:
        out_str += s
        c_cout += 1
        if c_cout == per_c:
            split_list.append(out_str)
            out_str = ''
            c_cout = 0
    if c_cout != 0:
        split_list.append(out_str)
    return split_list

def extract_frames(video_path, temp_dir):
    """Extract frames from video"""
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    print(f"[INFO] Extracting frames from video {video_path}")
    vidcap = cv2.VideoCapture(video_path)
    count = 0
    frames = []
    
    while True:
        success, image = vidcap.read()
        if not success:
            break
        frame_path = os.path.join(temp_dir, f"{count}.png")
        cv2.imwrite(frame_path, image)
        frames.append(frame_path)
        count += 1
    
    print(f"[INFO] Extracted {count} frames from video")
    return frames, count

def create_output_video(frames, original_video, output_path):
    """Create output video from frames"""
    video = cv2.VideoCapture(original_video)
    fps = video.get(cv2.CAP_PROP_FPS)
    width = int(video.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(video.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    if not output_path.endswith('.mov'):
        output_path = output_path.rsplit('.', 1)[0] + '.mov'
    
    fourcc = cv2.VideoWriter_fourcc(*'png ')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    for frame_path in frames:
        frame = cv2.imread(frame_path)
        if frame is not None:
            out.write(frame)
    
    out.release()
    print(f"[INFO] Created output video: {output_path}")
    return output_path

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "Server is running"})

@app.route('/test-video', methods=['POST'])
def test_video_processing():
    """Test endpoint for video processing"""
    if 'video' not in request.files:
        return jsonify({"error": "Missing video file"}), 400
    
    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({"error": "No video selected"}), 400
    
    session_id = str(uuid.uuid4())
    temp_dir = os.path.join(TEMP_FOLDER, session_id)
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        video_path = os.path.join(temp_dir, secure_filename(video_file.filename))
        video_file.save(video_path)
        
        frames, frame_count = extract_frames(video_path, temp_dir)
        
        return jsonify({
            "message": "Video processed successfully",
            "frame_count": frame_count,
            "session_id": session_id
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    generate_keys()
    app.run(debug=True, host='0.0.0.0', port=5000)