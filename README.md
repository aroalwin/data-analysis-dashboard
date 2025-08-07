📊 Modern Easy Data Analysis Dashboard
A lightweight, privacy-focused web application that allows you to upload data files (Excel, CSV, JSON), preview them, and generate customizable dashboards with charts. No server, no tracking—just fast insights in your browser.

Developed by AROCKIA ALWIN A (https://arockia-alwin.web.app/)

🔍 Features
•	• File Upload: Supports .csv, .xlsx, and .json (array of objects).
•	• Data Preview: First 50 rows shown with column selector.
•	• Auto Dashboard: Visualizes each selected column with one chart.
•	• Chart Types: Bar, Line, Pie, Doughnut. Histograms for numeric, frequencies for categorical.
•	• Fullscreen Mode: Expand charts, ESC to exit.
•	• Stats: Mean, Median, Min, Max for numerical columns.
•	• Theme Toggle: Light/Dark switch.
•	• Exports: Download raw data as Excel (.xlsx), dashboard as PNG, individual charts as PNG.
•	• Performance Optimized: Works with up to 10,000 rows and 50 columns.
🛡️ Data Privacy & Safety
Your data is 100% safe:
- Entirely client-side
- No data sent to any server, API, or cloud
- File parsing and charting handled by JavaScript in your browser
🎯 Who Needs This?
•	• Students, Researchers – Quick visualizations without coding.
•	• SMBs, Freelancers – Analyze sales, inventory, customer data fast.
•	• Developers – Prototype dashboards with real data.
•	• Privacy-Conscious Users – Works offline, keeps data local.
💡 Problem Solved
Traditional BI tools (Power BI, Tableau) require: installation, learning curve, server/cloud usage, subscriptions.

This dashboard fixes that with: no installation, no account, no server, instant use, zero cost.
⚙️ Installation & Usage
1. Download/Clone the Repo:
   git clone https://github.com/yourusername/data-analysis-dashboard.git
2. Open it:
   - Double-click index.html
   - Or use a local server:
     npm install -g http-server
     http-server .
3. Use:
   - Upload .csv, .xlsx, or .json
   - Select columns → Click 'Generate Dashboard'
   - Customize charts, toggle fullscreen
   - Export charts/data as needed
📁 Libraries & CDNs Used
Library	CDN Source
SheetJS (XLSX)	https://cdn.jsdelivr.net/npm/xlsx@latest/dist/xlsx.full.min.js
Chart.js	https://cdn.jsdelivr.net/npm/chart.js
html2canvas	https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js
Font Awesome	https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css
🙋 FAQ
•	Q: Does this app send my data to a server?
A: No. All processing is done in your browser.
•	Q: Can I use this offline?
A: Yes. Once loaded, it works offline if CDNs are cached.
•	Q: Why does it limit to 10,000 rows?
A: To maintain performance. Browser memory is limited.
•	Q: Can I customize colors or chart behavior?
A: Yes. Modify generateColors() in app.js.
•	Q: Is mobile supported?
A: Yes. Charts stack vertically on smaller screens.
