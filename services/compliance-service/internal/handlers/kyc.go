// BitCurrent Exchange - KYC Handler
package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

type KYCHandler struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewKYCHandler(db *database.PostgresDB, logger *zap.Logger) *KYCHandler {
	return &KYCHandler{
		db:     db,
		logger: logger,
	}
}

type SubmitKYCRequest struct {
	UserID       string `json:"user_id"`
	DocumentType string `json:"document_type"`
	DocumentNumber string `json:"document_number,omitempty"`
	FilePath     string `json:"file_path"`
}

func (h *KYCHandler) SubmitKYC(w http.ResponseWriter, r *http.Request) {
	var req SubmitKYCRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.UserID == "" || req.DocumentType == "" || req.FilePath == "" {
		respondError(w, http.StatusBadRequest, "Missing required fields")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// TODO: Call Onfido API to verify document
	// For now, create pending document record

	var documentID uuid.UUID
	query := `
		INSERT INTO kyc_documents (
			user_id, document_type, document_number, file_path,
			status, provider
		) VALUES ($1, $2, $3, $4, 'pending', 'onfido')
		RETURNING id
	`

	err := h.db.Pool.QueryRow(
		ctx, query,
		req.UserID, req.DocumentType, req.DocumentNumber, req.FilePath,
	).Scan(&documentID)

	if err != nil {
		h.logger.Error("Failed to submit KYC document", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to submit KYC")
		return
	}

	h.logger.Info("KYC document submitted",
		zap.String("document_id", documentID.String()),
		zap.String("user_id", req.UserID),
		zap.String("type", req.DocumentType),
	)

	respondJSON(w, http.StatusCreated, map[string]interface{}{
		"document_id": documentID.String(),
		"status":      "pending",
		"message":     "KYC document submitted for review",
	})
}

func (h *KYCHandler) GetKYCStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	// Get KYC status from users table
	var kycLevel int
	var kycStatus string
	query := `SELECT kyc_level, kyc_status FROM users WHERE id = $1`

	err := h.db.Pool.QueryRow(ctx, query, userID).Scan(&kycLevel, &kycStatus)
	if err != nil {
		respondError(w, http.StatusNotFound, "User not found")
		return
	}

	// Get pending documents
	docsQuery := `
		SELECT document_type, status, created_at
		FROM kyc_documents
		WHERE user_id = $1
		ORDER BY created_at DESC
	`

	rows, err := h.db.Pool.Query(ctx, docsQuery, userID)
	if err != nil {
		h.logger.Error("Failed to query KYC documents", zap.Error(err))
	}
	defer rows.Close()

	var documents []map[string]interface{}
	if rows != nil {
		for rows.Next() {
			var docType, status string
			var createdAt time.Time
			if err := rows.Scan(&docType, &status, &createdAt); err != nil {
				continue
			}
			documents = append(documents, map[string]interface{}{
				"type":       docType,
				"status":     status,
				"created_at": createdAt.Format(time.RFC3339),
			})
		}
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"user_id":   userID,
		"kyc_level": kycLevel,
		"kyc_status": kycStatus,
		"documents": documents,
	})
}

func (h *KYCHandler) ApproveKYC(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]

	var req struct {
		KYCLevel int `json:"kyc_level"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Update user KYC status
	query := `
		UPDATE users
		SET kyc_level = $1, kyc_status = 'approved', updated_at = NOW()
		WHERE id = $2
	`

	_, err := h.db.Pool.Exec(ctx, query, req.KYCLevel, userID)
	if err != nil {
		h.logger.Error("Failed to approve KYC", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to approve KYC")
		return
	}

	h.logger.Info("KYC approved",
		zap.String("user_id", userID),
		zap.Int("kyc_level", req.KYCLevel),
	)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "KYC approved successfully",
	})
}

func (h *KYCHandler) RejectKYC(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]

	var req struct {
		Reason string `json:"reason"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Update user KYC status
	query := `
		UPDATE users
		SET kyc_status = 'rejected', updated_at = NOW()
		WHERE id = $1
	`

	_, err := h.db.Pool.Exec(ctx, query, userID)
	if err != nil {
		h.logger.Error("Failed to reject KYC", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to reject KYC")
		return
	}

	h.logger.Info("KYC rejected",
		zap.String("user_id", userID),
		zap.String("reason", req.Reason),
	)

	respondJSON(w, http.StatusOK, map[string]string{
		"message": "KYC rejected",
		"reason":  req.Reason,
	})
}

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]string{
		"error":   http.StatusText(status),
		"message": message,
	})
}



