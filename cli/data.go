package main

import (
	"encoding/json"
	"net/http"
)

type CloudProvider struct {
	Key         string        `json:"key"`
	DisplayName string        `json:"display_name"`
	Regions     []CloudRegion `json:"regions"`
}

type CloudRegion struct {
	Key         string `json:"key"`
	DisplayName string `json:"display_name"`
	Country     string `json:"country"`
	Location    string `json:"location"`
	Geography   string `json:"geo"`
	PingURL     string `json:"ping_url"`
}

func getCloudProviders() ([]CloudProvider, error) {
	res, err := http.Get("https://webping.cloud/api/regions")
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var providers []CloudProvider
	err = json.NewDecoder(res.Body).Decode(&providers)
	if err != nil {
		return nil, err
	}

	return providers, nil
}
