package controllers

import (
	"net/http"

	"github.com/user/playground/models"
	"github.com/user/playground/services"

	"github.com/gin-gonic/gin"
)

type PropertyController struct {
	service *services.PropertyService
}

func NewPropertyController(service *services.PropertyService) *PropertyController {
	return &PropertyController{service: service}
}

func (pc *PropertyController) ListCities(c *gin.Context) {
	c.JSON(http.StatusOK, pc.service.ListCities())
}

func (pc *PropertyController) Rank(c *gin.Context) {
	var req models.RankRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid rank request"})
		return
	}
	if req.PriceMin > req.PriceMax {
		c.JSON(http.StatusBadRequest, gin.H{"error": "price_min must be <= price_max"})
		return
	}
	if req.PropertyType != "" &&
		req.PropertyType != models.PropertyTypeHouse &&
		req.PropertyType != models.PropertyTypeTownhouse &&
		req.PropertyType != models.PropertyTypeApartment {
		c.JSON(http.StatusBadRequest, gin.H{"error": "property_type must be house, townhouse, or apartment"})
		return
	}
	if !services.WeightsWellFormed(req.Weights) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid preference weights"})
		return
	}

	resp, err := pc.service.Rank(req)
	if err == services.ErrNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "unknown city"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (pc *PropertyController) GetSuburb(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "suburb id required"})
		return
	}

	detail, err := pc.service.GetSuburbDetail(id)
	if err == services.ErrNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "suburb not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, detail)
}

func (pc *PropertyController) Map(c *gin.Context) {
	cityID := c.Query("city_id")
	if cityID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "city_id is required"})
		return
	}

	resp, err := pc.service.MapStub(cityID)
	if err == services.ErrNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "unknown city"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}
