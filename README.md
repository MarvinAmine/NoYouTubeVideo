# NoYTVideo

A Chrome extension that blocks YouTube videos while keeping YouTube Music accessible. Redirect to productive activities while enjoying your music uninterrupted.

![Chrome Users](https://img.shields.io/chrome-web-store/users/dimcaadmhgjknieaofgaehgigbaldpfe)
![Firefox Users](https://img.shields.io/amo/users/noytvideo-keep-youtube-music)
![Chrome Version](https://img.shields.io/chrome-web-store/v/dimcaadmhgjknieaofgaehgigbaldpfe)
![Firefox Version](https://img.shields.io/amo/v/noytvideo-keep-youtube-music)

## Tutorial
Watch how to install and use the extension:
[![NoYTVideo Tutorial](https://img.youtube.com/vi/MxV9V29QOkc/0.jpg)](https://www.youtube.com/watch?v=MxV9V29QOkc)

## Features

- Blocks access to YouTube videos
- Keeps YouTube Music fully accessible
- Redirects to productive websites (Notion, Todoist, Focusmate, Forest)
- Simple and clean interface

## Installation

### Option 1: Install from Web Stores (Recommended)

#### Chrome Users
[![Chrome Web Store](https://storage.googleapis.com/web-dev-uploads/image/WlD8wC6g8khYWPJUsQceQkhXSlv1/iNEddTyWiMfLSwFD6qGq.png)](https://chromewebstore.google.com/detail/noytvideo-block-youtube-b/dimcaadmhgjknieaofgaehgigbaldpfe)

#### Firefox Users
[![Firefox Add-ons](https://blog.mozilla.org/addons/files/2020/04/get-the-addon-fx-apr-2020.svg)](https://addons.mozilla.org/en-US/firefox/addon/noytvideo-keep-youtube-music/)

### Option 2: Install from Source (Development)

#### Chrome
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your Chrome toolbar

#### Firefox
1. Download or clone this repository
2. Open Firefox and go to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on"
5. Navigate to the `firefox_extension` folder and select any file

## Usage

The extension works automatically once installed:
- Attempts to access YouTube videos will be redirected to productive websites
- YouTube Music remains fully accessible
- Click the extension icon to see options and stats

## Technical Details
- Chrome version uses Manifest V3
- Firefox version uses Manifest V2
- Built with vanilla JavaScript
- Uses browser storage API for settings and stats

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## Website

Visit [https://noyoutubevideo.com](https://noyoutubevideo.com) for more information.

## License

MIT License
