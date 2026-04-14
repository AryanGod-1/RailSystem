# National Rail System (NRS) - Fake IRCTC Clone

A fully functional frontend mini-project that elegantly emulates the IRCTC Online Railway Reservation system. Built purely using vanilla HTML, CSS, and JavaScript.

## 🚀 Features

- **Single Page Application (SPA):** Instant, seamless transitions between sections (Dashboard, Booking, Payment, Ticket) without any page reloads.
- **Premium Aesthetics:** Modern, responsive design featuring custom CSS variables, clean typography, dynamic hover effects, and subtle background gradients.
- **Mock Account System:** Dummy `localStorage` based login that persists sessions across page reloads.
- **Dual Data Modes:** 
  - **Live Mode:** Connects to [IndianRailAPI](https://indianrailapi.com/api-collection) (requires API key).
  - **Fallback Mock Mode:** Instantly defaults to robust, realistic dummy data if API queries fail or if no key is provided. Perfect for offline displays!
- **Dynamic Seat Booking:** Configurable multiple passenger lists that automatically calculate waitlists, exact fare rules, and preferred berths.
- **Simulated Payment Gateway:** A stylized, realistic mock UI mirroring Razorpay to process dummy UPI, Credit, and Netbanking actions.
- **E-Ticket Generation:** Automatically prints a finalized Electronic Reservation Slip (ERS) containing QR codes, PNR figures, and passenger configurations. Fully compatible with native Browser PDF export & printing (`Ctrl+P`).

## 🛠️ Tech Stack

- **HTML5:** Semantic architecture.
- **CSS3:** Custom styles, Flexbox grids, and native CSS variables.
- **Vanilla JavaScript:** Event-driven architecture handling complex layout manipulation, DOM updates, pseudo-routing, and API fetches.

## 💻 Running Locally

Because this project is exceptionally lightweight and solely frontend based, no deep server configurations are required.

### Method 1 (Simple Double-click)
1. Navigate into the directory.
2. Double click the `index.html` file to open it in any web browser.
*(Note: Some browsers might block local AJAX requests via `file:///` protocols out of strict CORS policies. If so, use Method 2).*

### Method 2 (Local Server)
1. Open a terminal in the project directory.
2. If Python is installed, run:
   ```bash
   python -m http.server 8000
   ```
3. Open a browser and visit `http://localhost:8000`.

## ⚙️ Setting up Live APIs
To pull true, live data regarding trains:
1. Obtain an API Key by registering through the respective [IndianRailAPI Collection](https://indianrailapi.com/api-collection).
2. Start the NRS Web App.
3. On the main Dashboard, look for the orange **"API Key Missing"** banner.
4. Click "Set API Key" and paste your token. The application will immediately switch to live-mode tracing.

---
Made with ❤️ by [Aryan](https://www.linkedin.com/in/aryan-goud/)
