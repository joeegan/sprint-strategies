var History = (function() {

   var historyIndex = 0;

   $.on('sequenceInitiated', function(event, data) {
      historyIndex = 0;
   });

   $.on('openedTrade', function(event, data) {
      historyIndex++;
      var source   = $("#trade-opened-template").html();
      var template = Handlebars.compile(source);
      data.historyIndex = historyIndex;
      data.stake = numeral(data.size).format('$0,0.00');
      data.openLevel = numeral(data.openLevel).format('0.00');
      data.profitLoss = "...";
      data.closeLevel = "...";
      data.winLose = "...";
      $('#history tbody').append(template(data));
   });

   $.on('tradeComplete', function(event, data) {
      var jqTr = $('#history tr').eq(historyIndex);
      jqTr.addClass(data.win ? 'success' : '');
      jqTr.find('.closeLevel').html(numeral(data.closeLevel).format('0.00')); 
      jqTr.find('.winLose').html(data.win ? 'Win' : 'Lose');
      jqTr.find('.profitLoss').html(numeral(data.profitLoss).format('$0,0.00'));
   });

})();
