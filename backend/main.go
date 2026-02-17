package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/google/uuid"
)

// Restroom represents a public restroom location.
type Restroom struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Address   string    `json:"address"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	CreatedAt time.Time `json:"created_at"`
}

// Rating represents a user rating for a restroom.
type Rating struct {
	ID          string    `json:"id"`
	RestroomID  string    `json:"restroom_id"`
	Cleanliness int       `json:"cleanliness"` // 1-5
	Accessibility int     `json:"accessibility"` // 1-5
	Amenities   int       `json:"amenities"` // 1-5
	Overall     int       `json:"overall"` // 1-5
	Comment     string    `json:"comment"`
	CreatedAt   time.Time `json:"created_at"`
}

// RestroomWithRatings is a restroom with its computed average ratings.
type RestroomWithRatings struct {
	Restroom
	AvgCleanliness    float64 `json:"avg_cleanliness"`
	AvgAccessibility  float64 `json:"avg_accessibility"`
	AvgAmenities      float64 `json:"avg_amenities"`
	AvgOverall        float64 `json:"avg_overall"`
	RatingCount       int     `json:"rating_count"`
}

// Store is an in-memory data store (swap for a real DB later).
type Store struct {
	mu        sync.RWMutex
	restrooms map[string]Restroom
	ratings   map[string][]Rating
}

func NewStore() *Store {
	return &Store{
		restrooms: make(map[string]Restroom),
		ratings:   make(map[string][]Rating),
	}
}

func main() {
	store := NewStore()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/restrooms", corsMiddleware(store.handleRestrooms))
	mux.HandleFunc("/api/restrooms/", corsMiddleware(store.handleRestroomByID))
	mux.HandleFunc("/api/ratings", corsMiddleware(store.handleRatings))
	mux.HandleFunc("/api/health", corsMiddleware(handleHealth))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Go on the Go backend starting on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Store) handleRestrooms(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		s.listRestrooms(w, r)
	case http.MethodPost:
		s.createRestroom(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Store) handleRestroomByID(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Path[len("/api/restrooms/"):]
	if id == "" {
		http.Error(w, "missing restroom id", http.StatusBadRequest)
		return
	}

	s.mu.RLock()
	restroom, ok := s.restrooms[id]
	ratings := s.ratings[id]
	s.mu.RUnlock()

	if !ok {
		http.Error(w, "restroom not found", http.StatusNotFound)
		return
	}

	result := computeRatings(restroom, ratings)
	writeJSON(w, http.StatusOK, result)
}

func (s *Store) listRestrooms(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	results := make([]RestroomWithRatings, 0, len(s.restrooms))
	for id, restroom := range s.restrooms {
		results = append(results, computeRatings(restroom, s.ratings[id]))
	}

	writeJSON(w, http.StatusOK, results)
}

func (s *Store) createRestroom(w http.ResponseWriter, r *http.Request) {
	var restroom Restroom
	if err := json.NewDecoder(r.Body).Decode(&restroom); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if restroom.Name == "" || restroom.Address == "" {
		http.Error(w, "name and address are required", http.StatusBadRequest)
		return
	}

	restroom.ID = uuid.New().String()
	restroom.CreatedAt = time.Now()

	s.mu.Lock()
	s.restrooms[restroom.ID] = restroom
	s.mu.Unlock()

	writeJSON(w, http.StatusCreated, restroom)
}

func (s *Store) handleRatings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		s.createRating(w, r)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func (s *Store) createRating(w http.ResponseWriter, r *http.Request) {
	var rating Rating
	if err := json.NewDecoder(r.Body).Decode(&rating); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if rating.RestroomID == "" {
		http.Error(w, "restroom_id is required", http.StatusBadRequest)
		return
	}

	s.mu.RLock()
	_, ok := s.restrooms[rating.RestroomID]
	s.mu.RUnlock()
	if !ok {
		http.Error(w, "restroom not found", http.StatusNotFound)
		return
	}

	for _, v := range []int{rating.Cleanliness, rating.Accessibility, rating.Amenities, rating.Overall} {
		if v < 1 || v > 5 {
			http.Error(w, "ratings must be between 1 and 5", http.StatusBadRequest)
			return
		}
	}

	rating.ID = uuid.New().String()
	rating.CreatedAt = time.Now()

	s.mu.Lock()
	s.ratings[rating.RestroomID] = append(s.ratings[rating.RestroomID], rating)
	s.mu.Unlock()

	writeJSON(w, http.StatusCreated, rating)
}

func computeRatings(restroom Restroom, ratings []Rating) RestroomWithRatings {
	result := RestroomWithRatings{Restroom: restroom, RatingCount: len(ratings)}
	if len(ratings) == 0 {
		return result
	}

	var clean, access, amen, overall float64
	for _, r := range ratings {
		clean += float64(r.Cleanliness)
		access += float64(r.Accessibility)
		amen += float64(r.Amenities)
		overall += float64(r.Overall)
	}
	n := float64(len(ratings))
	result.AvgCleanliness = clean / n
	result.AvgAccessibility = access / n
	result.AvgAmenities = amen / n
	result.AvgOverall = overall / n
	return result
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
