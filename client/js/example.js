//#region board tile rack interface
//helper
 function getTileTakenMarkup(markerID)
 {
     return "<div class='tileTaken' id='" + markerID + "'></div>"
 }

 function setDraggable(x)
 {
     x.draggable({
         connectToSortable: '.tileRack',
         revert: 'invalid',
         start: function (event, ui) {
             ui.helper.data('rejected', false);
             ui.helper.data('original-position', ui.helper.offset());

         },
         stop: function (event, ui) {
             if (ui && ui.helper)
                 if (ui.helper.data('rejected') === true) {
                     ui.helper.offset(ui.helper.data('original-position'));
                 }
         }
     });    
 }


 $(document).ready(function () {
     $(".boardSpace").droppable({
         accept: '.tile',
         tolerance: 'intersect',
         drop: function (event, ui) {
             //var letter = $(ui.draggable)[0];          
             //var markerID = letter.id + "tileTaken";
             var tid = ui.draggable.attr("id");
             var markerID = tid + "tileTaken";
             var row = $(this).attr("row");
             var col = $(this).attr("col");

             if ($(this).children(".tileTaken").size() > 0) {
                 ui.helper.data('rejected', true);
                 return false;
             }
 
             $('#' + markerID).remove();
             $(this).append(getTileTakenMarkup(markerID));
 
             //$(".tileRack").sortable("destroy");         
             var tileClone =  $(ui.draggable).clone();
             $(this).append(tileClone);
 
             //ui.draggable.remove();  this doesn't work in IE, work around below
             setTimeout(function() { ui.draggable.remove(); }, 5);
 
             //resetSortable();
             setDraggable(tileClone);
             $(tileClone).css("position", "relative").css("left", "0px").css("top", "0px");
         }
     });

     function resetSortable() {

         $(".tileRack").sortable({
             revert: true,
             receive: function(event, ui) {
                 var id = ui.item.attr("id");
                 var markerID = id + "tileTaken";
                 var html = ui.item.html();
                 $(this).append("<div id='" + id + "' class='tile'>" + html + "</div>");
                 $('#' + markerID).remove();
             },

             stop: function(event, ui) {
                 $(".tileRack div.ui-draggable").remove();
             }
         }).disableSelection();                
     }

     $(".tradeSpace").droppable({
         accept: '.tile',
         tolerance: 'fit',
         drop: function (event, ui) {
             //var letter = $(ui.draggable)[0];          
             //var markerID = letter.id + "tileTaken";
             var tid = ui.draggable.attr("id");

             var row = $(this).attr("row");
             var col = $(this).attr("col");

             //$(".tileRack").sortable("destroy");         
             var tileClone =  $(ui.draggable).clone();
             $(this).append(tileClone);
 
             //ui.draggable.remove();  this doesn't work in IE, work around below
             setTimeout(function() { ui.draggable.remove(); }, 5);
 
             setDraggable(tileClone);
             $(tileClone).css("position", "relative").css("left", "0px").css("top", "0px");
         }
     });

     resetSortable();
 });
 //#endregion 

 //#region Scrabble.play()
// once played tile can no longer be moved back
$(".column .tile").draggable("destroy");

console.log($( "#rack" ).sortable( "toArray" )); // to calculate how many tiles to draw at end of turn

//#endregion