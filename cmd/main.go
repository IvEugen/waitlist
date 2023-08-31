package main

import (
	"fmt"
	"time"

	"waitlist/internal/serv"

	"go.uber.org/zap"
)

// To display information on the application build, you must use: go run -ldflags "-X main.buildVersion=v1.0.1" main.go
var (
	buildVersion string = "N/A"
	buildCommit  string = "N/A"
)

func main() {
	dt := time.Now()
	buildDate := dt.Format("02-01-2006 15:04")
	fmt.Printf("Build version: %s\nBuild date: %s\nBuild commit: %s\n", buildVersion, buildDate, buildCommit)

	// Инициализация логгера Zap
	logger, _ := zap.NewDevelopment()
	defer logger.Sync()
	undo := zap.ReplaceGlobals(logger)
	defer undo()

	// Запуск веб-сервера и клиента gRPC
	serv.Run()
}
