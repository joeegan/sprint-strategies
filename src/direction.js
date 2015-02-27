var Direction = {
   resolve: function(direction){

      if (typeof lastDirection  == "undefined") {
         lastDirection = null;
      }

      $.on('sequenceInitiated', function(){
         lastDirection = null;
      });

      if (!lastDirection) {
         if (direction == "ALTERNATE-BUY") {
            direction = "BUY";
         } else if (direction == "ALTERNATE-SELL") {
            direction = "SELL";
         }
      } else if (direction == "ALTERNATE-BUY" || direction == "ALTERNATE-SELL"){
         if (lastDirection == "BUY") {
            direction = "SELL";
         } else if (lastDirection == "SELL") {
            direction = "BUY";
         }
      }
      lastDirection  = direction;
      return direction;
   }
};