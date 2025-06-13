from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
from cryptography.hazmat.primitives.asymmetric import rsa, padding as rsa_padding
from cryptography.hazmat.primitives import serialization, hashes

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

# RSA encryption and decryption functions
def generate_keys(key_size=2048):
    """Generate RSA key pair if they don't exist"""
    private_keys_path = os.path.join(KEYS_FOLDER, f'private_key_{key_size}.pem')
    public_keys_path = os.path.join(KEYS_FOLDER, f'public_key_{key_size}.pem')
    
    if os.path.isfile(private_keys_path) and os.path.isfile(public_keys_path):
        print("Public and private keys already exist")
        return
    
    # Generate a private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size,
    )
    
    # Get the public key
    public_key = private_key.public_key()
    
    # Serialize and save the private key
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    with open(private_keys_path, "wb") as file_obj:
        file_obj.write(private_pem)
    
    # Serialize and save the public key
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
    
    # Read public key
    public_key_path = os.path.join(KEYS_FOLDER, f'public_key_{key_size}.pem')
    with open(public_key_path, 'rb') as key_file:
        public_key = serialization.load_pem_public_key(key_file.read())
    
    # Encrypt the message
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
        private_key = serialization.load_pem_private_key(
            key_file.read(),
            password=None
        )
    
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

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "Server is running"})

@app.route('/test-encryption', methods=['POST'])
def test_encryption():
    """Test endpoint for RSA encryption/decryption"""
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "Missing text"}), 400
    
    text = data['text']
    encrypted = encrypt_rsa(text)
    decrypted = decrypt_rsa(encrypted)
    
    return jsonify({
        "original": text,
        "encrypted": encrypted.decode('utf-8'),
        "decrypted": decrypted.decode('utf-8')
    })

if __name__ == '__main__':
    generate_keys()
    app.run(debug=True, host='0.0.0.0', port=5000)