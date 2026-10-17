# UI for placing bets

- Open `index.html` in a browser, or add the GitHub Pages URL to your iPhone home screen for the full-screen app.
- On first launch the configurator lets you set the balance and build bet slips (not started / live / settled, odds, stake, teams). Tap the avatar to reopen it later.
- Each selection can be Football (country flags) or Boxing (red and blue trunks, fighter names, fight time).
- Settled bets (won, lost, cashed out) stay in the Settled tab permanently; only "Reset everything" in the configurator clears them.
- Share on a slip renders the slip as a PNG (date, bet365 wordmark, slip cropped at the button row like the real app) and opens the system share sheet, so Save to Files / Save Image works on iPhone. Browsers without file sharing get an in-app sheet with a Save to Files button. The image is rendered with html2canvas loaded from cdnjs, so sharing needs the page served over http(s), not opened as a local file.
- No build step: plain HTML, CSS and JavaScript.
