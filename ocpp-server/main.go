package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	db "ocpp-server/db"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type ChargerID string

func (c *ChargerID) UnmarshalJSON(data []byte) error {
	var s string
	if err := json.Unmarshal(data, &s); err == nil {
		*c = ChargerID(s)
		return nil
	}
	var n int
	if err := json.Unmarshal(data, &n); err == nil {
		*c = ChargerID(strconv.Itoa(n))
		return nil
	}
	return fmt.Errorf("chargerId must be string or number")
}

// OCPP Message Types
const (
	CALL       = 2
	CALLRESULT = 3
	CALLERROR  = 4
)

// OCPP Message represents the basic OCPP message structure
type OCPPMessage []interface{}

// Charger represents a connected charger
type Charger struct {
	ID         string
	Connection *websocket.Conn
	LastSeen   time.Time
}

// OCPPServer handles OCPP WebSocket connections
type OCPPServer struct {
	chargers map[string]*Charger
	mutex    sync.RWMutex
	upgrader websocket.Upgrader
}

// NewOCPPServer creates a new OCPP server instance
func NewOCPPServer() *OCPPServer {
	return &OCPPServer{
		chargers: make(map[string]*Charger),
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow connections from any origin
			},
			Subprotocols: []string{"ocpp1.6"},
		},
	}
}

// HandleWebSocket handles incoming WebSocket connections
func (s *OCPPServer) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Extract charger ID from URL path
	chargerID := r.URL.Path[1:] // Remove leading '/'
	if chargerID == "" {
		chargerID = fmt.Sprintf("charger_%s", uuid.New().String()[:8])
	}

	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade connection: %v", err)
		return
	}
	defer conn.Close()

	// Register charger
	charger := &Charger{
		ID:         chargerID,
		Connection: conn,
		LastSeen:   time.Now(),
	}

	s.mutex.Lock()
	s.chargers[chargerID] = charger
	s.mutex.Unlock()

	log.Printf("Charger %s connected from %s", chargerID, conn.RemoteAddr())

	// Handle messages
	for {
		var msg OCPPMessage
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("Error reading message from %s: %v", chargerID, err)
			break
		}

		charger.LastSeen = time.Now()
		go s.handleOCPPMessage(charger, msg)
	}

	// Cleanup
	s.mutex.Lock()
	delete(s.chargers, chargerID)
	s.mutex.Unlock()
	log.Printf("Charger %s disconnected", chargerID)
}

// handleOCPPMessage processes OCPP messages
func (s *OCPPServer) handleOCPPMessage(charger *Charger, msg OCPPMessage) {
	if len(msg) < 2 {
		log.Printf("Invalid message format from %s", charger.ID)
		return
	}

	messageType := int(msg[0].(float64))
	messageID := msg[1].(string)

	log.Printf("Received from %s: %v", charger.ID, msg)

	switch messageType {
	case CALL:
		if len(msg) < 3 {
			log.Printf("Invalid CALL message from %s", charger.ID)
			return
		}
		action := msg[2].(string)
		/*var payload map[string]interface{}
		if len(msg) > 3 {
			payload = msg[3].(map[string]interface{})
		}*/
		var payload map[string]interface{}
		if len(msg) > 3 {
			if msg[3] != nil {
				payload, _ = msg[3].(map[string]interface{})
			} else {
				// Only log for actions that expect a payload
				if action != "Heartbeat" {
					log.Println("⚠️ Received nil payload")
				}
				payload = make(map[string]interface{})
			}
		} else {
			if action != "Heartbeat" {
				log.Println("⚠️ Message does not contain a payload")
			}
			payload = make(map[string]interface{})
		}

		response := s.handleCall(charger.ID, action, payload)
		s.sendCallResult(charger, messageID, response)

	case CALLRESULT:
		log.Printf("Received CALLRESULT from %s", charger.ID)

	case CALLERROR:
		log.Printf("Received CALLERROR from %s: %v", charger.ID, msg)
	}
}

// handleCall processes OCPP call messages
func (s *OCPPServer) handleCall(chargerID, action string, payload map[string]interface{}) map[string]interface{} {
	switch action {
	case "BootNotification":
		return s.handleBootNotification(chargerID, payload)
	case "Heartbeat":
		return s.handleHeartbeat(chargerID, payload)
	case "StatusNotification":
		return s.handleStatusNotification(chargerID, payload)
	case "Authorize":
		return s.handleAuthorize(chargerID, payload)
	case "StartTransaction":
		return s.handleStartTransaction(chargerID, payload)
	case "StopTransaction":
		return s.handleStopTransaction(chargerID, payload)
	case "MeterValues":
		return s.handleMeterValues(chargerID, payload)
	default:
		log.Printf("Unknown action %s from %s", action, chargerID)
		return map[string]interface{}{"status": "Rejected"}
	}
}

// OCPP Message Handlers
func (s *OCPPServer) handleBootNotification(chargerID string, payload map[string]interface{}) map[string]interface{} {
	log.Printf("Boot notification from %s: %v", chargerID, payload)
	return map[string]interface{}{
		"status":      "Accepted",
		"currentTime": time.Now().UTC().Format(time.RFC3339),
		"interval":    300, // Heartbeat interval in seconds
	}
}

func (s *OCPPServer) handleHeartbeat(chargerID string, payload map[string]interface{}) map[string]interface{} {
	return map[string]interface{}{
		"currentTime": time.Now().UTC().Format(time.RFC3339),
	}
}

// updateChargerStatus updates the status of a charger in the database by chargerID
func updateChargerStatus(chargerID string, status string) error {
	ctx := context.Background()
	// Use the UpdateChargerStatus helper from db package
	return db.UpdateChargerStatus(ctx, chargerID, status)
}

func (s *OCPPServer) handleStatusNotification(chargerID string, payload map[string]interface{}) map[string]interface{} {
	var connectorID int
	log.Printf("DEBUG: Full payload from %s: %+v", chargerID, payload)
	if v, ok := payload["connectorId"]; ok && v != nil {
		switch val := v.(type) {
		case float64:
			connectorID = int(val)
		case int:
			connectorID = val
		case string:
			if parsed, err := strconv.Atoi(val); err == nil {
				connectorID = parsed
			} else {
				log.Printf("StatusNotification: connectorId string cannot be parsed to int: %v", val)
			}
		default:
			log.Printf("StatusNotification: connectorId has unexpected type %T: %v", val, val)
		}
	} else {
		log.Printf("StatusNotification: connectorId missing or nil")
	}

	var status string
	if v, ok := payload["status"]; ok && v != nil {
		if s, ok := v.(string); ok {
			status = s
		} else {
			// Try to convert to string if it's not a string type
			status = fmt.Sprintf("%v", v)
			log.Printf("StatusNotification: status was not string type, converted from %T: %v", v, v)
		}
	} else {
		log.Printf("StatusNotification: status missing or nil")
	}

	log.Printf("Status from %s connector %d: %s", chargerID, connectorID, status)

	// Update status into database
	err := updateChargerStatus(chargerID, status)
	if err != nil {
		log.Printf("DB update error for charger %s: %v", chargerID, err)
	}

	return map[string]interface{}{}
}
func (s *OCPPServer) handleAuthorize(chargerID string, payload map[string]interface{}) map[string]interface{} {
	idTag := payload["idTag"].(string)
	log.Printf("Authorization request from %s for tag: %s", chargerID, idTag)

	// Simple authorization logic
	status := "Invalid"
	if len(idTag) >= 5 && idTag[:5] == "VALID" {
		status = "Accepted"
	}

	return map[string]interface{}{
		"idTagInfo": map[string]interface{}{
			"status": status,
		},
	}
}

var lastTransactionIDs = make(map[string]int)
var lastTransactionMu sync.RWMutex

func getLastTransactionId(chargerID string) int {
	lastTransactionMu.RLock()
	defer lastTransactionMu.RUnlock()
	return lastTransactionIDs[chargerID]
}

func (s *OCPPServer) handleStartTransaction(chargerID string, payload map[string]interface{}) map[string]interface{} {
	connectorID, ok := payload["connectorId"].(float64)
	if !ok {
		log.Printf("StartTransaction: missing or invalid connectorId: %v", payload["connectorId"])
		return map[string]interface{}{
			"idTagInfo": map[string]interface{}{
				"status": "Rejected",
			},
		}
	}
	idTag, ok := payload["idTag"].(string)
	if !ok {
		log.Printf("StartTransaction: missing or invalid idTag: %v", payload["idTag"])
		return map[string]interface{}{
			"idTagInfo": map[string]interface{}{
				"status": "Rejected",
			},
		}
	}

	transactionID := int(time.Now().Unix())
	log.Printf("Starting transaction %d on %s connector %d (idTag: %s)", transactionID, chargerID, int(connectorID), idTag)

	// Store transaction ID
	lastTransactionMu.Lock()
	lastTransactionIDs[chargerID] = transactionID
	lastTransactionMu.Unlock()

	return map[string]interface{}{
		"transactionId": transactionID,
		"idTagInfo": map[string]interface{}{
			"status": "Accepted",
		},
	}
}

func (s *OCPPServer) handleStopTransaction(chargerID string, payload map[string]interface{}) map[string]interface{} {
	transactionID := int(payload["transactionId"].(float64))
	log.Printf("Stopping transaction %d on %s", transactionID, chargerID)

	// Remove transaction ID
	lastTransactionMu.Lock()
	delete(lastTransactionIDs, chargerID)
	lastTransactionMu.Unlock()

	return map[string]interface{}{
		"idTagInfo": map[string]interface{}{
			"status": "Accepted",
		},
	}
}

func (s *OCPPServer) handleMeterValues(chargerID string, payload map[string]interface{}) map[string]interface{} {
	connectorID := int(payload["connectorId"].(float64))
	log.Printf("Meter values from %s connector %d", chargerID, connectorID)
	return map[string]interface{}{}
}

// sendCallResult sends a CALLRESULT message
func (s *OCPPServer) sendCallResult(charger *Charger, messageID string, payload map[string]interface{}) {
	response := OCPPMessage{CALLRESULT, messageID, payload}

	err := charger.Connection.WriteJSON(response)
	if err != nil {
		log.Printf("Error sending response to %s: %v", charger.ID, err)
		return
	}

	log.Printf("Sent to %s: %v", charger.ID, response)
}

// SendRemoteCommand sends a command to a specific charger
func (s *OCPPServer) SendRemoteCommand(chargerID, action string, payload map[string]interface{}) error {
	s.mutex.RLock()
	charger, exists := s.chargers[chargerID]
	s.mutex.RUnlock()

	if !exists {
		return fmt.Errorf("charger %s not connected", chargerID)
	}

	messageID := uuid.New().String()
	command := OCPPMessage{CALL, messageID, action, payload}

	err := charger.Connection.WriteJSON(command)
	if err != nil {
		return fmt.Errorf("failed to send command to %s: %v", chargerID, err)
	}

	log.Printf("Sent command to %s: %v", chargerID, command)
	return nil
}

// GetConnectedChargers returns list of connected chargers
func (s *OCPPServer) GetConnectedChargers() []string {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	chargers := make([]string, 0, len(s.chargers))
	for id := range s.chargers {
		chargers = append(chargers, id)
	}
	return chargers
}

// CORS middleware
func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

// Logging middleware to print HTTP method, path, and status code
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		lrw := &loggingResponseWriter{ResponseWriter: w, statusCode: 200}
		next.ServeHTTP(lrw, r)
		fmt.Printf("%s %s %d\n", r.Method, r.URL.Path, lrw.statusCode)
	})
}

type loggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (lrw *loggingResponseWriter) WriteHeader(code int) {
	lrw.statusCode = code
	lrw.ResponseWriter.WriteHeader(code)
}

// Main function
func main() {
	// Initialize DB connection
	if err := db.Init(); err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}

	// Create OCPP server
	server := NewOCPPServer()

	// Setup HTTP handlers
	mux := http.NewServeMux()
	// Register WebSocket handler directly (do NOT wrap with logging middleware)
	mux.HandleFunc("/", server.HandleWebSocket)

	// API endpoints
	apiMux := http.NewServeMux()
	apiMux.HandleFunc("/api/chargers", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		chargers := server.GetConnectedChargers()
		w.Header().Set("Content-Type", "application/json")
		err := json.NewEncoder(w).Encode(map[string]interface{}{
			"chargers": chargers,
		})
		if err != nil {
			http.Error(w, "Failed to encode response", http.StatusInternalServerError)
			return
		}
	})
	apiMux.HandleFunc("/api/charger/command", func(w http.ResponseWriter, r *http.Request) {
		enableCORS(w)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Define request struct and limit body size
		type chargerCommandRequest struct {
			ChargerID ChargerID `json:"chargerId"`
			Command   string    `json:"command"`
		}
		var req chargerCommandRequest
		r.Body = http.MaxBytesReader(w, r.Body, 1048576)
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			log.Printf("/api/charger/command decode error: %v", err)
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		log.Printf("Received charger command: %+v", req)

		var action string
		var payload map[string]interface{}
		switch req.Command {
		case "start":
			action = "RemoteStartTransaction"
			payload = map[string]interface{}{
				"connectorId": 1,
				"idTag":       "123456", // You may want to customize this
			}
		case "stop":
			action = "RemoteStopTransaction"
			// Look up last transactionId for this charger
			lastTransactionMu.RLock()
			transactionId := lastTransactionIDs[string(req.ChargerID)]
			lastTransactionMu.RUnlock()
			if transactionId == 0 {
				http.Error(w, "No active transaction for this charger", http.StatusBadRequest)
				return
			}
			payload = map[string]interface{}{
				"transactionId": transactionId,
			}
		default:
			http.Error(w, "Unknown command", http.StatusBadRequest)
			return
		}

		err := server.SendRemoteCommand(string(req.ChargerID), action, payload)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"sent"}`))
	})

	// Mount API mux with logging middleware
	mux.Handle("/api/", loggingMiddleware(apiMux))

	log.Println("OCPP Server starting on :9000")
	log.Fatal(http.ListenAndServe(":9000", mux))
}

// go.mod file content:
/*
module ocpp-server

go 1.19

require (
	github.com/google/uuid v1.3.0
	github.com/gorilla/websocket v1.5.0
)
*/
