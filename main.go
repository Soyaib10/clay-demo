package main

import (
	"bytes"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/google/uuid"
)

type Lead struct {
	ID          string    `json:"id"`
	ListName    string    `json:"list_name"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	Company     string    `json:"company"`
	JobTitle    string    `json:"job_title"`
	Location    string    `json:"location"`
	LinkedInURL string    `json:"linkedin_url"`
	Connections string    `json:"connections"`
	Headline    string    `json:"headline"`
	Email       string    `json:"email"`
	Phone       string    `json:"phone"`
	ReceivedAt  time.Time `json:"received_at"`
}

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

var (
	leads   []Lead
	leadsMu sync.RWMutex
)

func enableCORS(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func main() {
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)

	http.HandleFunc("/api/leads", handleLeads)
	http.HandleFunc("/api/leads/csv", handleCSVDownload)

	port := "8080"
	fmt.Printf("Server: http://localhost:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func handleLeads(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	switch r.Method {
	case "POST":
		receiveLead(w, r)
	case "GET":
		listLeads(w, r)
	case "DELETE":
		clearLeads(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func receiveLead(w http.ResponseWriter, r *http.Request) {
	// DEBUG: Read and log raw body
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("ERROR reading body: %v", err)
	} else {
		log.Printf("RAW BODY RECEIVED: %s", string(bodyBytes))
	}

	// Re-create body for decoding
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// Decode JSON
	var rawData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&rawData); err != nil {
		log.Printf("ERROR decoding JSON: %v", err)
		respondWithJSON(w, http.StatusBadRequest, Response{
			Success: false,
			Message: "Invalid JSON: " + err.Error(),
		})
		return
	}

	log.Printf("DECODED DATA: %+v", rawData)

	// Build lead
	lead := Lead{
		ID:          uuid.New().String(),
		ListName:    getString(rawData, "list_name"),
		FirstName:   getString(rawData, "first_name"),
		LastName:    getString(rawData, "last_name"),
		Company:     getString(rawData, "company"),
		JobTitle:    getString(rawData, "job_title"),
		Location:    getString(rawData, "location"),
		LinkedInURL: getString(rawData, "linkedin_url"),
		Connections: getString(rawData, "connections"),
		Headline:    getString(rawData, "headline"),
		Email:       getString(rawData, "email"),
		Phone:       getString(rawData, "phone"),
		ReceivedAt:  time.Now(),
	}

	leadsMu.Lock()
	leads = append(leads, lead)
	leadsMu.Unlock()

	log.Printf("LEAD STORED: %s %s from %s (ID: %s)", lead.FirstName, lead.LastName, lead.Company, lead.ID)

	respondWithJSON(w, http.StatusOK, Response{
		Success: true,
		Message: "Lead received successfully",
		Data:    map[string]string{"lead_id": lead.ID},
	})
}

func getString(m map[string]interface{}, key string) string {
	if val, ok := m[key]; ok && val != nil {
		switch v := val.(type) {
		case string:
			return v
		case float64:
			if v == float64(int64(v)) {
				return fmt.Sprintf("%d", int64(v))
			}
			return fmt.Sprintf("%v", v)
		case int:
			return fmt.Sprintf("%d", v)
		case bool:
			return fmt.Sprintf("%t", v)
		default:
			return fmt.Sprintf("%v", v)
		}
	}
	return ""
}

func listLeads(w http.ResponseWriter, r *http.Request) {
	leadsMu.RLock()
	defer leadsMu.RUnlock()

	respondWithJSON(w, http.StatusOK, Response{
		Success: true,
		Message: fmt.Sprintf("Found %d leads", len(leads)),
		Data: map[string]interface{}{
			"count": len(leads),
			"leads": leads,
		},
	})
}

func clearLeads(w http.ResponseWriter, r *http.Request) {
	leadsMu.Lock()
	leads = []Lead{}
	leadsMu.Unlock()

	log.Printf("All leads cleared")

	respondWithJSON(w, http.StatusOK, Response{
		Success: true,
		Message: "All leads cleared",
	})
}

func handleCSVDownload(w http.ResponseWriter, r *http.Request) {
	enableCORS(&w)

	leadsMu.RLock()
	defer leadsMu.RUnlock()

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", `attachment; filename="leads.csv"`)

	writer := csv.NewWriter(w)
	defer writer.Flush()

	writer.Write([]string{
		"ID", "List Name", "First Name", "Last Name", "Company",
		"Job Title", "Location", "LinkedIn URL", "Connections",
		"Headline", "Email", "Phone", "Received At",
	})

	for _, lead := range leads {
		writer.Write([]string{
			lead.ID, lead.ListName, lead.FirstName, lead.LastName,
			lead.Company, lead.JobTitle, lead.Location, lead.LinkedInURL,
			lead.Connections, lead.Headline, lead.Email, lead.Phone,
			lead.ReceivedAt.Format("2006-01-02 15:04:05"),
		})
	}
}

func respondWithJSON(w http.ResponseWriter, status int, payload Response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}