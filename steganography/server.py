from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
import cv2
import math
import uuid
import shutil
from stegano import lsb
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

# RSA functions (same as before - keeping them but not showing for brevity)
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

def encode_frames(frames, encrypted_text, temp_dir):
    """Encode encrypted text into frames using steganography"""
    if isinstance(encrypted_text, bytes):
        encrypted_text = encrypted_text.decode('utf-8')
        
    split_text_list = split_string(encrypted_text)
    num_parts = len(split_text_list)
    
    frame_numbers = list(range(min(num_parts, len(frames))))
    
    print(f"Encoding text into {len(frame_numbers)} frames")
    
    for i, frame_num in enumerate(frame_numbers):
        if i >= len(split_text_list):
            break
            
        frame_path = frames[frame_num]
        secret_enc = lsb.hide(frame_path, split_text_list[i])
        secret_enc.save(frame_path)
        print(f"[INFO] Frame {frame_num} holds {split_text_list[i]}")
    
    # Save metadata
    metadata_frame_path = os.path.join(temp_dir, "metadata.png")
    metadata_img = cv2.imread(frames[0])
    cv2.imwrite(metadata_frame_path, metadata_img)
    
    metadata_content = ",".join(map(str, frame_numbers))
    metadata_secret = lsb.hide(metadata_frame_path, metadata_content)
    metadata_secret.save(metadata_frame_path)
    print(f"[INFO] Metadata frame holds frame numbers: {metadata_content}")
    
    frames.append(metadata_frame_path)
        
    return frame_numbers

def decode_video(video_path, temp_dir):
    """Decode hidden text from video"""
    if not os.path.exists(temp_dir):
        os.makedirs(temp_dir)
    
    cap = cv2.VideoCapture(video_path)
    number_of_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    print(f"[INFO] Video has {number_of_frames} frames")
    
    # Look for metadata in last frames
    metadata_frame_numbers = []
    
    print("[INFO] Looking for metadata frame...")
    for frame_index in range(max(0, number_of_frames - 5), number_of_frames):
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
        ret, frame = cap.read()
        if not ret:
            continue
            
        metadata_frame_path = os.path.join(temp_dir, f"metadata_check_{frame_index}.png")
        cv2.imwrite(metadata_frame_path, frame)
        
        try:
            metadata_content = lsb.reveal(metadata_frame_path)
            if metadata_content and ',' in metadata_content:
                print(f"[INFO] Found metadata at frame {frame_index}: {metadata_content}")
                try:
                    frame_nums = [int(num) for num in metadata_content.split(',')]
                    metadata_frame_numbers = frame_nums
                    print(f"[INFO] Using frame numbers: {frame_nums}")
                    break
                except:
                    print(f"[INFO] Failed to parse metadata: {metadata_content}")
        except Exception as e:
            pass
    
    cap.release()
    cap = cv2.VideoCapture(video_path)
    
    frames_to_check = metadata_frame_numbers if metadata_frame_numbers else list(range(15))
    print(f"[INFO] Will check frames: {frames_to_check}")
    
    decoded = {}
    
    for frame_number in frames_to_check:
        if frame_number >= number_of_frames:
            continue
            
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        ret, frame = cap.read()
        if not ret:
            continue
        
        encoded_frame_file_name = os.path.join(temp_dir, f"{frame_number}-enc.png")
        cv2.imwrite(encoded_frame_file_name, frame)
        
        try:
            clear_message = lsb.reveal(encoded_frame_file_name)
            if clear_message:
                decoded[frame_number] = clear_message
                print(f"Frame {frame_number} DECODED: {clear_message}")
        except Exception as e:
            print(f"Error decoding frame {frame_number}: {e}")
    
    res = ""
    for fn in sorted(decoded.keys()):
        res += decoded[fn]
    
    if not res:
        return None
    
    try:
        decrypted_message = decrypt_rsa(res)
        return decrypted_message.decode('utf-8')
    except Exception as e:
        print(f"Error decrypting message: {e}")
        return res

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

@app.route('/encrypt', methods=['POST'])
def encrypt_endpoint():
    """Endpoint to encrypt text and hide it in video"""
    if 'video' not in request.files or 'text' not in request.form:
        return jsonify({"error": "Missing video file or text"}), 400
    
    video_file = request.files['video']
    text = request.form['text']
    
    if video_file.filename == '':
        return jsonify({"error": "No video selected"}), 400
    
    session_id = str(uuid.uuid4())
    temp_dir = os.path.join(TEMP_FOLDER, session_id)
    os.makedirs(temp_dir, exist_ok=True)
    
    try:
        video_path = os.path.join(temp_dir, secure_filename(video_file.filename))
        video_file.save(video_path)
        
        frames, _ = extract_frames(video_path, temp_dir)
        encrypted_text = encrypt_rsa(text)
        frame_numbers = encode_frames(frames, encrypted_text, temp_dir)
        
        original_filename = secure_filename(video_file.filename)
        output_filename = f"encoded_{original_filename.rsplit('.', 1)[0]}.mov"
        output_path = os.path.join(temp_dir, output_filename)
        create_output_video(frames, video_path, output_path)
        
        with open(output_path, 'rb') as mov_file:
            mov_data = mov_file.read()
        
        response = {
            "mov": base64.b64encode(mov_data).decode('utf-8'),
            "mov_filename": output_filename
        }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
    finally:
        try:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)
        except Exception as cleanup_error:
            print(f"Error cleaning up: {cleanup_error}")

@app.route('/decrypt', methods=['POST'])
def decrypt_endpoint():
    """Endpoint to decrypt hidden text from video"""
    if 'video' not in request.files or 'text' not in request.form:
        return jsonify({"error": "Missing video file or text"}), 400
    
    video_file = request.files['video']
    text = request.form['text']
    
    if video_file.filename == '':
        return jsonify({"error": "No video selected"}), 400
        