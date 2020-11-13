import letters from "./scrabbleLetters.js";
import { getWordTrieStr, getPossibleWords, getWordValues } from "./getRequests.js";
import gridState from "./createGrid.js";

let lettersUsed = 0;
let isZoomed = false;
let fired = false;
let overRack = false;

const bag = _.shuffle(_.shuffle(letters));
let rivalRack = [];

// console.log(JSON.stringify(gridState));
console.log(gridState);

getWordTrieStr();

getWordValues();

function startGame() {
  // $('#rack').empty();
  for (let i = 0; i < 7; i++) {
    let { letter, points } = _.pullAt(bag, [0])[0];
    console.log(letter, points);
    $(`#rack`).append(`
        <div data-drag=${i} class="tile">${letter}<div>${points ? points : ""}</div></div>
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

function zoomOut() {
  $("#board")
    .css({
      height: "412.5px",
      width: "400px",
      "grid-template-columns": "repeat(15, 27.5px)",
      "grid-template-rows": "repeat(15, 27.5px)",
      "justify-content": "center",
      margin: "0 auto",
    })
    .find(".tile")
    .css({
      "font-size": "medium",
    })
    .children("div")
    .css({
      bottom: "9px",
      left: "16px",
      "font-size": "8px",
    });
  isZoomed = false;
}

$("#startGame").click(startGame);
$("#zoomOut").click(zoomOut);

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

      console.count(); //repaint Game/Grid State here
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
    },
    over: function (event, ui) {
      overRack = true;
      fired = false;
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

    if (!isZoomed) {
      $("#board").css({
        height: "705px",
        width: "640px",
        "grid-template-columns": "repeat(15, 52px)",
        "grid-template-rows": "repeat(15, 57px)",
        "justify-content": "safe center",
        margin: "0",
      });
      isZoomed = true;
    }
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
