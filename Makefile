.PHONY: help configure run-app run-back migrate

# Colors
GREEN := \033[0;32m
YELLOW := \033[0;33m
CYAN := \033[0;36m
NC := \033[0m

# Detect machine IP (works on macOS and Linux)
get_ip = $(shell if [ "$$(uname)" = "Darwin" ]; then \
	ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost"; \
else \
	hostname -I 2>/dev/null | awk '{print $$1}' || ip route get 1 2>/dev/null | awk '{print $$7}' || echo "localhost"; \
fi)

help: ## Print this help message
	@echo ""
	@echo "$(CYAN)Fahman Development Commands$(NC)"
	@echo ""
	@echo "  $(YELLOW)make configure$(NC)  Detect machine IP and configure API endpoints"
	@echo "  $(YELLOW)make run-app$(NC)    Run the mobile app (Expo)"
	@echo "  $(YELLOW)make run-back$(NC)   Run the backend server"
	@echo "  $(YELLOW)make migrate$(NC)    Run database migrations"
	@echo "  $(YELLOW)make help$(NC)       Print this help message"
	@echo ""

configure: ## Detect machine IP and configure API endpoints
	@IP=$(get_ip); \
	if [ "$$IP" = "localhost" ]; then \
		echo "$(YELLOW)Warning: Could not detect network IP, using localhost$(NC)"; \
	else \
		echo "$(GREEN)Detected IP: $$IP$(NC)"; \
	fi; \
	if [ -f app/.env ]; then \
		if grep -q "^API_URL=" app/.env; then \
			sed -i.bak "s|^API_URL=.*|API_URL=http://$$IP:3000/api|" app/.env && rm -f app/.env.bak; \
		else \
			echo "API_URL=http://$$IP:3000/api" >> app/.env; \
		fi; \
	else \
		echo "API_URL=http://$$IP:3000/api" > app/.env; \
	fi; \
	echo "$(GREEN)Configured app/.env with API_URL=http://$$IP:3000/api$(NC)"

run-app: ## Run the mobile app (Expo)
	@echo "$(GREEN)Starting mobile app...$(NC)"
	@cd app && npx expo start --clear

run-back: ## Run the backend server
	@echo "$(GREEN)Starting backend server...$(NC)"
	@cd backend && bun run dev

migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(NC)"
	@cd backend && bunx prisma migrate dev
