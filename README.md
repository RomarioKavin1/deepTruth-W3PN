# **DeeperTruth**

* **Track(s):**

  * Applied Encryption
  * Design (UI/UX)

* **Team/Contributors:**

  * Romario Kavin – Full-Stack + Crypto Blochain Engineer

* **Repository:**
  [https://github.com/RomarioKavin1/deepTruth-W3PN](#)

* **Demo:**
  [https://deep-truth-w3-pn.vercel.app/](#)

---

## 🧠 Description (TL;DR)

**DeeperTruth** is a privacy-first video authenticity platform that embeds **cryptographic proof directly inside video files using steganography**. It combats deepfakes by offering three escalating tiers of identity verification:

* **Anonymity** (World ID),
* **Pseudo-Anonymity** (Wallet Signature),
* **Full Identity** (Decentralized ID via Self Protocol).

It’s especially useful for whistleblowers, citizen journalists, and **government officials** — anyone needing to prove **"I am a real human" or "I truly said this"** without relying on centralized platforms or trust.

---

## ❗ Problem

Deepfakes are undermining trust in audio-visual content. In an era of AI-generated misinformation, there’s no easy way to verify that a video came from a **real person** — let alone prove it came from a **specific, trusted source** like a government official or agency — **without relying on centralized authority or watermarking**.

---

## ✅ Solution

DeeperTruth offers a **zero-trust**, decentralized way to **cryptographically bind the video to the identity of its creator**, based on their privacy preference:

1. **Anonymity** – Just proves the speaker is human (via World ID nullifier).
2. **Pseudo-Anonymity** – Links the proof to a wallet address.
3. **Full Identity** – Connects the video to a **Self Protocol DID**, verifying that a real, verifiable identity made the statement.

This is especially powerful in:

* **Government contexts**, where officials can publish provably signed video announcements (e.g., public safety, legislation, emergency alerts), cryptographically proving their origin.
* **Decentralized journalism**, where sources may wish to remain anonymous or pseudonymous but still provide irrefutable proof of authenticity.

The proof is **embedded into the video** itself using **steganography**, making the video a **portable, self-verifiable artifact**.

---

## ⚙️ Technology Stack

* **Frontend**: Next.js, TailwindCSS, TypeScript
* **Crypto & Identity**:

  * World ID (Proof of Humanity)
  * Self Protocol (Passport-based Decentralized ID)
  * EIP-712 Signatures
* **Steganography**: WASM module (DCT or LSB embedding)
* **Storage**: IPFS (via web3.storage)
* **Verification Layer**: CID + signature + stego decoder pipeline

---

## 🔐 Privacy Impact

* Enables proof-of-humanity or proof-of-identity **without revealing unnecessary personal info**.
* Zero central authority required to “approve” or “verify” videos.
* Proof embedded inside the video — not as external metadata.
* Empowers both **anonymous truth-tellers** and **verifiable public officials**.

---

## 🌍 Real-World Use Cases

* **Government/Public Officials**:

  * Public figures can use Self Protocol to link official DIDs to videos.
  * Example: A minister posts a climate policy video announcement; with DeeperTruth, it’s provable that it came from their verified digital passport, not an AI-generated deepfake.

* **Whistleblowers & Activists**:

  * Record video evidence anonymously, but prove it's real & human-made via World ID.
  * Example: A protestor in a conflict zone records war crimes but wants to stay safe.

* **Citizen Journalists**:

  * Authenticate field footage with pseudonymous or verified credentials.

* **Social Media Platforms**:

  * DeeperTruth videos shared across platforms carry embedded, verifiable trust — regardless of platform censorship or central validation.

---

## 💸 Business Logic

* **Free Tier**: Anonymous (World ID-based) video proofs.
* **Premium Tier**: Wallet + DID integrations for power users, journalists, and government use.
* **B2B**:

  * Offer DID-backed verification tools to media outlets, government platforms, or DAOs.
  * Developer API for platforms to integrate their own steganographic proof layer.

---

## 🔮 What's Next

* Mobile browser & cross-platform support (iOS/Android)
* DID expansion to other protocols (Polygon ID, Disco, Veramo)
* API/SDK for media platforms to auto-verify video content
* Integration with Arweave/Filecoin for immutable archival
* Watermark-free tamper detection based on embedded hashes
* Real-time recording + proof streaming support

---
