package main

import (
	"fmt"
	"sort"
	"time"

	"github.com/fatih/color"
	"github.com/inancgumus/screen"
	"github.com/rodaine/table"
)

type LatencyTest struct {
	Provider CloudProvider
	Region CloudRegion
	Duration time.Duration
}


func main() {
	results := make(map[string]LatencyTest, 0)
	providers, err := getCloudProviders()
	if err != nil {
		panic(err)
	}

	for _, provider := range providers {
		for _, region := range provider.Regions {

			d, err := ping(region.PingURL)
			if err != nil {
				//TODO: handle this better, show that there was an error
				continue
			}

			id := fmt.Sprintf("%s-%s", provider.Key, region.Key)
			results[id] = LatencyTest{Provider: provider, Region: region, Duration: d}

			headerFmt := color.New(color.FgGreen, color.Underline).SprintfFunc()
			columnFmt := color.New(color.FgYellow).SprintfFunc()

			tbl := table.New("Cloud", "Region", "Location", "Latency")
			tbl.WithHeaderFormatter(headerFmt).WithFirstColumnFormatter(columnFmt)
			
			rows := make([]LatencyTest, 0)
			for _, r := range results {
				rows = append(rows, r)
			}

			sort.Slice(rows, func(i, j int) bool {
					return rows[i].Duration > rows[j].Duration
			})

			for _, row := range rows {
				tbl.AddRow(row.Provider.Key, row.Region.Key, fmt.Sprintf("%s (%s)", row.Region.Location, row.Region.Country), row.Duration)
			}

			screen.Clear()
			screen.MoveTopLeft()
			tbl.Print()
		}
	}
}