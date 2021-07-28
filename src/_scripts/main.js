// Main javascript entry point
// Should handle bootstrapping/starting application
'use strict';

import $ from 'jquery';
/* Imports For Map */
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

var tableData = []
var mapData = []
/* API Call*/

$( document ).ready(function() {
  let endpoint = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson'
    $.ajax({
        url: endpoint,
        contentType: "application/json",
        dataType: 'json',
        success: function(result){          
          
          let colorSet = new am4core.ColorSet();

          $.each(result.features, function(index, value) {
            let tData = {}
            let mData = {}
            tData.title = value.properties.title;
            tData.mag = value.properties.mag;        
            tData.url = value.properties.url;        
            tData.Loc = value.properties.place;                
            tData.longitude = value.geometry.coordinates[0];            
            tData.latitude = value.geometry.coordinates[1];  
            tableData.push(tData);
            mData.url = value.properties.url;        
            mData.title = value.properties.title;
            mData.longitude = value.geometry.coordinates[0];            
            mData.latitude = value.geometry.coordinates[1];  
            mData.color = colorSet.next();
            mapData.push(mData);
            
          });

          /* Chart code */
          // Themes begin
          am4core.useTheme(am4themes_animated);
          // Themes end

          // Create map instance
          let chart = am4core.create("chartdiv", am4maps.MapChart);

          // Set map definition
          chart.geodata = am4geodata_worldLow;

          // Set projection
          chart.projection = new am4maps.projections.Miller();

          // Create map polygon series
          let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());

          // Exclude Antartica
          polygonSeries.exclude = ["AQ"];

          // Make map load polygon (like country names) data from GeoJSON
          polygonSeries.useGeodata = true;

          // Configure series
          let polygonTemplate = polygonSeries.mapPolygons.template;
          polygonTemplate.tooltipText = "{name}";
          polygonTemplate.polygon.fillOpacity = 0.6;


          // Create hover state and set alternative fill color
          let hs = polygonTemplate.states.create("hover");
          hs.properties.fill = chart.colors.getIndex(0);

          // Add image series
          let imageSeries = chart.series.push(new am4maps.MapImageSeries());
          imageSeries.mapImages.template.propertyFields.longitude = "longitude";
          imageSeries.mapImages.template.propertyFields.latitude = "latitude";
          imageSeries.mapImages.template.tooltipText = "{title}";
          imageSeries.mapImages.template.propertyFields.url = "url";

          let circle = imageSeries.mapImages.template.createChild(am4core.Circle);
          circle.radius = 3;
          circle.propertyFields.fill = "color";
          circle.nonScaling = true;

          let circle2 = imageSeries.mapImages.template.createChild(am4core.Circle);
          circle2.radius = 3;
          circle2.propertyFields.fill = "color";

          circle2.events.on("inited", function(event){
            animateBullet(event.target);
          })

          function animateBullet(circle) {
            let animation = circle.animate([{ property: "scale", from: 1 / chart.zoomLevel, to: 5 / chart.zoomLevel }, { property: "opacity", from: 1, to: 0 }], 1000, am4core.ease.circleOut);
            animation.events.on("animationended", function(event){
              animateBullet(event.target.object);
            })
          }          

          tableData.sort(function(a, b){
            var a1= parseFloat(a.mag), b1= parseFloat(b.mag);
            if(a1 == b1){ return 0; }
            if(a1 < b1) {
              return -1;
            }else{
              return 1;
            }  
          });          
          
          console.log(tableData);
          
          imageSeries.data = mapData;

        },
        error: function(){
          console.log('error!');
        }
    })
});