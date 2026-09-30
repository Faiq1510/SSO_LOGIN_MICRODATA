package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

func formatPhoneNumber(phone string) string {
	re := regexp.MustCompile(`\D`)
	numeric := re.ReplaceAllString(phone, "")

	if len(numeric) < 8 {
		return phone 
	}

	if strings.HasPrefix(numeric, "62") {
		return "+" + numeric
	} else if strings.HasPrefix(numeric, "0") {
		return "+62" + numeric[1:]
	} else {
		return "+62" + numeric
	}
}

type WhatsAppService interface {
	SendMessage(target string, message string) error
}

type whatsappService struct{}

func NewWhatsAppService() WhatsAppService {
	return &whatsappService{}
}

func (s *whatsappService) SendMessage(target string, message string) error {
	token := os.Getenv("FONNTE_TOKEN")
	target = formatPhoneNumber(target)
	
	// #nosec G101 - checking placeholder token string
	if token == "" || token == "your_fonnte_token_here" {
		// Log simulation instead of throwing error if token is not set
		fmt.Printf("[WhatsAppService] Simulation Mode - Target: %s, Message: %s\n", target, message)
		return nil
	}

	url := "https://api.fonnte.com/send"

	payload := map[string]string{
		"target": target,
		"message": message,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 10 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to send message, status code: %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err == nil {
		var fonnteResp struct {
			Status bool   `json:"status"`
			Reason string `json:"reason"`
		}
		if err := json.Unmarshal(bodyBytes, &fonnteResp); err == nil {
			if !fonnteResp.Status {
				return fmt.Errorf("fonnte API rejected: %s", fonnteResp.Reason)
			}
		}
	}

	return nil
}
