# Shadow Hunter — 5-Minute Video Walkthrough Script

> **Format:** Screen recording with voiceover (Loom recommended)  
> **Tone:** Consulting pitch — confident, technical, professional  
> **Total Time:** ~5 minutes  
> **Tip:** Keep the dashboard open and narrate while clicking through each tab live

---

## 🎬 INTRO — The Problem (0:00 – 0:40)

**[Screen: Show the Shadow Hunter landing dashboard in dark mode]**

> "Hi, I'm [Your Name], and this is **Shadow Hunter** — an autonomous, agent-driven Zero Trust monitoring platform built to solve one of the most dangerous blind spots in enterprise security today: **Shadow AI**.
>
> Here's the problem. Employees across every department are pasting proprietary source code, customer PII, financial forecasts, and trade secrets into public AI tools like ChatGPT, Claude, and Midjourney — completely bypassing corporate security policies. Traditional firewalls and DLP solutions can't detect this because these services use standard HTTPS on port 443. They look like normal web traffic.
>
> Shadow Hunter changes that. It passively monitors network traffic, reverse-maps encrypted TLS flows to known AI infrastructure, and provides real-time detection, compliance scoring, and automated containment — all from a single pane of glass."

---

## 📊 DASHBOARD OVERVIEW (0:40 – 1:30)

**[Screen: You're on the main Dashboard tab]**

> "This is our command center. At the top, you can see the live stat cards — **Total Nodes** discovered on the network, how many are **Internal** corporate devices, how many are **External** services, and critically, how many are flagged as **Shadow AI Threats**. The **Connections** counter shows real-time network edges being tracked."

**[Point to the 3D topology graph on the left]**

> "The centerpiece is this **interactive 3D network topology graph** powered by Cytoscape.js. Each node represents a discovered device or service. Internal nodes are blue, external services are green, and red nodes are confirmed Shadow AI endpoints. You can click, drag, and zoom into any node to inspect its connections."

**[Point to the Alerts panel on the right side]**

> "On the right, we have the **real-time alerts feed**. Every time the analyzer detects suspicious AI-bound traffic, an alert appears here instantly via WebSocket push — no page refresh needed. Alerts are color-coded by severity: Critical, High, Medium, and Low."

**[Point to the Top Offenders bar at the bottom]**

> "Down here is the **Top Offenders** strip. It ranks employees by their cumulative risk score, showing their name, department, alert count, and risk percentage. This gives SOC analysts an instant view of who is leaking the most data."

---

## 🌐 NETWORK DISCOVERY (1:30 – 2:10)

**[Click the Network icon in the sidebar]**

> "The Network tab has two sub-views. First is the **Node Inventory** — a complete table of every device and service discovered on the network, with filterable views for Internal, External, and Shadow AI nodes. You can export this entire inventory as a CSV report."

**[Click the "Traffic Analytics" sub-tab]**

> "The second sub-view is **Traffic Analytics**. This shows bandwidth patterns, protocol distribution, and traffic volume over time. It helps security teams identify unusual spikes — for example, a sudden surge of outbound HTTPS traffic to an AI provider at 2 AM."

---

## 🚨 ALERTS & ACTIVE DEFENSE (2:10 – 2:50)

**[Click the Alerts (Bell) icon in the sidebar]**

> "The full Alerts page gives you a comprehensive, searchable, filterable list of every security event. Each alert shows the source device, destination target, severity level, matched detection rule, and timestamp."

**[Scroll down to show JA3 Fingerprinting and Active Interrogation sections]**

> "What makes Shadow Hunter unique are these two capabilities:
>
> **JA3 TLS Fingerprinting** — We compute cryptographic hashes of TLS handshake parameters. This lets us detect when a browser is spoofing its identity — for example, a script disguised as Chrome connecting to an AI API.
>
> **Active Interrogation** — When a suspicious endpoint is detected, Shadow Hunter proactively sends HTTP probe requests to the target and inspects the response headers for known AI service signatures like CORS headers, API version strings, and model identifiers. This confirms whether the destination is genuinely an AI service, not just a false positive."

---

## ⚔️ KILL CHAIN & MITRE ATT&CK (2:50 – 3:20)

**[Click the Kill Chain (Shield) icon in the sidebar]**

> "The **Kill Chain Analysis** page maps every detected alert to the Lockheed Martin Cyber Kill Chain stages — from Reconnaissance through Actions on Objectives. Each stage shows how many alerts fall into it, giving you a visual picture of how far an attacker or data leak has progressed."

**[Click the MITRE ATT&CK icon in the sidebar]**

> "We also provide a full **MITRE ATT&CK Matrix** mapping. Every alert is automatically classified into the appropriate Tactic and Technique. This is industry-standard threat intelligence that enterprise SOC teams use daily, and Shadow Hunter generates it automatically."

---

## 📋 COMPLIANCE & DLP (3:20 – 3:50)

**[Click through to the Compliance Board — accessible from Settings/sidebar]**

> "The **Compliance Board** continuously scores your organization's AI usage against three major regulatory frameworks: **SOC 2**, **GDPR**, and **HIPAA**. Each framework shows its compliance percentage, passing and failing controls, and specific violations. This is critical for enterprises facing regulatory audits."

**[Navigate to DLP Monitor]**

> "The **Data Loss Prevention Monitor** tracks every instance where sensitive data — credit card numbers, API keys, personal identifiers, source code — was detected in outbound traffic to AI services. Each incident shows the data type, matched pattern, and destination."

---

## 🧠 AI COPILOT & REPORTING (3:50 – 4:30)

**[Navigate to Settings page, scroll to Executive Briefing section]**

> "Shadow Hunter includes an **Executive Briefing** generator that produces a natural-language summary of the current threat landscape — perfect for presenting to C-suite stakeholders who need the story, not the data."

**[Show the Hunter AI chat input in the header bar]**

> "We've also integrated a **Gemini AI-powered Copilot** right into the header. You can type natural language questions like 'Show me high risk nodes' or 'Which department has the most AI usage?' and the AI will navigate the dashboard, filter data, or provide direct answers."

**[Click "Download PDF" in the Settings → Report section]**

> "Finally, with one click, you can generate a **styled PDF report** containing the executive summary, severity distribution charts, top offenders, and remediation recommendations — ready to hand to your CISO or compliance team."

---

## ☁️ ARCHITECTURE & DEPLOYMENT (4:30 – 5:00)

**[Show the architecture diagram image, or briefly switch to the code/terminal]**

> "Under the hood, Shadow Hunter is built with a **Python/FastAPI backend** handling packet analysis, a plugin-based **Analyzer Engine** with four detection modules, and a **React 19** frontend with Vite and TailwindCSS. Data flows through an async event broker into a SQLite graph store.
>
> For deployment, we use a **multi-stage Docker build** that compiles both the frontend and backend into a single container, deployed on **Google Cloud Run** for serverless, auto-scaling production hosting.
>
> The system supports both **Demo Mode** with simulated corporate traffic for presentations, and **Live Mode** with real packet capture via Scapy and Npcap for actual network monitoring.
>
> Shadow Hunter is not just a prototype — it's a near-production-ready platform that gives enterprises the visibility and control they need to secure their AI attack surface. Thank you."

---

## ✅ RECORDING TIPS

| Tip | Details |
|-----|---------|
| **Screen resolution** | Use 1920×1080, full screen browser, no bookmarks bar |
| **Dark mode** | Start in dark mode — it looks more professional on video |
| **Live data** | Run `python run_local.py` before recording so alerts flow in real-time |
| **Mouse movement** | Move your cursor slowly and deliberately to each element you mention |
| **Toggle theme** | At some point, toggle to light mode briefly to showcase theme support |
| **Pause between sections** | Take a 1-second breath between sections for clean editing |
| **Browser tab** | Use only the Shadow Hunter tab — close all other tabs |
