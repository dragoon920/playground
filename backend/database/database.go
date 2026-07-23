package database

import (
	"database/sql"
	"log"
	"time"

	"github.com/user/playground/config"

	_ "github.com/go-sql-driver/mysql"
)

func Connect(cfg config.Config) (*sql.DB, error) {
	var lastErr error
	for i := 0; i < 30; i++ {
		db, err := sql.Open("mysql", cfg.DSN())
		if err != nil {
			lastErr = err
		} else if err = db.Ping(); err != nil {
			lastErr = err
			_ = db.Close()
		} else {
			db.SetMaxOpenConns(10)
			db.SetMaxIdleConns(5)
			db.SetConnMaxLifetime(time.Hour)
			return db, nil
		}
		log.Printf("waiting for mysql... (%d/30)", i+1)
		time.Sleep(time.Second)
	}
	return nil, lastErr
}

func Migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS items (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			done TINYINT(1) NOT NULL DEFAULT 0,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`)
	return err
}
