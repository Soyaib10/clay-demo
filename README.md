# 🎯 sendcopy.ai Clay Demo App

Go-based demo app to receive leads from Clay via HTTP API and export as CSV.

## 📁 Project Structure

```
clay-demo/
├── main.go              # Go HTTP server
├── go.mod               # Go module file
├── static/
│   ├── index.html       # Dashboard UI
│   ├── style.css        # Styling
│   └── app.js           # Frontend logic
└── README.md            # This file
```

## 🚀 Quick Start

### 1. Prerequisites
- Go 1.21+ installed
- (Optional) ngrok for exposing localhost to internet

### 2. Setup

```bash
# Create project directory
mkdir clay-demo && cd clay-demo

# Initialize Go module
go mod init clay-demo

# Install UUID package
go get github.com/google/uuid

# Create static directory
mkdir -p static

# Copy the provided files (main.go, static/*) into the project
```

### 3. Run the Server

```bash
go run main.go
```

Server starts on `http://localhost:8080`

### 4. Open Dashboard

Visit: http://localhost:8080

## 🔗 Connect with Clay

### Option A: Local Testing (with ngrok)

```bash
# In a new terminal, expose your local server
npx ngrok http 8080

# Copy the https:// URL (e.g., https://abc123.ngrok.io)
# Use https://abc123.ngrok.io/api/leads as your Clay endpoint
```

### Option B: Deploy (for production demo)

Deploy to Render, Railway, or any cloud platform and use that URL.

## ⚙️ Clay Configuration

1. In Clay: **Add Enrichment** → Search **HTTP API** → Select

2. **Configure Headers:**
   ```
   Authorization: Bearer demo-key-123
   Content-Type: application/json
   ```

3. **Configure Request:**
   ```
   Method: POST
   Endpoint: https://your-ngrok-url.ngrok.io/api/leads
   ```

4. **Configure Body (JSON):**
   ```json
   {
       "list_name": "my-first-list",
       "first_name": "/ → Enrich person → first_name",
       "last_name": "/ → Enrich person → last_name",
       "company": "/ → Enrich person → org",
       "job_title": "/ → Job Title",
       "location": "/ → Location",
       "linkedin_url": "/ → LinkedIn Profile",
       "connections": "/ → Connections",
       "headline": "/ → Headline"
   }
   ```

5. **Save & Run**

## 🧪 Test Without Clay

Click **"Send Test Lead"** button in the dashboard, or use curl:

```bash
curl -X POST http://localhost:8080/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "list_name": "test-list",
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Inc",
    "job_title": "CEO",
    "location": "New York",
    "linkedin_url": "https://linkedin.com/in/johndoe",
    "connections": 500,
    "headline": "Building the future"
  }'
```

## 📊 Features

- ✅ Real-time lead reception from Clay
- ✅ Auto-refreshing dashboard (every 3 seconds)
- ✅ CSV export with one click
- ✅ Test lead simulator
- ✅ Responsive design
- ✅ Clean, modern UI
- ✅ In-memory storage (resets on restart)

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/leads` | POST | Receive lead from Clay |
| `/api/leads` | GET | List all leads |
| `/api/leads` | DELETE | Clear all leads |
| `/api/leads/csv` | GET | Download CSV |

## 📄 CSV Format

```
ID,List Name,First Name,Last Name,Company,Job Title,Location,LinkedIn URL,Connections,Headline,Email,Phone,Received At
```

## 🛠️ Tech Stack

- **Backend:** Go (net/http)
- **Frontend:** Pure HTML5, CSS3, Vanilla JS
- **No database** — in-memory storage for demo

## 📝 Notes

- Clay sends **one row per request** (not batch)
- Response must be **HTTP 200 + JSON** for Clay to mark as success
- CORS is enabled for cross-origin requests from Clay
- Data is stored in memory and lost on server restart
# clay-demo
