package models

import "time"

type Item struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	Done      bool      `json:"done"`
	CreatedAt time.Time `json:"created_at"`
}

type CreateItemRequest struct {
	Title string `json:"title" binding:"required"`
}

type UpdateItemRequest struct {
	Title *string `json:"title"`
	Done  *bool   `json:"done"`
}
