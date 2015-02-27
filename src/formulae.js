var Formulae = {
   "martingale": function(initialStake, n, odds){

      function multiplier(odds) {
         return 1 / (1 - odds);
      }

      return initialStake * Math.pow(multiplier(odds), n);
   },

   "grand-martingale": function(initialStake, n, odds){

      function multiplier(odds) {
         return 1 / (1 - odds);
      }

      var geometricProgressionMultiplier = (1 - Math.pow(multiplier(odds), n )) / (1 - multiplier(odds));

      return initialStake * ((multiplier(odds) * geometricProgressionMultiplier) + 1);
   }


}