package services

import (
	"database/sql"
	"errors"
	"strings"

	"github.com/user/playground/models"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrEmailTaken         = errors.New("email already taken")
	ErrForbidden          = errors.New("forbidden")
)

type UserService struct {
	db *sql.DB
}

func NewUserService(db *sql.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) EnsureAdminSeed() error {
	var n int
	if err := s.db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&n); err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	_, err = s.db.Exec(
		`INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)`,
		"admin@playground.com", "Admin", "admin", string(hash),
	)
	return err
}

func (s *UserService) Authenticate(email, password string) (models.User, error) {
	user, err := s.FindByEmail(strings.TrimSpace(strings.ToLower(email)))
	if err == ErrNotFound {
		return models.User{}, ErrInvalidCredentials
	}
	if err != nil {
		return models.User{}, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return models.User{}, ErrInvalidCredentials
	}
	return user, nil
}

func (s *UserService) FindByEmail(email string) (models.User, error) {
	var u models.User
	err := s.db.QueryRow(
		`SELECT id, email, name, role, password_hash, created_at FROM users WHERE email = ?`,
		email,
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.PasswordHash, &u.CreatedAt)
	if err == sql.ErrNoRows {
		return u, ErrNotFound
	}
	return u, err
}

func (s *UserService) FindByID(id int64) (models.User, error) {
	var u models.User
	err := s.db.QueryRow(
		`SELECT id, email, name, role, password_hash, created_at FROM users WHERE id = ?`,
		id,
	).Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.PasswordHash, &u.CreatedAt)
	if err == sql.ErrNoRows {
		return u, ErrNotFound
	}
	return u, err
}

func (s *UserService) List() ([]models.User, error) {
	rows, err := s.db.Query(
		`SELECT id, email, name, role, created_at FROM users ORDER BY id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]models.User, 0)
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func (s *UserService) Create(req models.CreateUserRequest) (models.User, error) {
	email := strings.TrimSpace(strings.ToLower(req.Email))
	role := strings.TrimSpace(req.Role)
	if role == "" {
		role = "user"
	}
	if role != "admin" && role != "user" {
		role = "user"
	}

	if _, err := s.FindByEmail(email); err == nil {
		return models.User{}, ErrEmailTaken
	} else if err != ErrNotFound {
		return models.User{}, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return models.User{}, err
	}

	res, err := s.db.Exec(
		`INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)`,
		email, strings.TrimSpace(req.Name), role, string(hash),
	)
	if err != nil {
		return models.User{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return models.User{}, err
	}
	return s.FindByID(id)
}

func (s *UserService) Delete(id, actorID int64) error {
	if id == actorID {
		return ErrForbidden
	}
	res, err := s.db.Exec(`DELETE FROM users WHERE id = ?`, id)
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
