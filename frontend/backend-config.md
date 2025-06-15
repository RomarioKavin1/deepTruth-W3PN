# Backend Configuration

To connect the frontend to the steganography backend, you need to set the `NEXT_PUBLIC_BACKEND` environment variable.

## Setup

1. Create a `.env.local` file in the frontend directory
2. Add the following line:

```
NEXT_PUBLIC_BACKEND=http://localhost:5000
```

## Backend Endpoints

The backend provides the following endpoints:

- `GET /health` - Health check endpoint
- `POST /encrypt` - Encrypt video with text
- `POST /decrypt` - Decrypt hidden text from video

## Starting the Backend

1. Navigate to the `steganography` directory
2. Install dependencies: `pip install -r requirements.txt`
3. Run the server: `python server.py`

The backend will start on `http://localhost:5000` by default.

## Features

- **Liveness Check**: The frontend automatically checks if the backend is online
- **Video Recording**: Records video in the camera page
- **Steganographic Encryption**: Embeds IPFS CID into video using steganography
- **Video Preview**: Shows encrypted video with embedded data
- **Download**: Allows downloading the encrypted video file
