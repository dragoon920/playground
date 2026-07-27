package controllers

import (
	"net/http"
	"strings"

	"github.com/user/playground/models"
	"github.com/user/playground/services"

	"github.com/gin-gonic/gin"
)

type JobController struct {
	service *services.JobService
}

func NewJobController(service *services.JobService) *JobController {
	return &JobController{service: service}
}

func (jc *JobController) List(c *gin.Context) {
	jobs, err := jc.service.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, jobs)
}

func (jc *JobController) Create(c *gin.Context) {
	var req models.CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "company, role, salary, and url are required"})
		return
	}

	job, err := jc.service.Create(req)
	if err != nil {
		if strings.Contains(err.Error(), "status must be") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, job)
}
