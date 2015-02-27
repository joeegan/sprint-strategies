(function() {

   // TEST creds
   // var apiUrl = 'https://net-api.ig.com/gateway/deal';
   // var apiKey = '964c5e63488f7086c7f91719f4a9d2c79ce2443b';
   // var identifier = 'bigfootigs';
   // var defaultAccount = 'PAY67';
   // var password = 'TheSpine5';

   // UAT creds
   var apiUrl = 'https://web-api.ig.com/gateway/deal';
   var apiKey = 'f5ec2bae934ace442a570fcbb417ecf5aec4a642';
   var identifier = 'BIGFOOTUATFEB';
   var defaultAccount = 'PZWTC';
   var password = 'Qazqaz123';

   function App() {}

   /**
    * @type {}
    */
   App.prototype._loggedIn = false;

   /**
    * @returns {RSVP.Promise}
    */
   App.prototype._login = function() {
      // Sets the environment to TEST.
      IG.setUrl(apiUrl);
      console.debug('Logging in...');
      return RSVP.Promise.resolve(IG.authenticate({
         identifier: identifier,
         password: password,
         vendorKey: apiKey
      })).then(function() {
         console.debug('Logged in successfully.');
         this._loggedIn = true;
      }.bind(this));
   };

   /**
    * @returns {RSVP.Promise}
    */
   App.prototype._connectToLightstreamer = function() {
      return new RSVP.Promise(function(resolve, reject) {
         console.debug("Connecting to LS...");
         if (!this._loggedIn) {
            throw new Error('Log in first!');
         }
         IG.connectToLightstreamer(function() {
            console.debug("LS listen start:", arguments);
         }, function(status) {
            console.debug("LS status change:", status);
            if (status.indexOf('STREAMING') !== -1) {
               resolve();
            }
         });
      }.bind(this));
   };

   /**
    * @returns {RSVP.Promise}
    */
   App.prototype.initialise = function() {
      return this._login().then(function() {
         return this._connectToLightstreamer();
      }.bind(this));
   };

   window.App = App;

})();

$(function() {

   var app = new App();
   var ticket = new Ticket();
   numeral.language('en-gb');

   window.warn = function(msg) {
      $('.warn').toggleClass('hidden', false).find('p').html(msg);
   }

   app.initialise().then(function() {
      Chart.create('#chart', Ticket.SELECTED_MARKET);
      return ticket.initialise(); 
   }).then(function() {
      if (!ticket.currentMarket) {
         throw new Error('No current market available!');
      }
      var sessionPl = 0;
      ticket.initialise();
      $.on('sequenceComplete', function(event, data){
         sessionPl += data.profitLoss;
         $('#sessionPl').html(numeral(sessionPl).format('$0,0.00'));
         if (data.repeat) {
            setTimeout(function(){
               ticket._handleFormSubmit();
            }.bind(this), 1000);
         }
      });
   }).catch(function(error) {
      console.error(error);
   });
});

