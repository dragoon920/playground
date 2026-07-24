package main

import (
	"log"
	"os"

	"github.com/user/playground/config"
	"github.com/user/playground/database"
	"github.com/user/playground/routes"

	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	_ = os.Setenv("JWT_SECRET", cfg.JWTSecret)

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("database: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(db); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	r := routes.Setup(db)
	log.Printf("API listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
