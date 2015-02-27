// initiliased when a form is submitted
// expects a directionStategy, strategy, maxNumberOfBets, initialStake, Market
// creates a trade, when that is resolved, another, listens for 'bail' event from ticket.
// when max bets reached, resolves
// when win, resolves

// @param {string} formula The name of the formula to use in Formulae
// @param {boolean} repeat Whether to inifinitely repeat the sequence
var Sequence = (function(stake, epic, formula, directionStrategy, expiry, Infinity, repeat) {
   $.fire('sequenceInitiated');
   var deferred = RSVP.defer();
   var initialStake = stake;
   window.cummulativeStake = 0; 
   var n = 0; // TODO move off window
   var formula = Formulae[formula];
   var stop; // boolean
   $.on('stopSequence', function(ev, data){
      stop = true;
   });

   (function func(stake, epic, directionStrategy, expiry, cummulativeStake) {
      n++;
      new Trade(stake, epic, directionStrategy, expiry).then(function(data) {
         if (data.win) {
            deferred.resolve(data);
            data.closeLevel = window.latestPrice;
            data.repeat = repeat;
            $.fire('tradeComplete', data);
            $.fire('sequenceComplete', data);
         } else {
            console.debug('about to create another one...');
            stake = formula(initialStake, n, data.odds).toFixed(2);
            data.closeLevel = window.latestPrice;
            $.fire('tradeComplete', data);
            if (stop) {
               $.fire('sequenceComplete', data);
            } else {
               func(stake, epic, directionStrategy, expiry);
            }

         }
     });
   })(stake, epic, directionStrategy, expiry);

   return deferred.promise;

});