import letters from "./scrabbleLetters.js";
import { getWordTrieStr, getPossibleWords, getWordValues } from "./getRequests.js";
import { gridState, updateGameState } from "./createGrid.js";
import validate from "./boardValidator.js";

let lettersUsed = 0;
let isZoomed = false;
let fired = false;
// let triggered = false;
let overRack = false;
let firstTurn = true;
let isValidMove = false;

const bag = _.shuffle(_.shuffle(letters));
let rivalRack = [];

console.log(JSON.stringify(gridState));
console.log(gridState);

getWordTrieStr();

getWordValues();

function startGame() {
  // $('#rack').empty();
  for (let i = 0; i < 7; i++) {
    let { letter, points } = _.pullAt(bag, [0])[0];
    console.log(letter, points);
    $(`#rack`).append(`
        <div data-drag=${i} class="tile hot">${letter}<div>${points ? points : ""}</div></div>
        `);
    setDraggable($(`[data-drag="${i}"]`));
  }
  for (let i = 0; i < 7; i++) {
    rivalRack.push(_.pullAt(bag, [0])[0]);
    console.log(rivalRack);
  }
  lettersUsed = 14;
  $("#startGame").attr("disabled", "disabled");
  resetSortable();
}

function repaintBoard() {
  setTimeout(() => {
    updateGameState();
    // console.log(JSON.stringify(gridState.gridLetters));
    isValidMove = validate(gridState, firstTurn);
  }, 0);
}
function bigTile(tile) {
  tile
    .css({
      width: "50px",
      height: "55px",
      "font-weight": "bolder",
      "font-size": "xx-large",
    })
    .children("div")
    .css({
      bottom: "12px",
      left: "32px",
      "font-weight": "bolder",
      "font-size": "small",
    });
}

function smallTile(tile) {
  tile
    .css({
      "font-size": "medium",
    })
    .children("div")
    .css({
      bottom: "9px",
      left: "16px",
      "font-size": "8px",
    });
}

function zoomIn(elm) {
  if (!isZoomed) {
    $("#board").css({
      height: "705px",
      width: "640px",
      "grid-template-columns": "repeat(15, 52px)",
      "grid-template-rows": "repeat(15, 57px)",
      "justify-content": "safe center",
      margin: "0",
    });
    bigTile($("#board .tile"));
    isZoomed = true;
    if (elm) elm.scrollIntoView({ block: "center", inline: "center" });
  }
}

function zoomOut() {
  if (!isZoomed) return;
  $("#board").css({
    height: "412.5px",
    width: "400px",
    "grid-template-columns": "repeat(15, 27.5px)",
    "grid-template-rows": "repeat(15, 27.5px)",
    "justify-content": "center",
    margin: "0 auto",
  });
  smallTile($("#board .tile"));
  isZoomed = false;
}

function swap() {
  console.log("Swap");
  //show player's letters and ask which letters to swap

  //->if cancel
  //    close modal and return

  //->if confirm
  //    remove chosen letters
  //    pick new letters in exchange and place them on player's rack
  //    take chosen letters and insert in to bag
}

function mix() {
  if (!$("#rack .tile").length) return;
  let shuffledRack = _.shuffle($("#rack .tile").toArray());
  $("#rack .tile").remove();
  shuffledRack.forEach((tile) => {
    $("#rack").append(tile);
    setDraggable($(tile));
  });
}

function recall() {
  if (!$(".column .hot").length) return;
  console.log("Recall");
  //remove all "hot" tiles from ".column .hot" and re-add them to player's rack
  let toBeRecalled = $(".column .hot").toArray();
  $(".column .hot").remove();
  toBeRecalled.forEach((tile) => {
    $("#rack").append(tile);
    setDraggable($(tile));
  });
  //trigger draggable "stop" in order to update game's state
  repaintBoard();
}

function play() {
  if (isValidMove !== true) return alert(isValidMove); //TODO: make into modal alert
  console.log("word played");
  //calculate and add points to respective "player"
  //remove "hot" class from ".column .hot" and call pass()
}

function pass(wasClicked = false) {
  console.log("turn passed");
  //if param = true ->
  //    add to passCount
  //if passCount = 4 ->
  //    end game
  //if param = false ->
  //    make sure firstTurn is set to false
  //    reset passCount to equal 0
  //    allow next turn
}

$("#mix").click(() => ($("#rack .tile").length > 1 ? mix() : undefined));
$("#swapRecall").click(() => ($("#swapRecall").text() == "Swap" ? swap() : recall()));
$("#passPlay").click(() => ($("#passPlay").text() == "Play" ? play() : pass(true)));
$("#startGame").click(startGame);
$("#zoomOut").click(zoomOut);
$("#board .column").dblclick((e) => (isZoomed ? zoomOut() : zoomIn(e.target)));

function setDraggable(x) {
  x.draggable({
    connectToSortable: "#rack",
    scroll: false,
    revert: "invalid",
    zIndex: 100,
    stack: ".tile",
    start: function (event, ui) {
      ui.helper.data("rejected", false);
      ui.helper.data("original-position", ui.helper.offset());
    },
    stop: function (event, ui) {
      if (ui && ui.helper)
        if (ui.helper.data("rejected") === true) {
          ui.helper.offset(ui.helper.data("original-position"));
        }

      removeDuplicates();

      console.count(); //repaintBoard Game/Grid State here
      repaintBoard();
    },
  });
}

function resetSortable() {
  $("#rack").sortable({
    placeholder: "ph-class",
    scroll: false,
    tolerance: "intersect",
    revert: 200,
    out: function (event, ui) {
      overRack = false;
      if (isZoomed) return;
      smallTile(ui.item);
    },
    over: function (event, ui) {
      overRack = true;
      fired = false;
      bigTile(ui.item);
    },
  });
  $("#rack").disableSelection();
}

$(".column").droppable({
  accept: ".tile",
  tolerance: "intersect",
  drop: function (ev, ui) {
    if (!fired || overRack) {
      fired = true;
      if (!overRack) $(".tile").css({ left: "0", top: "0" });
      return;
    }

    if ($(this).children(".tile").length > 0) {
      ui.helper.data("rejected", true);
      return false;
    }

    let tileClone = $(ui.draggable);
    $(this).append(tileClone);

    removeDuplicates();

    setDraggable(tileClone);
    $(tileClone).css({
      position: "relative",
      left: "0",
      top: "0",
    });

    zoomIn();
    tileClone[0].scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
  },
});

function removeDuplicates() {
  $(".tile").each((i) => {
    if ($(`[data-drag="${i}"]`).length > 1) {
      $(`[data-drag="${i}"]`).slice(0, -1).remove();
    }
  });
}
