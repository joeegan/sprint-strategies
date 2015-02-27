var Trade = (function(stake, epic, direction, expiryPeriod) {
   cummulativeStake += stake;
   direction = Direction.resolve(direction);

   var bidOffer = (direction == "BUY") ? "BID" : "OFFER";
   window.latestPrice;
   var initialPrice;
   var odds;
   var time = new Date;
   var deferred = RSVP.defer();
   var notifiedListeners = false;
   var data = {
      epic: epic,
      direction: direction,
      size: stake,
      expiryPeriod: expiryPeriod
   };
   var stopped = false;

   $.on('stopSequence', function(){
      stopped = true;
   });

   if (!stopped) {
      IG.createSprintPosition(data).then(function(dealRef) {
         subscribeToBidOdds(dealRef);
      }, errorHandler);
   }

   function errorHandler(errMsg) {
      warn(i18n(errMsg.responseJSON.errorCode));
   }

   function subscribeToBidOdds(dealRef) {
      IG.subscribe('foo', 'MERGE', ["MARKET:" + epic], ['BID', 'ODDS'], function() {}, function(updateInfo) {

         updateInfo.forEachField(function(fieldName, fieldPos, value) {
            if (fieldName == 'BID') {
               if (!initialPrice) {
                  initialPrice = value;
               }
               latestPrice = value;
            } else if (fieldName == 'ODDS') {
               odds = value;
            }
         }.bind(this));
         if (!notifiedListeners) {
            data.openLevel = initialPrice;
            $.fire('openedTrade', data);
            notifiedListeners = true;
            lastDirection = direction;
         }
      }.bind(this));
      determineOutcome();
   }

   function determineOutcome(){
      var win = false;
      setTimeout(function(){
         if (direction == "BUY") {
            win = latestPrice > initialPrice;
         } else if (direction == "SELL") {
            win = initialPrice > latestPrice;
         }
         // TEMP FORCE OF FIRST 4 TRADES TO LOSE
         // if (n < 5) {
         //    win = false;
         // } else {
         //    win = true;
         // }
         console.debug('outcome is:', win ? 'WIN' : 'LOSE');
         var payout = win ? stake/odds : 0;
         console.debug('payout', payout);

         deferred.resolve({
            win: win,
            profitLoss: payout - cummulativeStake,
            payout: payout, // payout of last winning trade
            direction: direction,
            stake: stake,
            time: time,
            latestPrice: latestPrice,
            odds: odds
         })
      // THIS SHOULD BE 10000
      }, 125000);
   }

   return deferred.promise;

});

