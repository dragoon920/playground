package models

import "time"

type Job struct {
	ID        int64     `json:"id"`
	Company   string    `json:"company"`
	Role      string    `json:"role"`
	Salary    string    `json:"salary"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateJobRequest struct {
	Company string `json:"company" binding:"required"`
	Role    string `json:"role" binding:"required"`
	Salary  string `json:"salary" binding:"required"`
	Status  string `json:"status"`
}
