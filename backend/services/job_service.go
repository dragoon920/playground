package services

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/user/playground/models"
)

type JobService struct {
	db *sql.DB
}

func NewJobService(db *sql.DB) *JobService {
	return &JobService{db: db}
}

func normalizeJobStatus(status string) (string, error) {
	s := strings.ToLower(strings.TrimSpace(status))
	if s == "" {
		return "applied", nil
	}
	switch s {
	case "applied", "rejected":
		return s, nil
	default:
		return "", fmt.Errorf("status must be applied or rejected")
	}
}

func (s *JobService) List() ([]models.Job, error) {
	rows, err := s.db.Query(`
		SELECT id, company, role, salary, url, note, status, created_at
		FROM jobs
		ORDER BY id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	jobs := make([]models.Job, 0)
	for rows.Next() {
		var job models.Job
		if err := rows.Scan(
			&job.ID, &job.Company, &job.Role, &job.Salary, &job.URL, &job.Note, &job.Status, &job.CreatedAt,
		); err != nil {
			return nil, err
		}
		jobs = append(jobs, job)
	}
	return jobs, rows.Err()
}

func (s *JobService) Get(id int64) (models.Job, error) {
	var job models.Job
	err := s.db.QueryRow(`
		SELECT id, company, role, salary, url, note, status, created_at
		FROM jobs
		WHERE id = ?
	`, id).Scan(
		&job.ID, &job.Company, &job.Role, &job.Salary, &job.URL, &job.Note, &job.Status, &job.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return job, ErrNotFound
	}
	return job, err
}

func (s *JobService) Create(req models.CreateJobRequest) (models.Job, error) {
	status, err := normalizeJobStatus(req.Status)
	if err != nil {
		return models.Job{}, err
	}

	res, err := s.db.Exec(
		`INSERT INTO jobs (company, role, salary, url, note, status) VALUES (?, ?, ?, ?, ?, ?)`,
		strings.TrimSpace(req.Company),
		strings.TrimSpace(req.Role),
		strings.TrimSpace(req.Salary),
		strings.TrimSpace(req.URL),
		strings.TrimSpace(req.Note),
		status,
	)
	if err != nil {
		return models.Job{}, err
	}
	id, err := res.LastInsertId()
	if err != nil {
		return models.Job{}, err
	}
	return s.Get(id)
}

func (s *JobService) Update(id int64, req models.UpdateJobRequest) (models.Job, error) {
	job, err := s.Get(id)
	if err != nil {
		return job, err
	}

	if req.Company != nil {
		company := strings.TrimSpace(*req.Company)
		if company == "" {
			return job, fmt.Errorf("company is required")
		}
		job.Company = company
	}
	if req.Role != nil {
		role := strings.TrimSpace(*req.Role)
		if role == "" {
			return job, fmt.Errorf("role is required")
		}
		job.Role = role
	}
	if req.Salary != nil {
		salary := strings.TrimSpace(*req.Salary)
		if salary == "" {
			return job, fmt.Errorf("salary is required")
		}
		job.Salary = salary
	}
	if req.URL != nil {
		url := strings.TrimSpace(*req.URL)
		if url == "" {
			return job, fmt.Errorf("url is required")
		}
		job.URL = url
	}
	if req.Note != nil {
		job.Note = strings.TrimSpace(*req.Note)
	}
	if req.Status != nil {
		status, err := normalizeJobStatus(*req.Status)
		if err != nil {
			return job, err
		}
		job.Status = status
	}

	_, err = s.db.Exec(
		`UPDATE jobs SET company = ?, role = ?, salary = ?, url = ?, note = ?, status = ? WHERE id = ?`,
		job.Company, job.Role, job.Salary, job.URL, job.Note, job.Status, id,
	)
	if err != nil {
		return job, err
	}
	return s.Get(id)
}

func (s *JobService) Delete(id int64) error {
	res, err := s.db.Exec(`DELETE FROM jobs WHERE id = ?`, id)
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
