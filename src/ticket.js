// validates the form
// submits the form
// takes care of population of tradeStrategies, directionStrategies, and market list
// on submit, creates a set, disables itself, waits for resolution
// allows for manual overide of direction
// 'bail' should resolve the set
// on market change, fires an event which the chart listens too

(function() {

   function Ticket() {
      this.disable();

      // Handle form submit:
      $("form").on('submit', this._handleFormSubmit.bind(this));

      // Handle market change:
      $('#market').on('change', this._handleMarketChange.bind(this));

      $('#stop').on('click', function(ev) {
         $.fire('stopSequence');
         return false;
      });

      $.on('sequenceComplete', function(){
        this.enable();
      }.bind(this));
   }

   /**
    * @type {string}
    */
   // Ticket.SELECTED_MARKET = 'FM.D.USDJPY24.USDJPY24.IP';
   Ticket.SELECTED_MARKET = 'FM.D.EURUSD24.EURUSD24.IP';

   /**
    * @type {Object[]}
    */
   Ticket.prototype.markets = null;

   /**
    * @type {Object}
    */
   Ticket.prototype.currentMarket = undefined;

   /**
    * @type {boolean}
    */
   Ticket.prototype._disabled = true;

   /**
    * @returns {RSVP.Promise}
    */
   Ticket.prototype.initialise = function() {
      return new RSVP.Promise(function(resolve, reject) {
         // Get markets:
         // TEST 371131, UAT 381909
         IG.browse({nodeId: 381909}).then(function(data) {
            // Render markets:
           $('#market').html(data.markets.map(function(market) {
               market.isSelected = market.epic === Ticket.SELECTED_MARKET;
               if (market.isSelected) {
                  this.currentMarket = market;
               }
               var source = $("#ticket-option-template").html();
               var template = Handlebars.compile(source);
               return template(market);
           }.bind(this)).join(''));

            // Enable the form:
            this.enable();

            // Save markets:
            this.markets = data.markets;

            resolve();

         }.bind(this), function(error) {
            warn("Error loading markets!", err);
            reject(error);
         });
      }.bind(this));

   };

   /**
    * @param {boolean} isDisabled
    */
   Ticket.prototype.disable = function(isDisabled) {
      $('input:not(#repeat), select, button:not(#stop)').attr('disabled', isDisabled !== false);
   };

   Ticket.prototype.enable = function() {
      this.disable(false);
      $('#expiry').attr('disabled', 'disabled');
      $('#max-number-of-bets').attr('disabled', 'disabled');
   };

   Ticket.prototype._handleFormSubmit = function() {
      this.disable();
      $('#history tbody').empty();
      var maxNumberOfBets = $('#max-number-of-bets').val();
      var directionStrategy = $('#direction-strategy').val();
      var epic = $('#market').val();
      var formula = $('#trading-strategy').val();
      var initialStake = +$('#initial-stake').val();
      var repeat = !!$('#repeat').is(':checked');
      new Sequence(initialStake, epic, formula, directionStrategy, "TWO_MINUTES", Infinity, repeat).then(function(data) {
         console.log('sequence resolved with', data);
         this.enable();
      }.bind(this));

      $('#history').toggleClass('hidden', false);

      return false;
   };

   Ticket.prototype._handleMarketChange = function() {
      var newMarketEpic = $('#market').val();
      $.fire("currentMarketChange", this.markets.filter(function(market) {
         return market.epic === newMarketEpic;
      })[0]);
   };

   window.Ticket = Ticket;

})();