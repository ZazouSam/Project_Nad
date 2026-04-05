# YouTube MP3

Download YouTube videos as MP3 files — desktop app for Windows and macOS.

---

## First-time open (no code signing)

This app is not signed with a paid certificate. You may see a security warning the very first time you open it.

### Windows

1. Double-click the installer (`.exe`).
2. If **Windows SmartScreen** shows a blue warning: click **"More info"**, then **"Run anyway"**.
3. The app installs and opens normally from that point on.

### macOS

1. Open the `.dmg` file and drag **YouTube MP3** to your Applications folder.
2. Try to open it. If you see **"YouTube MP3 cannot be opened because it is from an unidentified developer"**:
   - Go to **System Settings → Privacy & Security**.
   - Scroll down — you'll see a message about the blocked app.
   - Click **"Open Anyway"**.
3. You only need to do this once.

---

## How to use

1. **Paste a YouTube link** into the URL bar and press **Add** (or Enter).
2. The app fetches the song title automatically — you can click the title to rename it before downloading.
3. Add as many links as you want.
4. Click **Download All** — songs are saved as MP3 to your chosen folder (default: `Documents/YouTube MP3`).
5. Use **Change folder** at the top to save somewhere else.

---

## Developer setup

### Prerequisites
- Node.js 22+
- npm 10+

### Install
```bash
npm install
```

### Download yt-dlp + ffmpeg binaries
```bash
node scripts/download-bins.mjs
```
> macOS: follow the printed instructions to manually place `ffmpeg` in `resources/bin/`.

### Run in development
```bash
npm run dev
```

### Build for distribution
```bash
# Windows
npm run build:win

# macOS (run on a Mac)
npm run build:mac
```

### Release (GitHub Actions)
Push a tag starting with `v` to trigger the release workflow:
```bash
git tag v1.0.0
git push origin v1.0.0
```
Artifacts are published automatically to GitHub Releases.
You need a `GH_TOKEN` secret set in your GitHub repository settings (with `repo` write permissions).
