
/**
 * @constructor
 * @name Chart
 */
function Chart(cssSelector, epic) {
   this._cssSelector = cssSelector;
   this._epic = epic;
   this._initialise();

   $.on('currentMarketChange', function(event, market) {
      this._epic = market.epic;
      IG.unsubscribe('CHART');
      this._initialise();
   }.bind(this));

   var lastPlotLine;

   $.on('tradeComplete', function(event, data) {
      $('#chart').highcharts().yAxis[0].removePlotBand('positionBand');
      $('#chart').highcharts().yAxis[0].removePlotLine('positionLine');
   });

   $.on('openedTrade', function(event, data){
      var yAxis = $('#chart').highcharts().yAxis[0];
      yAxis.addPlotBand({
         id: 'positionBand',
         color: 'rgba(100,100,100,0.5)',
         from: data.direction === "BUY" ? data.openLevel : yAxis.min,
         to: data.direction === "BUY" ? yAxis.max: data.openLevel
      });
      lastPlotLine = {
         id: 'positionLine',
         value: data.openLevel,
         width: 1,
         color: 'red',
         dashStyle: 'dash',
         label: {
            align: 'right',
            y: 20,
            x: 0,
            style: {
               color: '#F5F5F5' 
            }
        }
     };
     yAxis.addPlotLine(lastPlotLine);
   }.bind(this));

   Highcharts.setOptions({
      global : {
         useUTC : false
      }
   });
}

Chart.prototype._initialise = function() {
   this._getData().then(this._render.bind(this));
   // var date = new Date().getTime();
   // var data = [];
   // for (var i = 20; i > 0; i--) {
   //    data.push([date - i * 1000, 0]);
   // }
   // this._render(data);
};

/**
 * @returns {RSVP.Promise}
 */
Chart.prototype._getData = function() {
  return new RSVP.Promise(function(resolve, reject) {
    IG.priceSearchByNumV2({
      epic: this._epic,
      resolution: 'MINUTE',
      numPoints: 30
    }).then(function(data) {
      var prices = data.prices;
      var snapshot = [];
      for (var i = 0, l = prices.length; i < l; i++) {
        var timeSplitA = prices[i].snapshotTime.split(':');
        var timeSplitB = timeSplitA[2].split('-');
        // var date = new Date(timeSplitA[0], timeSplitA[1], timeSplitB[0], timeSplitB[1], timeSplitA[3], timeSplitA[4]);
        var date = new Date();
        var x = date.getTime() - (prices.length - i) * 1000;
        var y = prices[i].closePrice.bid;
        snapshot.push([x, y]);
        console.debug("Added snapshot item", date, x, y);
      }
      return resolve(snapshot);
    }, function(err) {
        warn(i18n(err.responseJSON.errorCode));
        resolve([]);
    });
  }.bind(this));
};

/**
 * @param {Object}
 */
Chart.prototype._render = function(snapshot) {
   var epic = this._epic;
   $(this._cssSelector).highcharts('StockChart', {
      chart: {
         animation: true,
         backgroundColor: '#3A3A38',
         events : {
            load : function () {
               var series = this.series[0];
               var fids = ['BID'];
               var keys = ['MARKET:' + epic];
               console.debug("Subscribing to", keys, fids);
               var chartSubscription = IG.subscribe('CHART', 'MERGE', keys, fids, null, function(itemUpdate) {
                  var date = new Date();
                  var x = date.getTime(),
                      y = +itemUpdate.getValue('BID');
                  console.debug("Added streamed item update", date, x, y);
                  series.addPoint([x, y], true, true, true);
               });
           }
         }
      },
      rangeSelector: {
        enabled: false
      },
      navigator : {
        enabled : false
      },
      exporting: {
        enabled: false
      },
      scrollbar : {
        enabled : false
      },
      tooltip: {
         enabled: false
      },
      xAxis: {
         dateTimeLabelFormats: {
            millisecond: '%H:%M:%S'
         },
         tickInterval: 3 * 1000
      },
      series : [{
         name : 'Price',
         data : (function () {
            return snapshot;
         }())
      }]
   });
};

/**
 * @param {String}
 * @returns {Chart}
 */
Chart.create = function(cssSelector, epic) {
  return new Chart(cssSelector, epic);
};