package database

import (
	"database/sql"
	"log"
	"strings"
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
	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS items (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			done TINYINT(1) NOT NULL DEFAULT 0,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`); err != nil {
		return err
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			email VARCHAR(255) NOT NULL UNIQUE,
			name VARCHAR(255) NOT NULL,
			role VARCHAR(32) NOT NULL DEFAULT 'user',
			password_hash VARCHAR(255) NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`); err != nil {
		return err
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS jobs (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			company VARCHAR(255) NOT NULL,
			role VARCHAR(255) NOT NULL,
			salary VARCHAR(64) NOT NULL,
			url VARCHAR(1024) NOT NULL DEFAULT '',
			status VARCHAR(32) NOT NULL DEFAULT 'applied',
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`); err != nil {
		return err
	}

	// Existing DBs created before url was added.
	_, err := db.Exec(`ALTER TABLE jobs ADD COLUMN url VARCHAR(1024) NOT NULL DEFAULT ''`)
	if err != nil && !isDuplicateColumnError(err) {
		return err
	}
	return nil
}

func isDuplicateColumnError(err error) bool {
	return err != nil && strings.Contains(strings.ToLower(err.Error()), "duplicate column")
}
