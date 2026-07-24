package controllers

import (
	"net/http"
	"strconv"

	"github.com/user/playground/middleware"
	"github.com/user/playground/models"
	"github.com/user/playground/services"

	"github.com/gin-gonic/gin"
)

type AuthController struct {
	users *services.UserService
}

func NewAuthController(users *services.UserService) *AuthController {
	return &AuthController{users: users}
}

func (a *AuthController) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email and password are required"})
		return
	}

	user, err := a.users.Authenticate(req.Email, req.Password)
	if err == services.ErrInvalidCredentials {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	token, err := middleware.IssueToken(user.ID, user.Email, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not issue token"})
		return
	}

	c.JSON(http.StatusOK, models.LoginResponse{Token: token, User: user})
}

func (a *AuthController) Me(c *gin.Context) {
	id := c.GetInt64("user_id")
	user, err := a.users.FindByID(id)
	if err == services.ErrNotFound {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, user)
}

type UserController struct {
	users *services.UserService
}

func NewUserController(users *services.UserService) *UserController {
	return &UserController{users: users}
}

func (uc *UserController) List(c *gin.Context) {
	users, err := uc.users.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (uc *UserController) Create(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email, name, and password (min 6) are required"})
		return
	}
	user, err := uc.users.Create(req)
	if err == services.ErrEmailTaken {
		c.JSON(http.StatusConflict, gin.H{"error": "email already taken"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, user)
}

func (uc *UserController) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	actorID := c.GetInt64("user_id")
	if err := uc.users.Delete(id, actorID); err == services.ErrNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	} else if err == services.ErrForbidden {
		c.JSON(http.StatusForbidden, gin.H{"error": "cannot delete yourself"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}
