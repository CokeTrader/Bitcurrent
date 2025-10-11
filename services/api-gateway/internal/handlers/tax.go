// BitCurrent Exchange - Tax Reporting Handler
package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/bitcurrent-exchange/platform/services/shared/pkg/auth"
	"github.com/bitcurrent-exchange/platform/services/shared/pkg/database"
	"go.uber.org/zap"
)

type TaxHandler struct {
	db     *database.PostgresDB
	logger *zap.Logger
}

func NewTaxHandler(db *database.PostgresDB, logger *zap.Logger) *TaxHandler {
	return &TaxHandler{
		db:     db,
		logger: logger,
	}
}

type TaxTransaction struct {
	Date      string  `json:"date"`
	Type      string  `json:"type"`
	Asset     string  `json:"asset"`
	Amount    float64 `json:"amount"`
	CostBasis float64 `json:"cost_basis"`
	Proceeds  float64 `json:"proceeds"`
	GainLoss  float64 `json:"gain_loss"`
}

type TaxSummary struct {
	TaxYear       string           `json:"tax_year"`
	TotalGains    float64          `json:"total_gains"`
	TotalLosses   float64          `json:"total_losses"`
	NetGainLoss   float64          `json:"net_gain_loss"`
	Allowance     float64          `json:"allowance"`
	TaxableAmount float64          `json:"taxable_amount"`
	EstimatedTax  float64          `json:"estimated_tax"`
	Transactions  []TaxTransaction `json:"transactions"`
}

// GetTaxReport - Generate tax report for user
func (h *TaxHandler) GetTaxReport(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value("claims").(*auth.Claims)
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Get tax year from query params (default to current UK tax year)
	taxYear := r.URL.Query().Get("tax_year")
	if taxYear == "" {
		now := time.Now()
		year := now.Year()
		// UK tax year runs April 6 - April 5
		if now.Month() < 4 || (now.Month() == 4 && now.Day() < 6) {
			taxYear = time.Date(year-1, 4, 6, 0, 0, 0, 0, time.UTC).Format("2006") + "-" +
				time.Date(year, 4, 5, 0, 0, 0, 0, time.UTC).Format("2006")
		} else {
			taxYear = time.Date(year, 4, 6, 0, 0, 0, 0, time.UTC).Format("2006") + "-" +
				time.Date(year+1, 4, 5, 0, 0, 0, 0, time.UTC).Format("2006")
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	// Query all disposal events (sells, trades) for the tax year
	// For NEW accounts, this will return empty array
	query := `
		SELECT 
			o.created_at as date,
			CASE 
				WHEN o.side = 'sell' THEN 'SELL'
				ELSE 'TRADE'
			END as type,
			m.base_currency as asset,
			o.quantity as amount,
			o.price * o.quantity as cost_basis,
			o.price * o.filled_quantity as proceeds,
			(o.price * o.filled_quantity) - (o.price * o.quantity) as gain_loss
		FROM orders o
		JOIN markets m ON o.symbol = m.symbol
		WHERE o.user_id = $1
		  AND o.status = 'filled'
		  AND o.created_at >= $2
		  AND o.created_at < $3
		ORDER BY o.created_at DESC
	`

	// Parse tax year dates
	startDate := taxYear[:4] + "-04-06"
	endYear := taxYear[5:]
	endDate := endYear + "-04-05"

	rows, err := h.db.Pool.Query(ctx, query, claims.UserID, startDate, endDate)
	if err != nil {
		h.logger.Error("Failed to fetch tax transactions", zap.Error(err))
		respondError(w, http.StatusInternalServerError, "Failed to fetch tax data")
		return
	}
	defer rows.Close()

	var transactions []TaxTransaction
	var totalGains, totalLosses float64

	for rows.Next() {
		var tx TaxTransaction
		var dateTime time.Time

		err := rows.Scan(&dateTime, &tx.Type, &tx.Asset, &tx.Amount, &tx.CostBasis, &tx.Proceeds, &tx.GainLoss)
		if err != nil {
			continue
		}

		tx.Date = dateTime.Format("2006-01-02")
		transactions = append(transactions, tx)

		if tx.GainLoss > 0 {
			totalGains += tx.GainLoss
		} else {
			totalLosses += -tx.GainLoss
		}
	}

	// For NEW accounts: transactions will be empty, all values will be 0.00
	netGainLoss := totalGains - totalLosses
	allowance := 3000.00 // UK CGT allowance 2024-25
	taxableAmount := netGainLoss - allowance
	if taxableAmount < 0 {
		taxableAmount = 0
	}

	// Assume basic rate (18%) for capital gains - user should verify their actual rate
	// Higher rate taxpayers pay 24%
	estimatedTax := taxableAmount * 0.18

	summary := TaxSummary{
		TaxYear:       taxYear,
		TotalGains:    totalGains,
		TotalLosses:   totalLosses,
		NetGainLoss:   netGainLoss,
		Allowance:     allowance,
		TaxableAmount: taxableAmount,
		EstimatedTax:  estimatedTax,
		Transactions:  transactions,
	}

	h.logger.Info("Tax report generated",
		zap.String("user_id", claims.UserID.String()),
		zap.String("tax_year", taxYear),
		zap.Int("transactions", len(transactions)),
	)

	respondJSON(w, http.StatusOK, summary)
}
