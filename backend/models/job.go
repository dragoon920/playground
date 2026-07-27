package models

import "time"

type Job struct {
	ID        int64     `json:"id"`
	Company   string    `json:"company"`
	Role      string    `json:"role"`
	Salary    string    `json:"salary"`
	URL       string    `json:"url"`
	Note      string    `json:"note"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateJobRequest struct {
	Company string `json:"company" binding:"required"`
	Role    string `json:"role"`
	Salary  string `json:"salary"`
	URL     string `json:"url"`
	Note    string `json:"note"`
	Status  string `json:"status"`
}

type UpdateJobRequest struct {
	Company *string `json:"company"`
	Role    *string `json:"role"`
	Salary  *string `json:"salary"`
	URL     *string `json:"url"`
	Note    *string `json:"note"`
	Status  *string `json:"status"`
}

type JobListResponse struct {
	Items      []Job `json:"items"`
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	PerPage    int   `json:"per_page"`
	TotalPages int   `json:"total_pages"`
}
