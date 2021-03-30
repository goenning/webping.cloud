package main

import (
	"fmt"
	"net"
	"net/url"
	"time"
)

func ping(uri string) (time.Duration, error) {
	u, err := url.Parse(uri)
	if err != nil {
		return 0, err
	}

	startTime := time.Now()
	port := u.Port()
	if port == "" {
		if u.Scheme == "https" {
			port = "80"
		} else {
			port = "443"
		}
	}

	_, err = net.DialTimeout("tcp", fmt.Sprintf("%s:%s", u.Hostname(), port), 10*time.Second)
	if err != nil {
		return 0, err
	}

	return time.Now().Sub(startTime), nil
}