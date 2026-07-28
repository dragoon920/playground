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

func (s *JobService) List(page, perPage int, company string) (models.JobListResponse, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 40
	}

	company = strings.TrimSpace(company)
	where := ""
	args := make([]any, 0, 3)
	if company != "" {
		where = " WHERE company LIKE ?"
		args = append(args, "%"+company+"%")
	}

	var total int64
	countQuery := `SELECT COUNT(*) FROM jobs` + where
	if err := s.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return models.JobListResponse{}, err
	}

	totalPages := int((total + int64(perPage) - 1) / int64(perPage))
	if totalPages == 0 {
		totalPages = 1
	}
	if page > totalPages {
		page = totalPages
	}

	offset := (page - 1) * perPage
	listArgs := append(append([]any{}, args...), perPage, offset)
	rows, err := s.db.Query(`
		SELECT id, company, role, salary, url, note, status, created_at
		FROM jobs`+where+`
		ORDER BY id DESC
		LIMIT ? OFFSET ?
	`, listArgs...)
	if err != nil {
		return models.JobListResponse{}, err
	}
	defer rows.Close()

	jobs := make([]models.Job, 0)
	for rows.Next() {
		var job models.Job
		if err := rows.Scan(
			&job.ID, &job.Company, &job.Role, &job.Salary, &job.URL, &job.Note, &job.Status, &job.CreatedAt,
		); err != nil {
			return models.JobListResponse{}, err
		}
		jobs = append(jobs, job)
	}
	if err := rows.Err(); err != nil {
		return models.JobListResponse{}, err
	}

	return models.JobListResponse{
		Items:      jobs,
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: totalPages,
	}, nil
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
	company := strings.TrimSpace(req.Company)
	if company == "" {
		return models.Job{}, fmt.Errorf("company is required")
	}

	status, err := normalizeJobStatus(req.Status)
	if err != nil {
		return models.Job{}, err
	}

	res, err := s.db.Exec(
		`INSERT INTO jobs (company, role, salary, url, note, status) VALUES (?, ?, ?, ?, ?, ?)`,
		company,
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
		job.Role = strings.TrimSpace(*req.Role)
	}
	if req.Salary != nil {
		job.Salary = strings.TrimSpace(*req.Salary)
	}
	if req.URL != nil {
		job.URL = strings.TrimSpace(*req.URL)
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
