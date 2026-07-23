package services

import (
	"database/sql"
	"errors"

	"github.com/user/playground/models"
)

var ErrNotFound = errors.New("not found")

type ItemService struct {
	db *sql.DB
}

func NewItemService(db *sql.DB) *ItemService {
	return &ItemService{db: db}
}

func (s *ItemService) List() ([]models.Item, error) {
	rows, err := s.db.Query(`SELECT id, title, done, created_at FROM items ORDER BY id DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]models.Item, 0)
	for rows.Next() {
		var item models.Item
		if err := rows.Scan(&item.ID, &item.Title, &item.Done, &item.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *ItemService) Get(id int64) (models.Item, error) {
	var item models.Item
	err := s.db.QueryRow(`SELECT id, title, done, created_at FROM items WHERE id = ?`, id).
		Scan(&item.ID, &item.Title, &item.Done, &item.CreatedAt)
	if err == sql.ErrNoRows {
		return item, ErrNotFound
	}
	return item, err
}

func (s *ItemService) Create(title string) (models.Item, error) {
	res, err := s.db.Exec(`INSERT INTO items (title) VALUES (?)`, title)
	if err != nil {
		return models.Item{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return models.Item{}, err
	}
	return s.Get(id)
}

func (s *ItemService) Update(id int64, req models.UpdateItemRequest) (models.Item, error) {
	item, err := s.Get(id)
	if err != nil {
		return item, err
	}

	if req.Title != nil {
		item.Title = *req.Title
	}
	if req.Done != nil {
		item.Done = *req.Done
	}

	_, err = s.db.Exec(`UPDATE items SET title = ?, done = ? WHERE id = ?`, item.Title, item.Done, id)
	if err != nil {
		return item, err
	}
	return item, nil
}

func (s *ItemService) Delete(id int64) error {
	res, err := s.db.Exec(`DELETE FROM items WHERE id = ?`, id)
	if err != nil {
		return err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
