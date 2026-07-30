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
			note TEXT NOT NULL DEFAULT (''),
			status VARCHAR(32) NOT NULL DEFAULT 'applied',
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`); err != nil {
		return err
	}

	for _, stmt := range []string{
		`ALTER TABLE jobs ADD COLUMN url VARCHAR(1024) NOT NULL DEFAULT ''`,
		`ALTER TABLE jobs ADD COLUMN note TEXT NOT NULL DEFAULT ('')`,
	} {
		if _, err := db.Exec(stmt); err != nil && !isDuplicateColumnError(err) {
			return err
		}
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS suburbs (
			id VARCHAR(64) PRIMARY KEY,
			city_id VARCHAR(64) NOT NULL,
			name VARCHAR(255) NOT NULL,
			state VARCHAR(32) NOT NULL DEFAULT 'NSW',
			postcode VARCHAR(16) NULL,
			median_house_price DECIMAL(14,2) NULL,
			median_unit_price DECIMAL(14,2) NULL,
			median_townhouse_price DECIMAL(14,2) NULL,
			median_apartment_price DECIMAL(14,2) NULL,
			lat DOUBLE NULL,
			lng DOUBLE NULL,
			boundary_id VARCHAR(128) NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			UNIQUE KEY uq_suburbs_city_name (city_id, name),
			KEY idx_suburbs_city_price (city_id, median_house_price)
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`); err != nil {
		return err
	}

	for _, stmt := range []string{
		`ALTER TABLE suburbs ADD COLUMN median_townhouse_price DECIMAL(14,2) NULL`,
		`ALTER TABLE suburbs ADD COLUMN median_apartment_price DECIMAL(14,2) NULL`,
	} {
		if _, err := db.Exec(stmt); err != nil && !isDuplicateColumnError(err) {
			return err
		}
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS suburb_metrics (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			suburb_id VARCHAR(64) NOT NULL,
			factor_group VARCHAR(64) NOT NULL,
			payload JSON NOT NULL,
			source VARCHAR(255) NOT NULL DEFAULT '',
			as_of DATE NULL,
			origin VARCHAR(16) NOT NULL DEFAULT 'seed',
			updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			UNIQUE KEY uq_suburb_factor (suburb_id, factor_group),
			CONSTRAINT fk_suburb_metrics_suburb
				FOREIGN KEY (suburb_id) REFERENCES suburbs(id) ON DELETE CASCADE
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`); err != nil {
		return err
	}

	if _, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS property_ingestion_runs (
			id BIGINT AUTO_INCREMENT PRIMARY KEY,
			factor_group VARCHAR(64) NOT NULL,
			provider VARCHAR(128) NOT NULL,
			status VARCHAR(32) NOT NULL DEFAULT 'pending',
			message TEXT NOT NULL DEFAULT (''),
			started_at TIMESTAMP NULL,
			finished_at TIMESTAMP NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
	`); err != nil {
		return err
	}

	return nil
}

func isDuplicateColumnError(err error) bool {
	return err != nil && strings.Contains(strings.ToLower(err.Error()), "duplicate column")
}
